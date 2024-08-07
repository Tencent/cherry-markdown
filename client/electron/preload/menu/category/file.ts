import { BrowserWindow, dialog, ipcMain, Menu } from "electron"
import fs from "node:fs"

/**
 * @description 新建文件
 */
export const newFile = () => {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('new_file')
}

/**
 * @description 打开文件
 * @param status -1 读取文件失败; -2 取消读取; 0 读取成功
 * @param message 读取文件失败的原因
 * @param data 读取成功的文件内容
 * @param filePath 读取成功的文件路径
 */
export const openFile = () => {
  // 获取第一个窗口
  const win = BrowserWindow.getAllWindows()[0];
  dialog.showOpenDialog({
    title: '打开*.md文件',
    filters: [
      { name: 'File Type', extensions: ['md'] },
    ],
  }).then(result => {
    if (result.canceled) {
      win.webContents.send('open_file', {
        status: -2,
        message: 'open file canceled',
        data: '',
        filePath: ''
      })
      return;
    };

    let filePath = result.filePaths[0];
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        win.webContents.send('open_file', {
          status: -1,
          message: err.message,
          data: '',
          filePath: ''
        })
        return;
      }
      win.webContents.send('open_file', {
        status: 0,
        message: 'open file success',
        data: data,
        filePath: filePath
      })
    });
  }).catch(err => {
    win.webContents.send('open_file', {
      status: -1,
      message: err.message,
      data: '',
      filePath: ''
    })
  });
}

/**
 * @description 另存为...
 * @description status -2 -1 保存文件失败; 0 取消读取; 1 读取成功
 * @description message 保存文件失败的原因
 * @description filePath 保存文件成功的路径
 * 
 */
export const saveFileAs = () => {
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
        event.reply('save-file-as-reply', { status: 0, message: 'save file as success', filePath: filePath })
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
 * @description status  0 保存成功; -1 保存失败
 * @description message 保存失败的原因
 */
export const saveFile = () => {
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
        event.reply('save-file-reply', { status: 0, message: 'save file as success' });
        const menu = Menu.getApplicationMenu();
        const saveFileBtn = menu.getMenuItemById('save-file');
        saveFileBtn.enabled = false
      }
    });
  } else {
    saveFileAs()
  }
})
