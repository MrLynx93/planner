const { app, BrowserWindow } = require('electron');
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

const BACKEND_PORT = 8080;
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
  return path.join(process.resourcesPath, 'jre', 'bin', 'java');
}

function startBackend() {
  if (process.env.EXTERNAL_BACKEND === 'true') return;

  const java = getJavaExecutable();
  const jarPath = app.isPackaged
    ? path.join(process.resourcesPath, 'planner-backend.jar')
    : path.join(__dirname, 'planner-backend.jar');

  const args = app.isPackaged
    ? ['-jar', jarPath, '--spring.profiles.active=sqlite']
    : ['-jar', jarPath, '--spring.profiles.active=h2'];

  if (app.isPackaged) {
    const dbPath = path.join(app.getPath('userData'), 'planner.db').replace(/\\/g, '/');
    args.push(`--spring.datasource.url=jdbc:sqlite:${dbPath}`);
  } else if (process.env.CLEAN === 'true') {
    args.push('--spring.datasource.url=jdbc:h2:mem:planner;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE');
  }

  log('Starting backend:', java, args.join(' '));
  log('JAR exists:', fs.existsSync(jarPath));

  backendProcess = spawn(java, args, { stdio: ['ignore', 'pipe', 'pipe'] });

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

function waitForBackend(callback, retries = 60) {
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
}

app.whenReady().then(() => {
  log('App ready. isPackaged:', app.isPackaged);
  log('resourcesPath:', process.resourcesPath);
  startFrontendServer();
  startBackend();
  waitForBackend(createWindow);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});
