package com.planner.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.*;
import javax.xml.parsers.*;
import javax.xml.transform.*;
import javax.xml.transform.dom.*;
import javax.xml.transform.stream.*;
import java.io.*;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.*;

@Service
public class AdminService {

    static final int CURRENT_VERSION = 1;

    private static final List<String> INSERT_ORDER = List.of(
            "annex", "groups", "teacher", "child",
            "rule", "annex_teacher", "annex_group", "annex_rule",
            "annex_child_group", "time_block", "annex_time_block",
            "time_block_modification_group", "time_block_modification", "closed_day"
    );

    private static final List<String> DELETE_ORDER = List.of(
            "time_block_modification", "annex_time_block",
            "time_block_modification_group", "time_block",
            "annex_child_group", "annex_rule", "annex_group", "annex_teacher",
            "rule", "annex", "child", "teacher", "groups", "closed_day"
    );

    private final JdbcTemplate jdbc;

    public AdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public byte[] exportDatabase() throws IOException {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos)) {
                zos.putNextEntry(new ZipEntry("export-metadata.xml"));
                zos.write(buildMetadataXml());
                zos.closeEntry();

                for (String table : INSERT_ORDER) {
                    List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM " + table);
                    zos.putNextEntry(new ZipEntry(table + ".xml"));
                    zos.write(buildTableXml(table, rows));
                    zos.closeEntry();
                }

                zos.putNextEntry(new ZipEntry("migrations/v1.xsl"));
                zos.write(loadResource("/migrations/v1.xsl"));
                zos.closeEntry();
            }
            return baos.toByteArray();
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            throw new IOException("Export failed", e);
        }
    }

    @Transactional
    public void importDatabase(InputStream inputStream) throws IOException {
        try {
            Map<String, byte[]> entries = readZipEntries(inputStream);
            clearDatabase();
            for (String table : INSERT_ORDER) {
                byte[] xmlData = entries.get(table + ".xml");
                if (xmlData == null) continue;
                Document doc = parseXml(xmlData);
                int version = Integer.parseInt(doc.getDocumentElement().getAttribute("version"));
                doc = applyMigrations(doc, version);
                List<Map<String, Object>> rows = parseTableXml(doc);
                if (!rows.isEmpty()) insertRows(table, rows);
            }
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            throw new IOException("Import failed", e);
        }
    }

    @Transactional
    public void clearDatabase() {
        for (String table : DELETE_ORDER) {
            jdbc.update("DELETE FROM " + table);
        }
    }

    private byte[] buildMetadataXml() throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        Document doc = dbf.newDocumentBuilder().newDocument();
        Element root = doc.createElement("export-metadata");
        root.setAttribute("version", String.valueOf(CURRENT_VERSION));
        doc.appendChild(root);
        return domToBytes(doc);
    }

    private byte[] buildTableXml(String tableName, List<Map<String, Object>> rows) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        Document doc = dbf.newDocumentBuilder().newDocument();
        Element root = doc.createElement("table");
        root.setAttribute("name", tableName);
        root.setAttribute("version", String.valueOf(CURRENT_VERSION));
        doc.appendChild(root);

        for (Map<String, Object> row : rows) {
            Element rowEl = doc.createElement("row");
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                Element col = doc.createElement(entry.getKey().toLowerCase());
                if (entry.getValue() == null) {
                    col.setAttribute("nil", "true");
                } else {
                    col.setAttribute("javaType", entry.getValue().getClass().getSimpleName());
                    col.setTextContent(entry.getValue().toString());
                }
                rowEl.appendChild(col);
            }
            root.appendChild(rowEl);
        }

        return domToBytes(doc);
    }

    // Applies XSLT migration chain from fromVersion up to CURRENT_VERSION.
    // Each step expects a classpath resource at /migrations/v{n}_to_v{n+1}.xsl.
    private Document applyMigrations(Document doc, int fromVersion) throws Exception {
        for (int v = fromVersion; v < CURRENT_VERSION; v++) {
            String resourcePath = "/migrations/v" + v + "_to_v" + (v + 1) + ".xsl";
            try (InputStream xsltStream = getClass().getResourceAsStream(resourcePath)) {
                if (xsltStream == null) {
                    throw new IllegalStateException("Missing migration XSLT: " + resourcePath);
                }
                TransformerFactory tf = TransformerFactory.newInstance();
                Transformer transformer = tf.newTransformer(new StreamSource(xsltStream));
                DOMResult result = new DOMResult();
                transformer.transform(new DOMSource(doc), result);
                doc = (Document) result.getNode();
            }
        }
        return doc;
    }

    private List<Map<String, Object>> parseTableXml(Document doc) {
        List<Map<String, Object>> rows = new ArrayList<>();
        NodeList rowNodes = doc.getDocumentElement().getElementsByTagName("row");
        for (int i = 0; i < rowNodes.getLength(); i++) {
            Element rowEl = (Element) rowNodes.item(i);
            Map<String, Object> row = new LinkedHashMap<>();
            NodeList cols = rowEl.getChildNodes();
            for (int j = 0; j < cols.getLength(); j++) {
                if (cols.item(j).getNodeType() != Node.ELEMENT_NODE) continue;
                Element col = (Element) cols.item(j);
                if ("true".equals(col.getAttribute("nil"))) {
                    row.put(col.getTagName(), null);
                } else {
                    row.put(col.getTagName(), convertValue(col.getTextContent(), col.getAttribute("javaType")));
                }
            }
            rows.add(row);
        }
        return rows;
    }

    private Object convertValue(String text, String javaType) {
        return switch (javaType) {
            case "Integer" -> Integer.parseInt(text);
            case "Long" -> Long.parseLong(text);
            case "Boolean" -> Boolean.parseBoolean(text);
            case "Date" -> Date.valueOf(text);
            case "Time" -> Time.valueOf(text);
            case "Timestamp" -> Timestamp.valueOf(text);
            default -> text;
        };
    }

    private Map<String, byte[]> readZipEntries(InputStream inputStream) throws IOException {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        try (ZipInputStream zis = new ZipInputStream(inputStream)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entries.put(entry.getName(), zis.readAllBytes());
                zis.closeEntry();
            }
        }
        return entries;
    }

    private Document parseXml(byte[] data) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        return dbf.newDocumentBuilder().parse(new ByteArrayInputStream(data));
    }

    private byte[] domToBytes(Document doc) throws TransformerException {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        transformer.transform(new DOMSource(doc), new StreamResult(baos));
        return baos.toByteArray();
    }

    private byte[] loadResource(String path) throws IOException {
        try (InputStream is = getClass().getResourceAsStream(path)) {
            if (is == null) throw new IOException("Resource not found: " + path);
            return is.readAllBytes();
        }
    }

    private void insertRows(String table, List<Map<String, Object>> rows) {
        Map<String, Object> first = rows.get(0);
        String cols = String.join(", ", first.keySet());
        String placeholders = first.keySet().stream().map(k -> "?").collect(Collectors.joining(", "));
        String sql = "INSERT INTO " + table + " (" + cols + ") VALUES (" + placeholders + ")";
        List<Object[]> batchArgs = rows.stream()
                .map(row -> row.values().toArray())
                .toList();
        jdbc.batchUpdate(sql, batchArgs);
    }
}
