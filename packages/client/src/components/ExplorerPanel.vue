<template>
  <div class="explorer-panel">
    <div class="path-bar">
      <span v-if="currentDirPath" class="path-text" :title="currentDirPath">{{ currentDirPath }}</span>
      <span v-else class="path-placeholder">未选择目录</span>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!nodes.length" class="empty-state">请选择一个目录</div>
    <DirectoryTree
      v-else
      :nodes="nodes"
      :current-file-path="currentFilePath"
      @toggle-directory="toggleDirectory"
      @open-file="openFile"
      @context-menu="showContextMenu"
      class="tree-wrapper"
    />

    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :file="contextMenu.file"
      menu-type="directory"
      @copy-path="copyFilePath"
      @open-in-explorer="openInExplorer"
      @close="hideContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFileStore, useDirectoryStore } from '../store';
import DirectoryTree from './DirectoryTree.vue';
import ContextMenu from './ui/ContextMenu.vue';
import { openDirectoryDialog, loadDirectoryStructure } from './fileUtils';
import type { DirectoryNode } from './types';
import { useFileManager } from './composables/useFileManager';

const fileStore = useFileStore();
const directoryStore = useDirectoryStore();
const nodes = ref<DirectoryNode[]>([]);
const currentDirPath = ref<string | null>(null);
const loading = ref(false);

const {
  currentFilePath,
  contextMenu,
  copyFilePath,
  openInExplorer,
  showContextMenu,
  hideContextMenu,
  openFile: openFileFromManager,
} = useFileManager(fileStore, ref(null));

const openDirectory = async (): Promise<void> => {
  const result = await openDirectoryDialog();
  if (!result.success || !result.data) return;
  await loadTree(result.data);
};

const loadTree = async (dirPath: string): Promise<void> => {
  loading.value = true;
  try {
    const tree = await loadDirectoryStructure(dirPath, 0, 8);
    if (tree.success && tree.data) {
      currentDirPath.value = dirPath;
      nodes.value = tree.data;
      directoryStore.setCurrent(dirPath);
      directoryStore.upsertDirectory(dirPath, true);
    }
  } finally {
    loading.value = false;
  }
};

const toggleDirectory = (_dirPath: string, node: DirectoryNode): void => {
  const expanded = !node.expanded;
  node.expanded = expanded;
  directoryStore.setExpanded(node.path, expanded ?? false);
};

const openFile = async (filePath: string): Promise<void> => {
  await openFileFromManager(filePath, true);
};

// 暴露给父组件（SidePanelManager）
defineExpose({ openDirectory });

// 恢复上次打开的目录
const restore = async () => {
  if (directoryStore.currentPath) {
    await loadTree(directoryStore.currentPath);
  }
};

void restore();
</script>

<style scoped>
.explorer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.path-bar {
  min-height: 36px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e9f0;
  background: #f7f9fc;
  color: #1f2430;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.path-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path-placeholder {
  color: #9aa3b5;
}

.tree-wrapper {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa3b5;
  font-size: 13px;
}
</style>
