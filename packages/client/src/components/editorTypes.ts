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
  /**
   * 清空底层 CodeMirror 的 undo/redo 历史栈。
   * 在客户端切换文件后调用，避免撤销回到上一个文件的内容。
   */
  clearUndoRedo?(): void;
  on(event: 'afterChange', handler: () => void): void;
  off(event: 'afterChange', handler: () => void): void;
}
