<template>
  <div id="cherry-markdown" />
</template>
<script setup lang="ts">

import Cherry from 'cherry-markdown'
import { toolbarsOptions } from "./toolbarsOptions"
import { ipcRenderer } from "electron";
import { MessagePlugin as TMessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';


const filePath = ref('');

const cherryMarkdown = new Cherry({
  id: 'cherry-markdown',
  value: '',
  toolbars: toolbarsOptions,
  drawioIframeUrl: 'drawio_demo.html',
  fileUpload(file: any, callback: (arg0: any) => void) {

  },
});

/**
 * @description 打开文档
 */
ipcRenderer.on('open_files_success', (event, arg: { data: string, filePath: string }) => {
  console.log(event, arg)
  cherryMarkdown.setMarkdown(arg.data)
  filePath.value = arg.filePath
})
/**
 * @description 保存文件
 */
ipcRenderer.on('save_files',
  () => {
    ipcRenderer.send('save_files_send', { data: cherryMarkdown.getMarkdown(), filePath: filePath.value })
  })

ipcRenderer.on('save-file-reply', (event, arg: { status: string, message: string }) => {
  if (arg.status) {
    filePath.value = arg.message
  } else {
    TMessagePlugin.warning(`保存失败${arg.message}`);
  }
})

</script>
<style lang="scss">
.cherry-editor {
  height: 90vh;
}
</style>