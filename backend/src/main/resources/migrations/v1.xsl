<?xml version="1.0" encoding="UTF-8"?>
<!--
  Schema version 1 — baseline export format.

  Each exported table file looks like:
    <table name="<table_name>" version="1">
      <row>
        <column_name javaType="Integer|Long|Boolean|Date|Time|Timestamp|String">value</column_name>
        <nullable_col nil="true"/>
      </row>
      ...
    </table>

  This is an identity transform — it serves as the v1 schema anchor.
  To migrate from v1 to v2, add migrations/v1_to_v2.xsl to the classpath.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
