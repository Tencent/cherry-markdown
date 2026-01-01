<template>
  <div class="file-manager">
    <ActionButtons @open-file="openExistingFile" @open-directory="openDirectory" />

    <!-- 目录管理 -->
    <DirectorySection
      :expanded="directoryManagerExpanded"
      @toggle="toggleDirectoryManager"
      @refresh="refreshDirectories"
    >
      <FolderManager ref="folderManagerRef" @open-file="handleOpenFile" @context-menu="showContextMenu" />
    </DirectorySection>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :file="contextMenu.file"
      :menu-type="getMenuType(contextMenu.file)"
      @remove="removeFromRecent"
      @copy-path="copyFilePath"
      @open-in-explorer="openInExplorer"
      @close="hideContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFileStore } from '../store';
import FolderManager from './FolderManager.vue';
import ActionButtons from './ui/ActionButtons.vue';
import DirectorySection from './ui/DirectorySection.vue';
import ContextMenu from './ui/ContextMenu.vue';
import { useFileManager } from './composables/useFileManager';

const fileStore = useFileStore();
const folderManagerRef = ref<InstanceType<typeof FolderManager>>();

// 使用文件管理composable
const {
  directoryManagerExpanded,
  contextMenu,
  toggleDirectoryManager,
  openExistingFile,
  openDirectory,
  openFile,
  handleOpenFile,
  refreshDirectories,
  copyFilePath,
  openInExplorer,
  showContextMenu,
  hideContextMenu,
} = useFileManager(fileStore, folderManagerRef);

// 获取菜单类型
const getMenuType = (file: any): 'directory' | 'recent' => {
  return 'directory';
};

onMounted(() => {
  console.log('FileManager组件已挂载 - 目录管理区域状态:', directoryManagerExpanded.value);
});
</script>

<style scoped>
.file-manager {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
}

</style>
