export type CherryEditorMode = 'previewOnly' | 'edit&preview' | 'editOnly';

export interface CherryEditorStats {
  characters?: number;
  words?: number;
  lines?: number;
}

export interface CherryEditorInstance {
  focusMode: boolean;
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
