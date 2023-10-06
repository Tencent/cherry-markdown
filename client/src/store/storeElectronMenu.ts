import { defineStore } from 'pinia'

/**
 * 
 * @param isTextChange - 文本是否被改变
 * @param saveFilePath - 保存文件的路径
 */
type ElectronMenuState = {
  isTextChange: boolean;
  saveFilePath: string
}

export const useStoreElectronMenu = defineStore('el-menu', {
  state: (): ElectronMenuState => ({
    isTextChange: false,
    saveFilePath: '',
  }),
}) 
