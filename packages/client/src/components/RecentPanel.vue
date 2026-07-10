<template>
  <div class="recent-panel">
    <div v-if="!sortedRecentFiles.length" class="empty">暂无最近访问文件</div>

    <ul v-else class="recent-list">
      <li
        v-for="file in sortedRecentFiles"
        :key="file.path"
        :class="{ active: file.path === currentFilePath }"
        @click="openRecent(file.path)"
        @contextmenu.prevent="showMenu($event, file)"
        :title="file.path"
      >
        <div class="file-row">
          <span class="file-name">{{ file.name }}</span>
        </div>
      </li>
    </ul>

    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :file="contextMenu.file"
      menu-type="recent"
      @remove="remove"
      @copy-path="copyFilePath"
      @open-in-explorer="openInExplorer"
      @close="hideMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFileStore } from '../store';
import { useFileManager } from './composables/useFileManager';
import ContextMenu from './ui/ContextMenu.vue';

const fileStore = useFileStore();
const folderManagerRef = ref(null);

const {
  sortedRecentFiles,
  currentFilePath,
  openExistingFile,
  openFile,
  openInExplorer,
  copyFilePath,
  removeFromRecent,
  contextMenu,
  showContextMenu,
  hideContextMenu,
} = useFileManager(fileStore, folderManagerRef);

const openRecentFile = async (): Promise<void> => {
  await openExistingFile();
};

const openRecent = async (filePath: string): Promise<void> => {
  await openFile(filePath, false, false);
};

// const formatTime = (time: number): string => formatTimestamp(time);

const showMenu = (event: MouseEvent, file: any): void => {
  showContextMenu(event, file);
};

const hideMenu = (): void => hideContextMenu();

const remove = (filePath: string): void => {
  removeFromRecent(filePath);
  hideMenu();
};

defineExpose({ openRecentFile });
</script>

<style scoped>
.recent-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  overflow: hidden;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 8px 8px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.recent-list li {
  position: relative;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
  color: var(--color-text);
}

.recent-list li:hover {
  background: var(--color-surface-hover);
}

.recent-list li.active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.recent-list li.active::before {
  content: '';
  position: absolute;
  left: 0;
  width: 3px;
  height: 18px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  display: inline-block;
  max-width: 100%;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-muted);
}

.recent-list li.active .file-time {
  color: var(--color-accent-strong);
}
</style>
