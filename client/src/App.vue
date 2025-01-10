<script setup lang="ts">
import { cherryInstance } from './components/CherryMarkdown';
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useFileStore } from './store';
import { previewOnlySidebar } from './utils';
import { onMounted } from 'vue';

const cherryMarkdown = cherryInstance();
const fileStore = useFileStore();

const newFile = () => {
  cherryMarkdown.setMarkdown('');
  fileStore.setCurrentFilePath('');
}

const openFile = async () => {
  const path = await open({
    multiple: false, directory: false, filters: [{
      name: 'markdown',
      extensions: ['md']
    }]
  })

  console.log(path);
  if (path === null) {
    return;
  }
  fileStore.setCurrentFilePath(path);
  const markdown = await readTextFile(path);
  console.log(markdown);
  cherryMarkdown.setMarkdown(markdown);
  cherryMarkdown.switchModel('previewOnly');
  previewOnlySidebar();
}

const saveAsNewMarkdown = async () => {
  const markdown = cherryMarkdown.getMarkdown();
  const path = await save({
    filters: [
      {
        name: 'Cherry Markdown',
        extensions: ['md', 'markdown'],
      },
    ],
  });

  if (!path) {
    return;
  }

  fileStore.setCurrentFilePath(path);
  writeTextFile(path, markdown);
}

const saveMarkdown = () => {
  const markdown = cherryMarkdown.getMarkdown();

  if (!fileStore.currentFilePath) {
    saveAsNewMarkdown();
    return;
  }
  writeTextFile(fileStore.currentFilePath, markdown);
}


onMounted(async () => {
  const cherryNoToolbar = document.querySelector('.cherry--no-toolbar');
  console.log(cherryNoToolbar, !cherryNoToolbar);
  await invoke('get_show_toolbar', { show: !cherryNoToolbar });
})

listen('new_file', newFile);

listen('open_file', openFile);

listen('save', () => {
  // todo: 1如果没有文件路径，就弹出转移到另存为；2只有在被更改过的情况下才进行保存；3这里要改变save的按钮disabled状态
  saveMarkdown();
});

listen('save_as', async () => saveAsNewMarkdown());

listen('toggle_toolbar', async () => {
  const cherryNoToolbar = document.querySelector('.cherry--no-toolbar');
  console.log(cherryNoToolbar, !cherryNoToolbar);
  await invoke('get_show_toolbar', { show: !!cherryNoToolbar });
  cherryMarkdown.toolbar.toolbarHandlers.settings('toggleToolbar');
});
</script>