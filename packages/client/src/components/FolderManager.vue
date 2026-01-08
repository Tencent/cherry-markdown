<template>
  <div class="folder-manager">
    <!-- 目录管理 -->
    <div class="directory-manager">
      <DirectoryTree
        class="directory-tree"
        :nodes="recentDirectories"
        :current-file-path="currentFilePath"
        @toggle-directory="toggleDirectory"
        @open-file="handleOpenFile"
        @context-menu="(_event, _file) => $emit('context-menu', _event, _file)"
      />

      <div v-if="recentDirectories.length === 0" class="empty-state">暂无访问过的目录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFileStore } from '../store';
import { useDirectoryManager } from './composables/useDirectoryManager';
import DirectoryTree from './DirectoryTree.vue';

// 定义组件事件
const emit = defineEmits<{
  (_e: 'open-file', _filePath: string, _fromDirectoryManager: boolean): void;
  (_e: 'context-menu', _event: MouseEvent, _file: any): void;
}>();

// 使用文件存储
const fileStore = useFileStore();

// 获取当前文件路径
const currentFilePath = computed(() => fileStore.currentFilePath);

// 使用目录管理composable
const { recentDirectories, toggleDirectory, openDirectory, refreshDirectories, getRecentDirectories } =
  useDirectoryManager(fileStore);

// 在setup阶段立即初始化目录列表，确保窗口打开时就恢复状态
getRecentDirectories();

// 处理文件打开
const handleOpenFile = (filePath: string) => {
  emit('open-file', filePath, true);
};

// 暴露方法给父组件
defineExpose({
  openDirectory,
  refreshDirectories,
  getRecentDirectories,
});
</script>

<style scoped>
.folder-manager {
  width: 100%;
  height: 100%;
}

/* 目录管理样式 */
.directory-manager {
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.directory-manager .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
}

.directory-manager .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6c757d;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: #e9ecef;
  color: #007bff;
}

/* 目录树样式 */
.directory-tree {
  height: 100%;
  overflow-y: auto;
  padding: 8px 0;
}

/* 空状态样式 */
.empty-state {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}
</style>
