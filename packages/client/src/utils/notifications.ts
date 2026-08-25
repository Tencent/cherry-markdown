import { toast } from '../components/composables/useToast';

/**
 * 显示错误通知
 * 使用 toast 组件替代 alert，支持节流和统一样式
 */
export const notifyError = (message: string): void => {
  toast.error(message);
};

/**
 * 显示信息通知
 */
export const notifyInfo = (message: string): void => {
  toast.info(message);
};

/**
 * 显示成功通知
 */
export const notifySuccess = (message: string): void => {
  toast.success(message);
};

/**
 * 显示警告通知
 */
export const notifyWarning = (message: string): void => {
  toast.warning(message);
};

/**
 * 显示"加载中"通知（不自动消失）。
 * duration=0 时 useToast 不会启动自动关闭定时器，长任务开始时调用，
 * 结束后必须调用 dismissNotify(id) 主动关闭，避免残留。
 *
 * 使用范式：
 *   const id = notifyLoading('正在生成…');
 *   try { await longTask(); } finally { dismissNotify(id); }
 */
export const notifyLoading = (message: string): number => {
  return toast.info(message, 0);
};

/**
 * 关闭指定 id 的 toast。传入 -1（notifyLoading 被节流时的返回值）会安全无操作。
 */
export const dismissNotify = (id: number): void => {
  if (id < 0) return;
  toast.remove(id);
};
