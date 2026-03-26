const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const BACKEND_PORT = 8080;
const FRONTEND_URL = `http://localhost:3000`;

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

function waitForBackend(callback, retries = 20) {
  const http = require('http');
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

  mainWindow.loadURL(FRONTEND_URL);
}

app.whenReady().then(() => {
  startBackend();
  waitForBackend(createWindow);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});
