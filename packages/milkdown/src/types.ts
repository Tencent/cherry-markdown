import type { Editor } from '@milkdown/kit/core';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { CherryOptions } from 'cherry-markdown/types/cherry';
import type { CherryRawPattern } from './raw/index.js';

export type CherryMilkdownErrorPhase = 'create' | 'parse' | 'render';

export interface CherryEngineLike {
  makeHtml(markdown: string): string;
}

export interface CherryMilkdownChange {
  markdown: string;
  html: string;
}

export interface CherryMilkdownOptions {
  root: HTMLElement;
  value?: string;
  previewRoot?: HTMLElement;
  cherryOptions?: Partial<CherryOptions>;
  readonly?: boolean;
  debounce?: number;
  plugins?: MilkdownPlugin[];
  rawPatterns?: CherryRawPattern[];
  onChange?: (result: CherryMilkdownChange) => void;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
}

export interface CherryMilkdownInstance {
  editor: Editor;
  engine: CherryEngineLike;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  renderPreview(): string;
  focus(): void;
  destroy(): Promise<void>;
}
