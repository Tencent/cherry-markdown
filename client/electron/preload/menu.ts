import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, MenuItemConstructorOptions, shell } from "electron"
import packageInfo from "../../package.json"
import fs from "node:fs"

/**
 * @description 监听文本是否改变
 */

ipcMain.on('is-text-change', () => {
  const menu = Menu.getApplicationMenu();
  const saveFileBtn = menu.getMenuItemById('save-file');
  saveFileBtn.enabled = true
})


/**
 * @description 新建文件
 */
const newFile = () => {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('new_file')
}

/**
 * @description 打开文件
 * @param status -2 -1 读取文件失败; -3 取消读取; 1 读取成功
 */
const openFile = () => {
  // 获取第一个窗口
  const win = BrowserWindow.getAllWindows()[0];
  // Show the open file dialog
  dialog.showOpenDialog({
    title: '打开*.md文件',
    filters: [
      { name: 'File Type', extensions: ['md'] },
    ],
  }).then(result => {
    if (result.canceled) {
      win.webContents.send('open_file', { status: -3, message: 'open file canceled' })
      return;
    };

    let filePath = result.filePaths[0];
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        win.webContents.send('open_file', { status: -1, message: err.message })
        return;
      }
      win.webContents.send('open_file', { status: 1, message: 'open file success', data: data, filePath: filePath })
    });
  }).catch(err => {
    win.webContents.send('open_file', { status: -2, message: err })
  });
}

/**
 * @description 另存为...
 *  @description status -2 -1 读取文件失败; 0 取消读取; 1 读取成功
 */
const saveFileAs = () => {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('save-file-as')
}
// 获得 markdown 信息
ipcMain.on('save-file-as-info', async (event, arg: { data: string }) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: '',
    filters: [
      { name: 'File Type', extensions: ['md'] },
    ]
  })

  if (filePath) {
    fs.writeFile(filePath, arg.data, (err) => {
      if (err) {
        event.reply('save-file-as-reply', { status: -1, message: err.message, filePath: '' })
      } else {
        event.reply('save-file-as-reply', { status: 1, message: 'save file as success', filePath: filePath })
        const menu = Menu.getApplicationMenu();
        const saveFileBtn = menu.getMenuItemById('save-file');
        saveFileBtn.enabled = false
      }
    });
  } else {
    event.reply('save-file-as-reply', { status: -2, message: 'save file as canceled', filePath: '' })
  }

})


/**
 * @description 保存文件
 */
const saveFile = () => {
  // 询问是否有文件路径->如没有则调用另存为文件功能
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('save-file')
}
ipcMain.on('sava-file-type', (event, arg: { filePath: string, data: string }) => {
  if (arg.filePath) {
    fs.writeFile(arg.filePath, arg.data, (err) => {
      if (err) {
        console.error('err', err);
        event.reply('save-file-reply', { status: -1, message: err.message, });
      } else {
        console.error('success');
        event.reply('save-file-reply', { status: 1, message: 'save file as success' });
        const menu = Menu.getApplicationMenu();
        const saveFileBtn = menu.getMenuItemById('save-file');
        saveFileBtn.enabled = false
      }
    });
  } else {
    saveFileAs()
  }
})



/**
 * @description 版本信息
 */
const info = () => {
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
/**
 * @desc 判断是否为Mac
 * @doc [process.platform](https://nodejs.org/api/process.html#processplatform)
 */
const isMac = process.platform === 'darwin';
/**
 * @desc 判断是否为生产环境
 */
const isPackaged: boolean = app.isPackaged

const menuConfig: Array<MenuItemConstructorOptions | MenuItem> = [
  {
    label: '文件',
    submenu: [
      {
        id: "new-file",
        label: '新建文件',
        click: () => newFile(),
      },
      {
        id: "open-file",
        label: '打开文件...',
        click: () => openFile(),
      },
      {
        id: "save-file-as",
        label: '另存为...',
        click: () => saveFileAs(),
      },
      {
        id: "save-file",
        label: '保存',
        click: () => saveFile(),
        enabled: false
      },
      {
        id: "quit-close",
        label: '退出',
        role: isMac ? "quit" : 'close'
      },

    ]
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '在文件中查找',
        enabled: false,
      }
    ]
  },
  {
    label: '其他',
    submenu: [
      {
        label: '设置',
        enabled: false,
      },{
        label: '检测版本更新',
        enabled: false,
      },{
        label: '关于',
        click: () => info(),
      }
    ]
  },
]

isPackaged ? [] : menuConfig.push({
  label: "打开DevTools",
  role: 'toggleDevTools'
})

export {
  menuConfig
}
