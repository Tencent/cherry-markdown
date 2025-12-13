<template>
  <div class="context-menu" :style="{ left: x + 'px', top: y + 'px' }" @click.stop>
    <div v-if="menuType === 'recent'" class="menu-item" @click="$emit('remove', file?.path || '')">从列表中移除</div>
    <div class="menu-item" @click="$emit('copy-path', file?.path || '')">复制文件路径</div>
    <div class="menu-item" @click="$emit('open-in-explorer', file?.path || '')">在资源管理器中打开</div>
  </div>
</template>

<script setup lang="ts">
import type { FileInfo } from '../types';

defineProps<{
  x: number;
  y: number;
  file: FileInfo | null;
  menuType?: 'directory' | 'recent'; // 新增属性：区分菜单类型
}>();

defineEmits<{
  remove: [filePath: string];
  'copy-path': [filePath: string];
  'open-in-explorer': [filePath: string];
  close: [];
}>();
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 140px;
}

.menu-item {
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  color: #495057;
}

.menu-item:hover {
  background: #f8f9fa;
  color: #007bff;
}

.menu-item:first-child {
  border-radius: 6px 6px 0 0;
}

.menu-item:last-child {
  border-radius: 0 0 6px 6px;
}
</style>
