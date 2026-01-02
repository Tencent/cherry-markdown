import { ref, readonly, type Ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

// 默认配置
const DEFAULT_DURATION = 3000;
const THROTTLE_MS = 300;

// 全局状态
let nextId = 1;
const toasts: Ref<ToastItem[]> = ref([]);
const lastMessageTime = new Map<string, number>();

/**
 * 检查消息是否应该被节流
 */
const shouldThrottle = (message: string): boolean => {
  const now = Date.now();
  const lastTime = lastMessageTime.get(message);
  if (lastTime && now - lastTime < THROTTLE_MS) {
    return true;
  }
  lastMessageTime.set(message, now);
  return false;
};

/**
 * 添加 toast 通知
 */
const addToast = (message: string, options: ToastOptions = {}): number => {
  if (shouldThrottle(message)) {
    return -1;
  }

  nextId += 1;
  const id = nextId;
  const toast: ToastItem = {
    id,
    type: options.type ?? 'info',
    message,
    duration: options.duration ?? DEFAULT_DURATION,
  };

  toasts.value.push(toast);

  // 自动移除
  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }

  return id;
};

/**
 * 移除 toast
 */
const removeToast = (id: number): void => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

/**
 * 清除所有 toast
 */
const clearAllToasts = (): void => {
  toasts.value = [];
};

// 便捷方法
const info = (message: string, duration?: number): number => addToast(message, { type: 'info', duration });

const success = (message: string, duration?: number): number => addToast(message, { type: 'success', duration });

const warning = (message: string, duration?: number): number => addToast(message, { type: 'warning', duration });

const error = (message: string, duration?: number): number => {
  console.error(message);
  return addToast(message, { type: 'error', duration });
};

export const useToast = () => {
  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    clearAllToasts,
    info,
    success,
    warning,
    error,
  };
};

// 单例导出，方便非组件场景使用
export const toast = {
  info,
  success,
  warning,
  error,
  remove: removeToast,
  clear: clearAllToasts,
};
