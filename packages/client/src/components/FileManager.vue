<template>
  <div class="file-manager" :class="{ 'sidebar-collapsed': fileStore.sidebarCollapsed }">
    <!-- 侧边栏头部 -->
    <SidebarHeader :collapsed="fileStore.sidebarCollapsed" @toggle="toggleSidebar" />

    <!-- 功能按钮区域 -->
    <ActionButtons
      v-if="!fileStore.sidebarCollapsed"
      @create-file="createNewFile"
      @open-file="openExistingFile"
      @open-directory="openDirectory"
    />

    <!-- 目录管理 -->
    <DirectorySection
      v-if="!fileStore.sidebarCollapsed"
      :expanded="directoryManagerExpanded"
      @toggle="toggleDirectoryManager"
      @refresh="refreshDirectories"
    >
      <FolderManager ref="folderManagerRef" @open-file="handleOpenFile" @context-menu="showContextMenu" />
    </DirectorySection>

    <!-- 最近文件列表 -->
    <RecentFilesSection
      v-if="!fileStore.sidebarCollapsed"
      :expanded="recentFilesExpanded"
      :files="sortedRecentFiles"
      :current-file-path="currentFilePath"
      @toggle="toggleRecentFiles"
      @clear="clearRecentFiles"
      @open-file="openFile"
      @context-menu="showContextMenu"
    />

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
import SidebarHeader from './ui/SidebarHeader.vue';
import ActionButtons from './ui/ActionButtons.vue';
import DirectorySection from './ui/DirectorySection.vue';
import RecentFilesSection from './ui/RecentFilesSection.vue';
import ContextMenu from './ui/ContextMenu.vue';
import { useFileManager } from './composables/useFileManager';

const fileStore = useFileStore();
const folderManagerRef = ref<InstanceType<typeof FolderManager>>();

// 使用文件管理composable
const {
  sortedRecentFiles,
  currentFilePath,
  recentFilesExpanded,
  directoryManagerExpanded,
  contextMenu,
  toggleDirectoryManager,
  toggleRecentFiles,
  toggleSidebar,
  createNewFile,
  openExistingFile,
  openDirectory,
  openFile,
  handleOpenFile,
  refreshDirectories,
  clearRecentFiles,
  removeFromRecent,
  copyFilePath,
  openInExplorer,
  showContextMenu,
  hideContextMenu,
} = useFileManager(fileStore, folderManagerRef);

// 获取菜单类型
const getMenuType = (file: any): 'directory' | 'recent' => {
  // 通过检查文件对象的结构来判断来源
  // 目录管理中的文件通常有更完整的DirectoryNode结构

  // 如果文件有type属性且为'file'或'directory'，说明来自目录管理
  if (file?.type && (file.type === 'file' || file.type === 'directory')) {
    return 'directory';
  }

  // 如果文件在最近访问列表中，说明来自最近访问列表
  const isInRecentFiles = fileStore.recentFiles.some((recentFile: any) => recentFile.path === file?.path);
  return isInRecentFiles ? 'recent' : 'directory';
};

onMounted(() => {
  console.log('FileManager组件已挂载 - 目录管理区域状态:', directoryManagerExpanded.value);
});
</script>

<style scoped>
.file-manager {
  width: 280px;
  height: 100vh;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
}

.file-manager.sidebar-collapsed {
  width: 60px;
}
</style>
