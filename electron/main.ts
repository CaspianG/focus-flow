import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
const isDev = !app.isPackaged;
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.exit(0);
}

const writeLaunchLog = (message: string) => {
  try {
    const logPath = path.join(app.getPath('userData'), 'launch.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    // Ignore logging failures to avoid blocking app startup.
  }
};

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1120,
    minHeight: 760,
    show: false,
    backgroundColor: '#f3ece3',
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    titleBarOverlay:
      process.platform === 'win32'
        ? {
            color: '#f5efe7',
            symbolColor: '#463c33',
            height: 40,
          }
        : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => {
    writeLaunchLog('window ready-to-show');
    window.show();
  });

  window.webContents.on('did-start-loading', () => {
    writeLaunchLog('renderer started loading');
  });

  window.webContents.on('did-finish-load', () => {
    writeLaunchLog(`renderer finished loading title="${window.getTitle()}"`);
  });

  window.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      writeLaunchLog(
        `did-fail-load code=${errorCode} description="${errorDescription}" url="${validatedURL}" mainFrame=${isMainFrame}`,
      );
      window.show();
    },
  );

  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    writeLaunchLog(`preload-error path="${preloadPath}" error="${error.message}"`);
  });

  window.webContents.on('render-process-gone', (_event, details) => {
    writeLaunchLog(
      `render-process-gone reason="${details.reason}" exitCode=${details.exitCode}`,
    );
  });

  window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    writeLaunchLog(
      `console-message level=${level} source="${sourceId}" line=${line} message="${message}"`,
    );
  });

  if (isDev) {
    writeLaunchLog('loading dev renderer');
    void window.loadURL('http://127.0.0.1:5173');
    return;
  }

  writeLaunchLog('loading packaged renderer');
  void window.loadFile(path.join(__dirname, '../dist/index.html'));
};

const focusExistingWindow = () => {
  const [window] = BrowserWindow.getAllWindows();

  if (!window) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
};

app.on('second-instance', () => {
  writeLaunchLog('second-instance received; focusing existing window');
  focusExistingWindow();
});

app.whenReady().then(() => {
  writeLaunchLog('app ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

process.on('uncaughtException', (error) => {
  writeLaunchLog(`uncaughtException "${error.stack ?? error.message}"`);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
