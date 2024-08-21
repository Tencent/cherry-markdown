import { defineStore } from 'pinia'

/**
 * 
 * @param isTextChange - 文本是否被改变
 * @param saveFilePath - 保存文件的路径
 * @param isSaved - 文件是否被保存
 */
type ElectronMenuState = {
  isTextChange: boolean;
  saveFilePath: string;
  isSaved: boolean;
}

export const useStoreElectronMenu = defineStore('electron-menu', {
  state: (): ElectronMenuState => ({
    isTextChange: false,
    saveFilePath: '',
    isSaved: false
  }),
}) 
