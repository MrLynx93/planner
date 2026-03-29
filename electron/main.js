const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT = 8080;
const FRONTEND_PORT = 3000;
const DIST_PATH = path.join(__dirname, '../frontend/dist');

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

function startBackend() {
  const jarPath = path.join(__dirname, 'planner-backend.jar');
  backendProcess = spawn('java', ['-jar', jarPath, '--spring.profiles.active=h2'], {
    stdio: 'ignore',
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
}

function startFrontendServer() {
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

    let filePath = path.join(DIST_PATH, req.url === '/' ? 'index.html' : req.url);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_PATH, 'index.html');
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
    console.error('Backend did not start in time');
    return;
  }
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
