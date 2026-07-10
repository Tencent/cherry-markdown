<template>
  <div class="context-menu" :style="{ left: x + 'px', top: y + 'px' }" @click.stop>
    <ContextMenuList
      :file="file"
      :menu-type="menuType"
      @remove="$emit('remove', $event)"
      @copy-path="$emit('copy-path', $event)"
      @open-in-explorer="$emit('open-in-explorer', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { FileInfo } from '../types';
import ContextMenuList from './ContextMenuList.vue';

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
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e9ecef);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.18));
  z-index: 1000;
  min-width: 160px;
  padding: 6px;
  overflow: hidden;
  backdrop-filter: blur(6px);
}
</style>
