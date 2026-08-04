import type { Editor } from '@milkdown/kit/core';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { CherryOptions } from 'cherry-markdown/types/cherry';
import type { CherryVisualRenderer } from './wysiwyg/index.js';

export type CherryMilkdownErrorPhase = 'create' | 'parse' | 'render';

export interface CherryEngineLike {
  makeHtml(markdown: string): string;
}

export interface CherryMilkdownChange {
  markdown: string;
}

export interface CherryMilkdownMathliveOptions {
  macros?: Record<string, string>;
  virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
}

export interface CherryMilkdownOptions {
  root: HTMLElement;
  value?: string;
  cherryOptions?: Partial<CherryOptions>;
  readonly?: boolean;
  debounce?: number;
  mathlive?: CherryMilkdownMathliveOptions;
  plugins?: MilkdownPlugin[];
  renderers?: Record<string, CherryVisualRenderer>;
  onChange?: (result: CherryMilkdownChange) => void;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
}

export interface CherryMilkdownInstance {
  editor: Editor;
  engine: CherryEngineLike;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  focus(): void;
  destroy(): Promise<void>;
}

export type {
  CherryDiagramRenderContext,
  CherryVisualRenderer,
  CherryVisualRenderContext,
  CherryVisualRendererResult,
} from './wysiwyg/index.js';
