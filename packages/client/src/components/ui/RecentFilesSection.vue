<template>
  <div class="recent-files-section">
    <div class="section-header">
      <div class="section-title-container" @click="$emit('toggle')">
        <span class="section-title">最近访问</span>
        <div class="expand-arrow" :class="{ expanded: expanded }">
          <ArrowIcon :size="12" :direction="expanded ? 'down' : 'right'" />
        </div>
      </div>
      <button class="clear-btn" @click="$emit('clear')" title="清空列表">×</button>
    </div>

    <div class="file-list" v-if="expanded">
      <div
        v-for="file in files"
        :key="file.path"
        class="file-item"
        :class="{ active: file.path === currentFilePath }"
        @click="$emit('open-file', file.path)"
        @contextmenu="$emit('context-menu', $event, file)"
      >
        <div class="file-icon">
          <FileIcon :size="16" />
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-time">{{ formatTime(file.lastAccessed) }}</div>
        </div>
      </div>

      <div v-if="files.length === 0" class="empty-state">暂无最近访问的文件</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, ArrowIcon } from '../icons';
import { formatTimestamp } from '../fileUtils';
import type { FileInfo } from '../types';

defineProps<{
  expanded: boolean;
  files: FileInfo[];
  currentFilePath: string | null;
}>();

defineEmits<{
  toggle: [];
  clear: [];
  'open-file': [filePath: string];
  'context-menu': [event: MouseEvent, file: FileInfo];
}>();

// 格式化时间
const formatTime = (timestamp: number): string => {
  return formatTimestamp(timestamp);
};
</script>

<style scoped>
.recent-files-section {
  background: white;
  border-bottom: 1px solid #e9ecef;
  user-select: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
  cursor: pointer;
}

.section-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.expand-arrow {
  color: #6c757d;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
}

.expand-arrow.expanded {
  transform: rotate(180deg);
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #6c757d;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #e9ecef;
  color: #dc3545;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 16px 16px 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}

.file-item:hover {
  background: #e9ecef;
}

.file-item.active {
  background: #007bff;
  color: white;
}

.file-icon {
  flex-shrink: 0;
  color: #6c757d;
}

.file-item.active .file-icon {
  color: white;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-time {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.file-item.active .file-time {
  color: rgba(255, 255, 255, 0.8);
}

.empty-state {
  text-align: center;
  color: #6c757d;
  font-size: 14px;
  padding: 20px 0;
}
</style>
