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
