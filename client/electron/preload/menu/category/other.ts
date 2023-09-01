import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, MenuItemConstructorOptions, shell } from "electron"
import packageInfo from "../../../../package.json"

/**
 * @description 版本信息
 */
export const info = () => {
  dialog.showMessageBox({
    title: ' Cherry Noted',
    type: 'info',
    message: '一个桌面端Markdown Noted',
    detail: `版本信息：${packageInfo.version}\n说明:测试版`,
    noLink: true,
    buttons: ['确定', '项目地址'],
  }).then((res) => {
    if (res.response === 1) {
      shell.openExternal('https://github.com/Tencent/cherry-markdown')
    }
  })
}