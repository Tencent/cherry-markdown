<template>
  <div class="directory-tree" role="tree">
    <DirectoryNode
      v-for="node in nodes"
      :key="node.path"
      :node="node"
      :depth="0"
      :current-file-path="currentFilePath"
      @toggle-directory="(_dir, _node) => $emit('toggle-directory', _dir, _node)"
      @open-file="(_path) => $emit('open-file', _path)"
      @context-menu="(_event, _file) => $emit('context-menu', _event, _file)"
    />
  </div>
</template>

<script setup lang="ts">
import DirectoryNode from './DirectoryNode.vue';
import type { DirectoryNode as DirectoryNodeType } from './types';

defineProps<{
  nodes: DirectoryNodeType[];
  currentFilePath?: string | null;
}>();

defineEmits<{
  (_e: 'toggle-directory', _dirPath: string, _node: DirectoryNodeType): void;
  (_e: 'open-file', _filePath: string): void;
  (_e: 'context-menu', _event: MouseEvent, _file: DirectoryNodeType): void;
}>();
</script>

<style scoped>
.directory-tree {
  height: 100%;
  overflow-y: auto;
}
</style>
