import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { TAURI_EVENTS, WINDOW_EVENTS } from '../../constants/events';

interface TauriHandlers {
  onNewFile: () => Promise<void> | void;
  onOpenFile: () => Promise<void> | void;
  onSave: () => Promise<void> | void;
  onSaveAs: () => Promise<void> | void;
  onToggleToolbar: () => Promise<void> | void;
}

interface AppEventHandlers {
  onOpenFileFromSidebar: (event: Event) => Promise<void> | void;
  onRequestSave: (event: Event) => Promise<void> | void;
  tauriHandlers: TauriHandlers;
}

export function useAppEvents({ onOpenFileFromSidebar, onRequestSave, tauriHandlers }: AppEventHandlers) {
  const unlistenFns: UnlistenFn[] = [];

  const registerWindowEvents = (): void => {
    window.addEventListener(WINDOW_EVENTS.OPEN_FILE_FROM_SIDEBAR, onOpenFileFromSidebar);
    window.addEventListener(WINDOW_EVENTS.REQUEST_SAVE, onRequestSave);
  };

  const unregisterWindowEvents = (): void => {
    window.removeEventListener(WINDOW_EVENTS.OPEN_FILE_FROM_SIDEBAR, onOpenFileFromSidebar);
    window.removeEventListener(WINDOW_EVENTS.REQUEST_SAVE, onRequestSave);
  };

  const registerTauriEvents = async (): Promise<void> => {
    const unlisteners = await Promise.all([
      listen(TAURI_EVENTS.NEW_FILE, tauriHandlers.onNewFile),
      listen(TAURI_EVENTS.OPEN_FILE, tauriHandlers.onOpenFile),
      listen(TAURI_EVENTS.SAVE, tauriHandlers.onSave),
      listen(TAURI_EVENTS.SAVE_AS, tauriHandlers.onSaveAs),
      listen(TAURI_EVENTS.TOGGLE_TOOLBAR, tauriHandlers.onToggleToolbar),
    ]);
    unlistenFns.push(...unlisteners);
  };

  const cleanupTauri = async (): Promise<void> => {
    await Promise.all(unlistenFns.map((fn) => fn()));
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
