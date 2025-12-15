<template>
  <div class="directory-section">
    <div class="section-header">
      <div class="section-title-container" @click="$emit('toggle')">
        <span class="section-title">目录管理</span>
        <div class="expand-arrow" :class="{ expanded: expanded }">
          <ArrowIcon :size="12" :direction="expanded ? 'down' : 'right'" />
        </div>
      </div>
      <button class="refresh-btn" @click="$emit('refresh')" title="刷新目录">
        <RefreshIcon :size="14" />
      </button>
    </div>

    <div class="directory-content" v-if="expanded">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowIcon, RefreshIcon } from '../icons';

defineProps<{
  expanded: boolean;
}>();

defineEmits<{
  toggle: [];
  refresh: [];
}>();
</script>

<style scoped>
.directory-section {
  border-bottom: 1px solid #e9ecef;
  background: white;
  user-select: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
}

.section-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.expand-arrow {
  color: #6c757d;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
}

.expand-arrow.expanded {
  transform: rotate(180deg);
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

.directory-content {
  height: calc(100vh - 260px);
  overflow-y: auto;
}
</style>
