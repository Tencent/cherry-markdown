export type CherryEditorMode = 'previewOnly' | 'edit&preview';

export interface CherryEditorStats {
  characters?: number;
  words?: number;
  lines?: number;
}

export interface CherryEditorInstance {
  editor?: {
    wordCount?: (mode: number) => CherryEditorStats | undefined;
  };
  previewer: {
    scrollToTop(offset: number, behavior?: ScrollBehavior | 'instant'): void;
  };
  toolbar: {
    toolbarHandlers: {
      [key: string]: unknown;
    };
  };
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  switchModel(mode: CherryEditorMode): void;
  on(event: 'afterChange', handler: () => void): void;
  off(event: 'afterChange', handler: () => void): void;
}
