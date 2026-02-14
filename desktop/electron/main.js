const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
let viteProcess = null;
let backendPort = 18723;
let vitePort = 5173;
const isDev = !app.isPackaged;

// ─── Python Backend ───────────────────────────────────────────

function startBackend() {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const backendDir = isDev
      ? path.join(__dirname, '..', 'backend')
      : path.join(process.resourcesPath, 'backend');
    const backendPath = isDev
      ? path.join(backendDir, 'main.py')
      : path.join(backendDir, 'streamrip-backend');

    const args = isDev
      ? [backendPath, '--port', String(backendPort)]
      : ['--port', String(backendPort)];
    const cmd = isDev ? pythonCmd : backendPath;

    console.log(`[Streamrip] Starting backend: ${cmd} ${args.join(' ')}`);

    backendProcess = spawn(cmd, args, {
      cwd: backendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Backend]', output.trim());
      if (output.includes('BACKEND_READY')) {
        const portMatch = output.match(/PORT=(\d+)/);
        if (portMatch) backendPort = parseInt(portMatch[1]);
        resolve(backendPort);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line) console.log('[Backend]', line);
    });

    backendProcess.on('error', (err) => {
      console.error('[Streamrip] Failed to start backend:', err.message);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Streamrip] Backend exited (code ${code})`);
      backendProcess = null;
    });

    setTimeout(() => resolve(backendPort), 10000);
  });
}

// ─── Vite Dev Server (dev mode only) ──────────────────────────

function startVite() {
  return new Promise((resolve, reject) => {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    console.log('[Streamrip] Starting Vite dev server...');

    viteProcess = spawn(npxCmd, ['vite', '--port', String(vitePort), '--strictPort'], {
      cwd: frontendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: process.platform === 'win32',
    });

    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Vite]', output.trim());
      if (output.includes('Local:') || output.includes('localhost')) {
        // Vite is ready
        setTimeout(() => resolve(vitePort), 500);
      }
    });

    viteProcess.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line) console.log('[Vite]', line);
    });

    viteProcess.on('error', (err) => {
      console.error('[Streamrip] Failed to start Vite:', err.message);
      reject(err);
    });

    viteProcess.on('exit', (code) => {
      console.log(`[Streamrip] Vite exited (code ${code})`);
      viteProcess = null;
    });

    setTimeout(() => resolve(vitePort), 15000);
  });
}

// ─── Wait for a URL to respond ────────────────────────────────

function waitForUrl(url, maxAttempts = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(url, (res) => {
        resolve(true);
      }).on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, 500);
        } else {
          resolve(false);
        }
      });
    };
    check();
  });
}

// ─── Stop All Processes ───────────────────────────────────────

function killProcess(proc, name) {
  if (!proc) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
    console.log(`[Streamrip] Stopped ${name}`);
  } catch {
    // already dead
  }
}

function stopAll() {
  killProcess(backendProcess, 'backend');
  killProcess(viteProcess, 'vite');
  backendProcess = null;
  viteProcess = null;
}

// ─── Window ───────────────────────────────────────────────────

async function createWindow() {
  const iconPath = path.join(__dirname, '..', 'frontend', 'public', 'logo.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#06060b',
    icon: iconPath,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${vitePort}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-folder', (_, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.handle('get-backend-port', () => backendPort);
ipcMain.handle('get-platform', () => process.platform);

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window-close', () => {
  mainWindow?.close();
});
ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// ─── App Lifecycle ────────────────────────────────────────────

app.whenReady().then(async () => {
  console.log('[Streamrip] Starting app...');
  console.log(`[Streamrip] Mode: ${isDev ? 'development' : 'production'}`);

  // 1) Start Python backend
  try {
    await startBackend();
    console.log(`[Streamrip] Backend ready on port ${backendPort}`);
  } catch (err) {
    console.error('[Streamrip] Backend failed:', err.message);
  }

  // 2) In dev mode, start Vite dev server automatically
  if (isDev) {
    try {
      await startVite();
      console.log(`[Streamrip] Vite starting on port ${vitePort}...`);
      // Wait until Vite is actually responding
      const viteReady = await waitForUrl(`http://localhost:${vitePort}`, 40);
      if (viteReady) {
        console.log('[Streamrip] Vite dev server ready');
      } else {
        console.warn('[Streamrip] Vite may not be ready yet, opening window anyway');
      }
    } catch (err) {
      console.error('[Streamrip] Vite failed:', err.message);
    }
  }

  // 3) Open window
  await createWindow();
  console.log('[Streamrip] Window opened');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopAll();
});
