import { defineStore } from 'pinia';

interface File {
  currentFilePath: string | null
}

export const useFileStore = defineStore('file', {
  /**
   * @params currentFilePath 当前的文件路径
   * 
   */
  state: (): File => ({
    currentFilePath: null,
  }),

  actions: {
    setCurrentFilePath(filePath: string | null) {
      this.currentFilePath = filePath;
    },
  }
});