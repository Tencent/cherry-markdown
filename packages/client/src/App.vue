<script setup lang="ts">
import { cherryInstance } from './components/CherryMarkdown';
import { listen } from "@tauri-apps/api/event";
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useFileStore } from './store';

const cherryMarkdown = cherryInstance();
const fileStore = useFileStore();

listen('new_file', () => {
  cherryMarkdown.setMarkdown('');
  fileStore.setCurrentFilePath('');
});

listen('open_file', async () => {
  const path = await open({
    multiple: false, directory: false, filters: [{
      name: 'markdown',
      extensions: ['md']
    }]
  })

  if (path === null) {
    return;
  }
  console.log(path);
  fileStore.setCurrentFilePath(path);
  const markdown = await readTextFile(path);
  cherryMarkdown.setMarkdown(markdown);
});

const saveAsMarkdown = async () => {
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
    saveAsMarkdown();
    return;
  }
  writeTextFile(fileStore.currentFilePath, markdown);
}

listen('save', () => {
  // todo: 1如果没有文件路径，就弹出转移到另存为；2只有在被更改过的情况下才进行保存；3这里要改变save的按钮disabled状态
  saveMarkdown();
});

listen('save_as', async () => saveAsMarkdown());
</script>