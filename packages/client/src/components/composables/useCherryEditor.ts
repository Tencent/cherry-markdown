import { ref } from 'vue';
import { cherryInstance } from '../CherryMarkdown';
import type { CherryEditorInstance, CherryEditorMode } from '../editorTypes';
import { setEditorInstance } from './useEditor';
import { useImageLightbox, setCurrentLightbox, getCurrentLightbox } from './useImageLightbox';
import { usePreferencesStore, type EditorMode } from '../../store';

interface UseCherryEditorOptions {
  onContentChanged: () => void;
}

/**
 * Cherry 内置主题短名。与 CherryMarkdown.ts 的 themeSettings.themeList 保持一致。
 * `changeMainTheme` 事件的载荷就是这几个值之一。
 */
const CHERRY_THEMES = ['default', 'dark', 'green', 'red', 'violet', 'blue'] as const;
type CherryThemeName = (typeof CHERRY_THEMES)[number];

const DEFAULT_THEME: CherryThemeName = 'violet';
const CHERRY_THEME_STORAGE_KEY = 'cherry-theme';
const CHERRY_THEME_DATA_ATTR = 'cherry-theme';

const isCherryTheme = (value: unknown): value is CherryThemeName =>
  typeof value === 'string' && (CHERRY_THEMES as readonly string[]).includes(value);

/**
 * 把 cherry 主题短名同步到 <body data-cherry-theme="...">，用于驱动状态栏等外围区域的
 * CSS 变量覆盖（见 status-bar.css）。传入非法值时回落到默认主题。
 */
const applyCherryTheme = (theme: string): void => {
  const name = isCherryTheme(theme) ? theme : DEFAULT_THEME;
  document.body.setAttribute(`data-${CHERRY_THEME_DATA_ATTR}`, name);
};

/**
 * 读取 cherry 上次持久化的主题名。cherry 内部用 `${nameSpace}-theme` 作为 key，
 * 当前 nameSpace 为 'cherry'（见 CherryMarkdown.ts）。
 */
const readPersistedCherryTheme = (): CherryThemeName => {
  try {
    const raw = localStorage.getItem(CHERRY_THEME_STORAGE_KEY);
    if (raw && isCherryTheme(raw)) {
      return raw;
    }
  } catch {
    // 忽略隐私模式等 localStorage 不可用的情况
  }
  return DEFAULT_THEME;
};

