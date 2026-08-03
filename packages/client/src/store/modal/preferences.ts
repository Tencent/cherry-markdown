import { defineStore } from 'pinia';

export type EditorMode = 'edit&preview' | 'editOnly' | 'previewOnly';
export type WidthMode = 'fixed' | 'auto';
export type EditorEngine = 'cherry' | 'milkdown';

interface PreferencesState {
  focusMode: boolean;
  widthMode: WidthMode;
  editorMode: EditorMode;
  toolbarVisible: boolean;
  engine: EditorEngine;
}

const STORAGE_KEY = 'cherry_markdown_ui_preferences';

const DEFAULT_STATE: PreferencesState = {
  focusMode: false,
  widthMode: 'fixed',
  editorMode: 'edit&preview',
  toolbarVisible: true,
  engine: 'cherry',
};

const isEditorMode = (v: unknown): v is EditorMode => v === 'edit&preview' || v === 'editOnly' || v === 'previewOnly';

const isWidthMode = (v: unknown): v is WidthMode => v === 'fixed' || v === 'auto';

const isEditorEngine = (v: unknown): v is EditorEngine => v === 'cherry' || v === 'milkdown';

const loadFromStorage = (): PreferencesState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<PreferencesState>;
    return {
      focusMode: typeof parsed.focusMode === 'boolean' ? parsed.focusMode : DEFAULT_STATE.focusMode,
      widthMode: isWidthMode(parsed.widthMode) ? parsed.widthMode : DEFAULT_STATE.widthMode,
      editorMode: isEditorMode(parsed.editorMode) ? parsed.editorMode : DEFAULT_STATE.editorMode,
      toolbarVisible: typeof parsed.toolbarVisible === 'boolean' ? parsed.toolbarVisible : DEFAULT_STATE.toolbarVisible,
      engine: isEditorEngine(parsed.engine) ? parsed.engine : DEFAULT_STATE.engine,
    };
  } catch (error) {
    console.warn('加载 UI 偏好失败:', error);
    return { ...DEFAULT_STATE };
  }
};

const saveToStorage = (state: PreferencesState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('保存 UI 偏好失败:', error);
  }
};

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => loadFromStorage(),
  actions: {
    setFocusMode(value: boolean) {
      this.focusMode = value;
      saveToStorage(this.$state);
    },
    setWidthMode(mode: WidthMode) {
      this.widthMode = mode;
      saveToStorage(this.$state);
    },
    setEditorMode(mode: EditorMode) {
      this.editorMode = mode;
      saveToStorage(this.$state);
    },
    setToolbarVisible(value: boolean) {
      this.toolbarVisible = value;
      saveToStorage(this.$state);
    },
    setEngine(engine: EditorEngine) {
      this.engine = engine;
      saveToStorage(this.$state);
    },
  },
});
