export type CherryEditorMode = 'previewOnly' | 'edit&preview' | 'editOnly';

export interface CherryEditorStats {
  characters?: number;
  words?: number;
  lines?: number;
}

export interface CherryEditorInstance {
  focusMode: boolean;
  /**
   * Cherry 实例挂载后暴露的最外层 DOM 容器
   * （包含 toolbar、editor、previewer、sidebar 等所有子结构），
   * 在 customMenu 的 onClick 里常用于查询 sidebar 内的 toolbar 按钮做样式联动。
   * 类型标为可选，避免在初始化早期访问时报错。
   */
  wrapperDom?: HTMLElement;
  editor?: {
    wordCount?: (mode: number) => CherryEditorStats | undefined;
    refresh?: () => void;
  };
  previewer: {
    scrollToTop(offset: number, behavior?: ScrollBehavior | 'instant'): void;
    getDomContainer?(): HTMLElement;
  };
  toolbar: {
    toolbarHandlers: {
      [key: string]: unknown;
    };
  };
  status?: {
    toolbar?: string;
    previewer?: string;
    editor?: string;
  };
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  switchModel(mode: CherryEditorMode, needSyncToolbar?: boolean): void;
  on(event: 'afterChange', handler: () => void): void;
  off(event: 'afterChange', handler: () => void): void;
}
