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
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  color: var(--color-text, #495057);
  border-radius: var(--radius-sm, 6px);
}

.menu-item:hover {
  background: var(--color-accent-soft, #f8f9fa);
  color: var(--color-accent-strong, #007bff);
}

.menu-item:first-child {
  border-radius: var(--radius-sm, 6px);
}

.menu-item:last-child {
  border-radius: var(--radius-sm, 6px);
}
</style>
