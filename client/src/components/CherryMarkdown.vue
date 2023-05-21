<template>
  <div id="cherry-markdown" />
</template>
<script setup lang="ts">

import { cherryMarkdown } from "./cherryConfigs"
import { ipcRenderer } from "electron";
import { MessagePlugin as TMessagePlugin } from 'tdesign-vue-next';
import { useElMenuFileStore } from "../store/elMenuFile";

const useElMenuFile = useElMenuFileStore()

/**
 * @description 新建文件
 */
ipcRenderer.on('new_file', () => {
  cherryMarkdown.setMarkdown('')
  useElMenuFile.saveFilePath = ''
})

/**
 * @description 打开文档
 * @description 仅当 status=1,data、filePath 存在
 */
ipcRenderer.on('open_file', (event, arg: { status: -2 | -1 | -3 | 1, message: string, data: string, filePath: string }) => {
  switch (arg.status) {
    case -2:
      TMessagePlugin.error(arg.message);
      break;
    case -1:
      TMessagePlugin.error(arg.message);
      break;
    case -3:
      TMessagePlugin.warning(arg.message);
      break;
    case 1:
      cherryMarkdown.setMarkdown(arg.data)
      useElMenuFile.saveFilePath = arg.filePath
      break;
  }

})
/**
 * @description 另存为
 */
ipcRenderer.on('save-file-as',
  () => ipcRenderer.send('save-file-as-info', { data: cherryMarkdown.getMarkdown() }))

ipcRenderer.on('save-file-as-reply', (event, arg: { status: -2 | -1 | 1, message: string, filePath: string }) => {
  switch (arg.status) {
    case -1:
      TMessagePlugin.error(arg.message);
      break;
    case 1:
      useElMenuFile.saveFilePath = arg.filePath
      break;
    case -2:
      TMessagePlugin.warning(arg.message);
      break;
  }
})

/**
 * @description 保存文件
 */
ipcRenderer.on('save-file', () =>{
  ipcRenderer.send('sava-file-type', { filePath: useElMenuFile.saveFilePath, data: cherryMarkdown.getMarkdown() })
})

ipcRenderer.on('save-file-reply', (event, arg: { status:-1 | 1, message: string }) =>{
 if(arg.status===-1){
     TMessagePlugin.error(arg.message);
 }
})  
</script>
<style lang="scss">
.cherry-editor {
  height: 90vh;
}
</style>