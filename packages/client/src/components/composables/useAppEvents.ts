import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { TAURI_EVENTS, WINDOW_EVENTS } from '../../constants/events';

// ========== 事件 Detail 类型定义 ==========
export interface OpenFileFromSidebarDetail {
  filePath: string;
  content: string;
}

export interface RequestSaveDetail {
  markdown?: string;
}

export type OpenFileFromSidebarEvent = CustomEvent<OpenFileFromSidebarDetail>;
export type RequestSaveEvent = CustomEvent<RequestSaveDetail>;

// ========== Handler 类型定义 ==========
interface TauriHandlers {
  onNewFile: () => any;
  onOpenFile: () => any;
  onSave: () => any;
  onSaveAs: () => any;
  onToggleToolbar: () => any;
}

interface AppEventHandlers {
  onOpenFileFromSidebar: (event: OpenFileFromSidebarEvent) => Promise<void> | void;
  onRequestSave: (event: RequestSaveEvent) => Promise<void> | void;
  tauriHandlers: TauriHandlers;
}

export function useAppEvents({ onOpenFileFromSidebar, onRequestSave, tauriHandlers }: AppEventHandlers) {
  const unlistenFns: UnlistenFn[] = [];

  const registerWindowEvents = (): void => {
    window.addEventListener(WINDOW_EVENTS.OPEN_FILE_FROM_SIDEBAR, onOpenFileFromSidebar as (e: Event) => void);
    window.addEventListener(WINDOW_EVENTS.REQUEST_SAVE, onRequestSave as (e: Event) => void);
  };

  const unregisterWindowEvents = (): void => {
    window.removeEventListener(WINDOW_EVENTS.OPEN_FILE_FROM_SIDEBAR, onOpenFileFromSidebar as (e: Event) => void);
    window.removeEventListener(WINDOW_EVENTS.REQUEST_SAVE, onRequestSave as (e: Event) => void);
  };

  const registerTauriEvents = async (): Promise<void> => {
    try {
      const unlisteners = await Promise.all([
        listen(TAURI_EVENTS.NEW_FILE, tauriHandlers.onNewFile),
        listen(TAURI_EVENTS.OPEN_FILE, tauriHandlers.onOpenFile),
        listen(TAURI_EVENTS.SAVE, tauriHandlers.onSave),
        listen(TAURI_EVENTS.SAVE_AS, tauriHandlers.onSaveAs),
        listen(TAURI_EVENTS.TOGGLE_TOOLBAR, tauriHandlers.onToggleToolbar),
      ]);
      // 过滤掉可能的 null/undefined
      unlisteners.forEach((fn) => {
        if (fn && typeof fn === 'function') {
          unlistenFns.push(fn);
        }
      });
    } catch (error) {
      console.error('注册 Tauri 事件失败:', error);
    }
  };

  const cleanupTauri = async (): Promise<void> => {
    // 逐个清理，单个失败不影响其他
    await Promise.all(
      unlistenFns.map(async (fn) => {
        try {
          await fn();
        } catch (error) {
          console.warn('清理 Tauri 事件监听器失败:', error);
        }
      }),
    );
    // 清空数组
    unlistenFns.length = 0;
  };

  const cleanupAll = async (): Promise<void> => {
    unregisterWindowEvents();
    await cleanupTauri();
  };

  return {
    registerWindowEvents,
    unregisterWindowEvents,
    registerTauriEvents,
    cleanupAll,
  };
}
