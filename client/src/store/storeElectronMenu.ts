import { defineStore } from 'pinia'

/**
 * 
 * @param isTextChange - 文本是否被改变
 */
type ElectronMenuState = {
  isTextChange: boolean;
  saveFilePath: string
}

export const useStoreElectronMenu = defineStore('electron-menu', {
  state: (): ElectronMenuState => ({
    isTextChange: false,
    saveFilePath: '',
  }),
}) 
