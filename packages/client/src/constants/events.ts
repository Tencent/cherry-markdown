export const TAURI_EVENTS = {
  NEW_FILE: 'new_file',
  OPEN_FILE: 'open_file',
  SAVE: 'save',
  SAVE_AS: 'save_as',
  TOGGLE_TOOLBAR: 'toggle_toolbar',
} as const;

export const WINDOW_EVENTS = {
  OPEN_FILE_FROM_SIDEBAR: 'open-file-from-sidebar',
  REQUEST_SAVE: 'cherry:request-save',
} as const;

export type TauriEventName = (typeof TAURI_EVENTS)[keyof typeof TAURI_EVENTS];
export type WindowEventName = (typeof WINDOW_EVENTS)[keyof typeof WINDOW_EVENTS];
