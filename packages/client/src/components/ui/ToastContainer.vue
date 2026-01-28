<script setup lang="ts">
import { useToast, type ToastItem } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const getTypeClass = (type: ToastItem['type']): string => {
  return `toast-${type}`;
};
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast-item', getTypeClass(toast.type)]"
          @click="removeToast(toast.id)"
        >
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click.stop="removeToast(toast.id)">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--toast-bg, #333);
  color: var(--toast-color, #fff);
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toast-item:hover {
  transform: translateX(-4px);
}

.toast-info {
  --toast-bg: #1890ff;
  --toast-color: #fff;
}

.toast-success {
  --toast-bg: #52c41a;
  --toast-color: #fff;
}

.toast-warning {
  --toast-bg: #faad14;
  --toast-color: #000;
}

.toast-error {
  --toast-bg: #ff4d4f;
  --toast-color: #fff;
}

.toast-message {
  flex: 1;
  margin-right: 8px;
  word-break: break-word;
}

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.7;
  padding: 0 4px;
  line-height: 1;
}

.toast-close:hover {
  opacity: 1;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
