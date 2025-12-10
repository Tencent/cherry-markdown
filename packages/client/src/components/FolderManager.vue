<template>
  <div class="folder-manager">
    <!-- 目录管理 -->
    <div class="directory-manager">
      <div class="directory-tree">
        <DirectoryNode
          v-for="dir in recentDirectories"
          :key="dir.path"
          :node="dir"
          :depth="0"
          :current-file-path="currentFilePath"
          @toggle-directory="toggleDirectory"
          @open-file="handleOpenFile"
          @context-menu="(event, file) => $emit('context-menu', event, file)"
        />
        
        <div v-if="recentDirectories.length === 0" class="empty-state">
          暂无访问过的目录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useFileStore } from '../store';
import DirectoryNode from './DirectoryNode.vue';
import { useDirectoryManager } from './composables/useDirectoryManager';

// 定义组件事件
const emit = defineEmits<{
  (e: 'open-file', filePath: string, fromDirectoryManager: boolean): void;
  (e: 'context-menu', event: MouseEvent, file: any): void;
}>();

// 使用文件存储
const fileStore = useFileStore();

// 获取当前文件路径
const currentFilePath = computed(() => fileStore.currentFilePath);

// 使用目录管理composable
const {
  recentDirectories,
  directoryExpansionState,
  toggleDirectory,
  openDirectory,
  refreshDirectories,
  getRecentDirectories
} = useDirectoryManager(fileStore, emit);

// 在setup阶段立即初始化目录列表，确保窗口打开时就恢复状态
getRecentDirectories();

// 处理文件打开
const handleOpenFile = (filePath: string) => {
  emit('open-file', filePath, true);
};


// 展开所有父目录
const expandAllParentDirectories = async (filePath: string, targetDir: any): Promise<void> => {
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const normalizedTargetPath = targetDir.path.replace(/\\/g, '/');
  
  // 如果文件路径不以目标目录路径开头，不需要展开父目录
  if (!normalizedFilePath.startsWith(normalizedTargetPath)) {
    return;
  }
  
  // 获取文件路径相对于目标目录的相对路径
  const relativePath = normalizedFilePath.slice(normalizedTargetPath.length + 1);
  const pathParts = relativePath.split('/').filter(part => part.trim() !== '');
  
  if (pathParts.length <= 1) {
    // 文件直接在目标目录下，不需要展开子目录
    return;
  }
  
  // 递归展开所有中间目录
  const expandPath = async (node: any, remainingParts: string[]): Promise<void> => {
    if (remainingParts.length <= 1) {
      // 最后一部分是文件名，不需要展开
      return;
    }
    
    const currentPart = remainingParts[0];
    const nextParts = remainingParts.slice(1);
    
    // 在当前节点的子节点中查找匹配的目录
    if (node.children) {
      const childDir = node.children.find((child: any) => 
        child.type === 'directory' && child.name === currentPart
      );
      
      if (childDir) {
        // 展开子目录
        if (!childDir.expanded) {
          await toggleDirectory(childDir.path, childDir);
        }
        
        // 递归展开下一级
        await expandPath(childDir, nextParts);
      }
    }
  };
  
  await expandPath(targetDir, pathParts);
};

// 暴露方法给父组件
defineExpose({
  openDirectory,
  refreshDirectories,
  getRecentDirectories
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
