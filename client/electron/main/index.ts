import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { menuConfig } from '../preload/menu';
import fs from 'fs';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

async function createWindow() {
  win = new BrowserWindow({
    title: 'Cherry',
    width: 1380,
    height: 760,
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  win.webContents.on('did-finish-load', () => {
    /**
     * @description Windows 直接打开文件
     * @param status -1 读取文件失败; -2 取消读取; 0 读取成功
     * @param message 读取文件失败的原因
     * @param data 读取成功的文件内容
     * @param filePath 读取成功的文件路径
     */
    try {
      if (process.argv.length > 1 && fs.statSync(process.argv[1]).isFile() && process.argv[1].endsWith('.md')) {
        win?.webContents.send('open_file', {
          status: 0,
          message: 'success',
          data: fs.readFileSync(process.argv[1]).toString(),
          filePath: process.argv[1]
        });
      }
    } catch (error) {
      win?.webContents.send('open_file', {
        status: -1,
        message: error.message,
        data: '',
        filePath: ''
      });
    }
  });

  // mac 打开文件
  app.on('open-file', (event, path) => {
    event.preventDefault();
    if (path.endsWith('.md')) {
      win?.webContents.send('open_file', {
        status: 0,
        message: 'success',
        data: fs.readFileSync(path).toString(),
        filePath: path
      });
    }else{
      win?.webContents.send('open_file', {
        status: -1,
        message: '文件格式不支持',
        data: '',
        filePath: ''
      });
    }
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
  const menu = Menu.buildFromTemplate(menuConfig)
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
