import { app, BrowserWindow, dialog, ipcMain, MenuItem, MenuItemConstructorOptions, shell } from "electron"
import packageInfo from "../../package.json"
import fs from "node:fs"

/**
 * @description 打开文件
 */
const openFiles = () => {
  // 获取第一个窗口
  const win = BrowserWindow.getAllWindows()[0];
  let filePath = '';
  // Show the open file dialog
  dialog.showOpenDialog({
    title: '打开.md文件',
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown'] },
    ],
    properties: ['openFile'],
  }).then(result => {
    if (result.canceled) {
      win.webContents.send('open_files_error', { canceled: result.canceled, message: 'open file canceled' })
      return;
    };
    // Read the content of the selected file
    filePath = result.filePaths[0];
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        win.webContents.send('open_files_error', { canceled: true, message: err.message })
        return;
      }
      win.webContents.send('open_files_success', { data: data, filePath: filePath })
    });
  }).catch(err => {
    win.webContents.send('open_files_error', { canceled: true, message: err })
  });
}

/**
 * @description 保存文件
 */
const saveFiles = () => {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('save_files')
}

ipcMain.on('save_files_send', async (event, arg: { data: string, filePath: string }) => {
  let file_path = arg.filePath;
  if (!arg.filePath) {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: 'example.md'
    })
    file_path = filePath;
  }

  if (file_path) {
    fs.writeFile(file_path, arg.data, (err) => {
      if (err) {
        console.error(err);
        event.reply('save-file-reply', { status: false, message: err.message });
      } else {
        event.reply('save-file-reply', { status: true, message: file_path });
      }
    });
  }

})

const info = () => {
  dialog.showMessageBox({
    title: 'markdown-notepad',
    type: 'info',
    message: '一个桌面端 Cherry-markdown noted',
    detail: `版本信息：${packageInfo.version}\n引擎版本:${process.versions.v8}`,
    noLink: true,
    buttons: ['项目地址', '确定'],
  }).then((res) => {
    if (res.response === 0) {
      shell.openExternal('https://github.com/')
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
 * @doc 
 */
const isPackaged: boolean = app.isPackaged
const menuConfig: Array<MenuItemConstructorOptions | MenuItem> = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建文件',
        enabled: false,
      },
      {
        label: '打开文件',
        click: () => openFiles(),
        enabled: true,
      },
      {
        label: '保存',
        click: () => saveFiles(),
        enabled: true,
      },
      {
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
      },
      {
        label: '设置',
        enabled: false,
      }
    ]
  },
  {
    label: '其他',
    submenu: [
      {
        label: '检测版本更新',
        enabled: false,
      },
      {
        label: '关于',
        click: () => info(),
        enabled: false,
      }
    ]
  },
]

 menuConfig.push({
  label: "打开toolsDev",
  role: 'toggleDevTools'
})

export {
  menuConfig
}