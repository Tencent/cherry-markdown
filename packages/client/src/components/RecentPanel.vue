<template>
  <div class="recent-panel">
    <div v-if="!sortedRecentFiles.length" class="empty">暂无最近访问文件</div>

    <ul v-else class="recent-list">
      <li
        v-for="file in sortedRecentFiles"
        :key="file.path"
        :class="{ active: file.path === currentFilePath }"
        @click="openRecent(file.path)"
        :title="file.path"
      >
        <div class="file-row">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-time">{{ formatTime(file.lastSaved ?? file.lastOpened) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFileStore } from '../store';
import { useFileManager } from './composables/useFileManager';

const fileStore = useFileStore();
const folderManagerRef = ref(null);

import { formatTimestamp } from './fileUtils';

const { sortedRecentFiles, currentFilePath, openExistingFile, openFile } = useFileManager(fileStore, folderManagerRef);

const openRecentFile = async (): Promise<void> => {
  await openExistingFile();
};

const openRecent = async (filePath: string): Promise<void> => {
  await openFile(filePath, false, false);
};

const formatTime = (time: number): string => formatTimestamp(time);

defineExpose({ openRecentFile });
</script>

<style scoped>
.recent-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa3b5;
  font-size: 13px;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 8px 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.recent-list li {
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  color: #1f2430;
}

.recent-list li:hover {
  background: #f0f3f8;
}

.recent-list li.active {
  background: #007bff;
  color: #fff;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-time {
  margin-left: auto;
  font-size: 12px;
  color: #6b7280;
}

.recent-list li.active .file-time {
  color: rgba(255, 255, 255, 0.8);
}
</style>
