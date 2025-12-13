<template>
  <div class="directory-node" :class="`depth-${depth}`">
    <!-- 目录项 -->
    <div v-if="node.type === 'directory'" class="directory-item" :class="{ expanded: node.expanded }">
      <div class="directory-header" @click="toggleDirectory">
        <div class="directory-icon">
          <FolderIcon :size="14" :expanded="node.expanded" />
        </div>
        <div class="directory-name">{{ node.name }}</div>
        <div class="directory-arrow">
          <ArrowIcon :size="12" :direction="node.expanded ? 'down' : 'right'" />
        </div>
      </div>

      <!-- 递归渲染子节点 -->
      <div v-if="node.expanded" class="directory-children">
        <DirectoryNode
          v-for="child in node.children"
          :key="child.path"
          :node="child"
          :depth="depth + 1"
          :current-file-path="currentFilePath"
          @toggle-directory="(_dir, _node) => $emit('toggle-directory', _dir, _node)"
          @open-file="(_path) => $emit('open-file', _path)"
          @context-menu="(_event, _file) => $emit('context-menu', _event, _file)"
        />
      </div>
    </div>

    <!-- 文件项 -->
    <div
      v-else
      class="file-item"
      :class="{ active: node.path === currentFilePath }"
      @click="openFile"
      @contextmenu.prevent="(_event) => $emit('context-menu', _event, node)"
    >
      <div class="file-icon">
        <FileIcon :size="14" />
      </div>
      <div class="file-name">{{ node.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, FolderIcon, ArrowIcon } from './icons';
import type { DirectoryNode as DirectoryNodeType } from './types';

// 定义组件属性
interface Props {
  node: DirectoryNodeType;
  depth: number;
  currentFilePath?: string | null;
}

// 定义组件事件
interface Emits {
  (_e: 'toggle-directory', _dirPath: string, _node: DirectoryNodeType): void;
  (_e: 'open-file', _filePath: string): void;
  (_e: 'context-menu', _event: MouseEvent, _file: DirectoryNodeType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 切换目录展开状态
const toggleDirectory = () => {
  if (props.node.type === 'directory') {
    emit('toggle-directory', props.node.path, props.node);
  }
};

// 打开文件
const openFile = () => {
  if (props.node.type === 'file') {
    emit('open-file', props.node.path);
  }
};
</script>

<style scoped>
.directory-node {
  margin-bottom: 2px;
}

/* 目录项样式 */
.directory-item {
  margin-bottom: 2px;
}

.directory-header {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
  border-radius: 4px;
}

.directory-header:hover {
  background: #f0f2f5;
}

.directory-icon {
  flex-shrink: 0;
  color: #ffb74d;
  display: flex;
  align-items: center;
}

.directory-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.directory-arrow {
  flex-shrink: 0;
  color: #6c757d;
  transition: transform 0.2s ease;
}

.directory-item.expanded .directory-arrow {
  transform: rotate(90deg);
}

/* 目录子节点样式 */
.directory-children {
  margin-left: 16px;
  border-left: 1px solid #e9ecef;
  padding-left: 8px;
}

/* 文件项样式 */
.file-item {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
  border-radius: 4px;
  margin-left: 16px;
}

.file-item:hover {
  background: #f0f2f5;
}

.file-item.active {
  background: #007bff;
  color: white;
}

.file-icon {
  flex-shrink: 0;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.file-item.active .file-icon {
  color: white;
}

.file-name {
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
