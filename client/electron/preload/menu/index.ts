import { app, ipcMain, Menu, MenuItem, MenuItemConstructorOptions } from "electron"
import { showDirectoryPanel } from "./category/view";
import { newFile, openFile, saveFileAs, saveFile } from "./category/file";
import { info } from "./category/other";

//  @description 监听文本是否改变
ipcMain.on('is-text-change', () => {
  const menu = Menu.getApplicationMenu();
  const saveFileBtn = menu.getMenuItemById('save-file');
  saveFileBtn.enabled = true
})

/**
 * @description 判断是否显示目录面板
 */
let isShowSidePanel = false

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
    label: '视图',
    submenu: [
      {
        label: '目录',
        click: () => showDirectoryPanel(),
        enabled: true,
        type: 'checkbox',
        checked: !isShowSidePanel,
      },
    ]
  },
  {
    label: '其他',
    submenu: [
      {
        label: '设置',
        enabled: false,
      }, {
        label: '检测版本更新',
        enabled: false,
      }, {
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
