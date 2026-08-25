import { ref, readonly, type Ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * 可选的操作按钮配置：Toast 上显示一个按钮，用于承担类似“应用本地版本”这种
 * 需要用户主动确认但又不应该阻塞主界面的场景。
 */
export interface ToastAction {
  /** 按钮文案 */
  label: string;
  /** 点击回调；返回 true / undefined 表示需要在点击后关闭 toast，返回 false 则保留 */
  onClick: () => boolean | void;
}

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
  action?: ToastAction;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
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
    // 带操作按钮的 toast 需要用户注意，默认延长展示时间
    duration: options.duration ?? (options.action ? 8000 : DEFAULT_DURATION),
    action: options.action,
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

/**
 * 带操作按钮的 toast（非阻塞消息提醒 + 一键操作）。
 * 适用于“发现更新的本地版本”“文件被外部修改”等需要用户可选择动作的场景。
 */
const action = (message: string, act: ToastAction, options: Omit<ToastOptions, 'action'> = {}): number =>
  addToast(message, { ...options, type: options.type ?? 'info', action: act });

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
    action,
  };
};

// 单例导出，方便非组件场景使用
export const toast = {
  info,
  success,
  warning,
  error,
  action,
  remove: removeToast,
  clear: clearAllToasts,
};
