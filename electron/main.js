const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

let logStream = null;

process.on('uncaughtException', (err) => {
  log('Uncaught exception:', err.message);
});

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  process.stdout.write(line);
  if (logStream) logStream.write(line);
}

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });
  const logPath = path.join(userDataPath, 'planner.log');
  logStream = fs.createWriteStream(logPath, { flags: 'w' });
  log('App starting. Log file:', logPath);
});

const BACKEND_PORT = app.isPackaged ? 48080 : 8080;
const FRONTEND_PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

let backendProcess = null;
let mainWindow = null;

function getDistPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'frontend')
    : path.join(__dirname, '../frontend/dist');
}

function getJavaExecutable() {
  if (!app.isPackaged) return 'java';
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(process.resourcesPath, 'jre', 'bin', `java${ext}`);
}

function startBackend() {
  if (process.env.EXTERNAL_BACKEND === 'true') return;

  const java = getJavaExecutable();
  const jarPath = app.isPackaged
    ? path.join(process.resourcesPath, 'planner-backend.jar')
    : path.join(__dirname, 'planner-backend.jar');

  const args = app.isPackaged
    ? ['-XX:TieredStopAtLevel=1', '-Xms64m', '-Xmx512m', '-XX:+UseSerialGC',
       '-Djava.awt.headless=true', '-Dspring.jmx.enabled=false',
       '-jar', jarPath, '--spring.profiles.active=sqlite']
    : ['-jar', jarPath, '--spring.profiles.active=h2'];

  if (app.isPackaged) {
    const dbPath = path.join(app.getPath('userData'), 'planner.db').replace(/\\/g, '/');
    args.push(`--spring.datasource.url=jdbc:sqlite:${dbPath}`);
    args.push(`--server.port=${BACKEND_PORT}`);
  } else if (process.env.CLEAN === 'true') {
    args.push('--spring.datasource.url=jdbc:h2:mem:planner;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE');
  }

  log('Starting backend:', java, args.join(' '));
  log('JAR exists:', fs.existsSync(jarPath));

  backendProcess = spawn(java, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (d) => log('[backend]', d.toString().trim()));
  backendProcess.stderr.on('data', (d) => log('[backend]', d.toString().trim()));
  backendProcess.on('error', (err) => log('Failed to start backend:', err.message));
  backendProcess.on('exit', (code) => log('Backend exited with code:', code));
}

function startFrontendServer() {
  const distPath = getDistPath();
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api')) {
      const options = {
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${BACKEND_PORT}` },
      };
      const proxy = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxy.on('error', () => {
        res.writeHead(502);
        res.end('Bad Gateway');
      });
      req.pipe(proxy);
      return;
    }

    let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('Port', FRONTEND_PORT, 'already in use — skipping frontend server, assuming it is already running');
    } else {
      log('Frontend server error:', err.message);
    }
  });

  server.listen(FRONTEND_PORT);
}

function waitForBackend(callback, retries = 120) {
  const req = http.get(`http://localhost:${BACKEND_PORT}/actuator/health`, (res) => {
    if (res.statusCode === 200) {
      callback();
    } else {
      retry(callback, retries);
    }
  });
  req.on('error', () => retry(callback, retries));
  req.end();
}

function retry(callback, retries) {
  if (retries <= 0) {
    log('Backend did not start in time');
    return;
  }
  if (retries % 10 === 0) log(`Waiting for backend... (${retries} retries left)`);
  setTimeout(() => waitForBackend(callback, retries - 1), 1000);
}

const LOADING_PAGE = `data:text/html;base64,${Buffer.from(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; display: flex; flex-direction: column; align-items: center;
         justify-content: center; height: 100vh; background: #f8fafc;
         font-family: -apple-system, sans-serif; color: #64748b; }
  .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0;
             border-top-color: #6366f1; border-radius: 50%;
             animation: spin 0.8s linear infinite; margin-bottom: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { font-size: 14px; }
</style>
</head>
<body><div class="spinner"></div><p>Uruchamianie…</p></body>
</html>`).toString('base64')}`;

ipcMain.handle('print-to-pdf', async (_event, html, defaultFileName) => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } });

  await new Promise((resolve, reject) => {
    win.webContents.once('did-finish-load', resolve);
    win.webContents.once('did-fail-load', (_e, code, desc) => reject(new Error(`${code}: ${desc}`)));
    win.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
  });

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      win.webContents.print({ silent: false, printBackground: true, landscape: true }, () => resolve());
    });
    win.close();
    return;
  }

  const pdfBuffer = await win.webContents.printToPDF({ landscape: true, pageSize: 'A4', printBackground: true });
  win.close();

  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `${defaultFileName ?? 'plan'}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  if (filePath) fs.writeFileSync(filePath, pdfBuffer);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(LOADING_PAGE);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  log('App ready. isPackaged:', app.isPackaged);
  log('resourcesPath:', process.resourcesPath);
  startFrontendServer();
  startBackend();
  createWindow();
  waitForBackend(() => mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`));
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});
