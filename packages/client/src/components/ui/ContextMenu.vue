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
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 140px;
}
</style>