export function useCherryEditor({ onContentChanged }: UseCherryEditorOptions) {
  const toolbarVisible = ref(true);
  let editor: CherryEditorInstance | null = null;
  let skipNextChange = true;
  let statusPollTimer: number | undefined;
  let lastKnownEditorMode: EditorMode | null = null;

  const getEditor = (): CherryEditorInstance => {
    if (!editor) {
      throw new Error('Cherry Markdown editor is not initialized');
    }
    return editor;
  };

  const handleAfterChange = (): void => {
    // 内容变更后同步刷新大图预览的图片列表
    getCurrentLightbox()?.refresh();
    if (skipNextChange) {
      skipNextChange = false;
      return;
    }
    onContentChanged();
  };

  const handleThemeChange = (theme: string): void => {
    applyCherryTheme(theme);
  };

  /**
   * 将 cherry 当前 status.editor 映射为持久化用的 EditorMode，
   * 仅在能够明确判断时才写回。cherry 内部 status 取值：
   *   editor: 'show' | 'hide'；previewer: 'show' | 'hide'
   * 映射规则：
   *   editor=show + previewer=show → edit&preview
   *   editor=show + previewer=hide → editOnly
   *   editor=hide                  → previewOnly
   */
  const detectEditorMode = (): EditorMode | null => {
    if (!editor) return null;
    const { status } = editor;
    if (!status) return null;
    if (status.editor === 'hide') return 'previewOnly';
    if (status.editor === 'show') {
      return status.previewer === 'hide' ? 'editOnly' : 'edit&preview';
    }
    return null;
  };

  const syncEditorModeToStore = (): void => {
    const mode = detectEditorMode();
    if (!mode || mode === lastKnownEditorMode) return;
    lastKnownEditorMode = mode;
    try {
      usePreferencesStore().setEditorMode(mode);
    } catch {
      // pinia 未就绪时忽略
    }
  };

  const handleToolbarShow = (): void => {
    toolbarVisible.value = true;
    try {
      usePreferencesStore().setToolbarVisible(true);
    } catch {
      // ignore
    }
  };

  const handleToolbarHide = (): void => {
    toolbarVisible.value = false;
    try {
      usePreferencesStore().setToolbarVisible(false);
    } catch {
      // ignore
    }
  };

  const initEditor = (): void => {
    // 初始 toolbarVisible 先取持久化值，cherry 初始化后再以实际 DOM 为准校正
    let persistedToolbarVisible = true;
    let persistedEditorMode: EditorMode = 'edit&preview';
    try {
      const prefs = usePreferencesStore();
      persistedToolbarVisible = prefs.toolbarVisible;
      persistedEditorMode = prefs.editorMode;
    } catch {
      // pinia 未就绪时使用默认值
    }
    toolbarVisible.value = persistedToolbarVisible;
    // 在 cherry 挂载前先按持久化值把主题写到 body，避免首屏“先默认色再切换”的闪烁
    applyCherryTheme(readPersistedCherryTheme());

    const instance = cherryInstance();
    // Cherry 官方类型的部分字段（如 status）被推断为宽泛类型，与内部收窄接口存在结构差异，
    // 通过 unknown 显式桥接，避免 TS 结构兼容报错
    const editorInstance = instance as unknown as CherryEditorInstance;
    editor = editorInstance;
    lastKnownEditorMode = persistedEditorMode;
    setEditorInstance(editorInstance);
    instance.on('afterChange', handleAfterChange);
    // 订阅 cherry 主题切换事件（toolbar/sidebar 上的主题下拉触发），
    // 将短名（default/dark/green/red/violet/blue）同步到 <body data-cherry-theme>。
    (instance as unknown as { on(event: 'changeMainTheme', handler: (theme: string) => void): void }).on(
      'changeMainTheme',
      handleThemeChange,
    );
    // 订阅 cherry 内部工具栏显隐事件，同步到持久化存储
    (
      instance as unknown as {
        on(event: 'toolbarShow' | 'toolbarHide', handler: () => void): void;
      }
    ).on('toolbarShow', handleToolbarShow);
    (
      instance as unknown as {
        on(event: 'toolbarShow' | 'toolbarHide', handler: () => void): void;
      }
    ).on('toolbarHide', handleToolbarHide);

    // cherry 初始化时 defaultModel 已根据持久化值设置，但 toolbar 隐藏需要手动达成
    // （初始 defaultModel !== previewOnly 时 cherry 默认显示 toolbar）
    setTimeout(() => {
      // 以实际 DOM 为准校正 toolbarVisible（兼容 previewOnly 下 cherry 自行隐藏的行为）
      const actualVisible = !document.querySelector('.cherry--no-toolbar');
      if (persistedToolbarVisible !== actualVisible) {
        // 需要切换到持久化的可见性状态
        const toggleHandler = editorInstance.toolbar.toolbarHandlers.settings;
        if (typeof toggleHandler === 'function') {
          toggleHandler('toggleToolbar');
        }
      }
      toolbarVisible.value = !document.querySelector('.cherry--no-toolbar');
    }, 0);

    // 初始化图片大图预览（viewerjs），延迟到 DOM 就绪后创建
    setTimeout(() => {
      const lightbox = useImageLightbox(editorInstance);
      setCurrentLightbox(lightbox);
    }, 0);

    // 启动轻量轮询，捕获 cherry 内置按钮（如 toolbarRight 的 togglePreview、customMenuChangeModule 等）
    // 触发的模式切换，确保【双栏/纯编辑/纯预览】三种模式都能被记忆
    statusPollTimer = window.setInterval(syncEditorModeToStore, 500);
  };

  const setMarkdown = (markdown: string): void => {
    skipNextChange = true;
    getEditor().setMarkdown(markdown);
  };

  const getMarkdown = (): string => getEditor().getMarkdown();

  const scrollPreviewToTop = (): void => {
    getEditor().previewer.scrollToTop(0, 'instant');
  };

  const toggleToolbar = (): void => {
    const toggleHandler = getEditor().toolbar.toolbarHandlers.settings;
    if (typeof toggleHandler === 'function') {
      toggleHandler('toggleToolbar');
    }
    toolbarVisible.value = !toolbarVisible.value;
    try {
      usePreferencesStore().setToolbarVisible(toolbarVisible.value);
    } catch {
      // ignore
    }
  };

  /**
   * 外部主动切换编辑器模式时使用：同时将新模式写回持久化存储
   */
  const switchEditorMode = (mode: CherryEditorMode, needSyncToolbar = true): void => {
    getEditor().switchModel(mode, needSyncToolbar);
    lastKnownEditorMode = mode as EditorMode;
    try {
      usePreferencesStore().setEditorMode(mode as EditorMode);
    } catch {
      // ignore
    }
  };

  const disposeEditor = (): void => {
    if (statusPollTimer) {
      window.clearInterval(statusPollTimer);
      statusPollTimer = undefined;
    }
    editor?.off?.('afterChange', handleAfterChange);
    (editor as unknown as { off?(event: 'changeMainTheme', handler: (theme: string) => void): void } | null)?.off?.(
      'changeMainTheme',
      handleThemeChange,
    );
    (
      editor as unknown as {
        off?(event: 'toolbarShow' | 'toolbarHide', handler: () => void): void;
      } | null
    )?.off?.('toolbarShow', handleToolbarShow);
    (
      editor as unknown as {
        off?(event: 'toolbarShow' | 'toolbarHide', handler: () => void): void;
      } | null
    )?.off?.('toolbarHide', handleToolbarHide);
    document.body.removeAttribute(`data-${CHERRY_THEME_DATA_ATTR}`);
    getCurrentLightbox()?.destroy();
    setCurrentLightbox(null);
    setEditorInstance(null);
    editor = null;
  };

  return {
    toolbarVisible,
    getEditor,
    getMarkdown,
    initEditor,
    setMarkdown,
    scrollPreviewToTop,
    toggleToolbar,
    switchEditorMode,
    disposeEditor,
  };
}
