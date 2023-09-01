import { defineStore } from 'pinia'

/**
 * 
 * @param isTextChange - 文本是否被改变
 * @param saveFilePath - 保存文件的路径
 */
type MenuFileState = {
  isTextChange: boolean;
  saveFilePath: string
}

export const useMenuFileStore = defineStore('elMenu', {
  state: (): MenuFileState => ({
    isTextChange: false,
    saveFilePath: '',
  }),
  
})