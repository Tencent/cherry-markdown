<template>
  <div>
    <div v-if="menuType === 'recent'" class="menu-item" @click="$emit('remove', filePath)">从列表中移除</div>
    <div class="menu-item" @click="$emit('copy-path', filePath)">复制文件路径</div>
    <div class="menu-item" @click="$emit('open-in-explorer', filePath)">在资源管理器中打开</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FileInfo } from '../types';

const props = defineProps<{
  file: FileInfo | null;
  menuType?: 'directory' | 'recent';
}>();

defineEmits<{
  remove: [filePath: string];
  'copy-path': [filePath: string];
  'open-in-explorer': [filePath: string];
}>();

const filePath = computed(() => props.file?.path ?? '');
</script>

<style scoped>
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
