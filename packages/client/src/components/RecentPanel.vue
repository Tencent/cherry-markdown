<template>
  <div class="recent-panel">
    <RecentFilesSection
      :expanded="recentFilesExpanded"
      :files="sortedRecentFiles"
      :current-file-path="currentFilePath"
      @toggle="toggleRecentFiles"
      @clear="clearRecentFiles"
      @open-file="openFile"
      @context-menu="showContextMenu"
    />

    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :file="contextMenu.file"
      menu-type="recent"
      @remove="removeFromRecent"
      @copy-path="copyFilePath"
      @open-in-explorer="openInExplorer"
      @close="hideContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useFileStore } from '../store';
import { useFileManager } from './composables/useFileManager';
import RecentFilesSection from './ui/RecentFilesSection.vue';
import ContextMenu from './ui/ContextMenu.vue';

const fileStore = useFileStore();
const folderManagerRef = ref(null);

const {
  sortedRecentFiles,
  currentFilePath,
  recentFilesExpanded,
  toggleRecentFiles,
  openFile,
  clearRecentFiles,
  removeFromRecent,
  copyFilePath,
  openInExplorer,
  contextMenu,
  showContextMenu,
  hideContextMenu,
} = useFileManager(fileStore, folderManagerRef);

onMounted(() => {
  recentFilesExpanded.value = true;
});
</script>

<style scoped>
.recent-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}
</style>
