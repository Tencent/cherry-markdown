import { defineStore } from 'pinia'

/**
 * 
 * @param isTextChange - 文本是否被改变
 * @param saveFilePath - 保存文件的路径
 */
type ElMenuFileState = {
  isTextChange: boolean;
  saveFilePath: string
}

export const useElMenuFileStore = defineStore('elMenu', {
  state: (): ElMenuFileState => ({
    isTextChange: false,
    saveFilePath: '',
  }),
  
})