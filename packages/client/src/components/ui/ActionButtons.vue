<template>
  <div class="action-buttons">
    <button class="action-btn" @click="$emit('open-file')">
      <div class="btn-icon">
        <FileIcon :size="16" />
      </div>
      <span class="btn-text">打开文件</span>
    </button>
    <button class="action-btn" @click="$emit('open-directory')">
      <div class="btn-icon">
        <FolderIcon :size="16" />
      </div>
      <span class="btn-text">打开目录</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, FolderIcon } from '../icons';

defineEmits<{
  'create-file': [];
  'open-file': [];
  'open-directory': [];
}>();
</script>

<style scoped>
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.action-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}

.action-btn:hover {
  background: #007bff;
  color: white;
  border-color: #007bff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 123, 255, 0.2);
}

.btn-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.btn-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
