import { BrowserWindow, ipcMain } from "electron";

/**
 * @description 打开目录面板
 */
export const showDirectoryPanel = () => {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('show-directory-panel')
  return true
}
