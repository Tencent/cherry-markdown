<template>
  <div class="sidebar-header">
    <h3 class="sidebar-title">文件管理</h3>
    <div class="header-actions">
      <button class="toggle-btn" @click="$emit('toggle')" :title="collapsed ? '展开' : '收起'">
        <ArrowIcon :size="16" :direction="collapsed ? 'right' : 'left'" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowIcon } from '../icons';

defineProps<{
  collapsed: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<style scoped>
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6c757d;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #e9ecef;
  color: #495057;
}
</style>