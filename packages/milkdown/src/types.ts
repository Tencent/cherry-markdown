import type { Editor } from '@milkdown/kit/core';
import type { Selection } from '@milkdown/kit/prose/state';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { CherryOptions } from 'cherry-markdown/types/cherry';
import type { CherryVisualRenderer } from './wysiwyg/index.js';

export type CherryMilkdownErrorPhase = 'create' | 'parse' | 'render';

export interface CherryEngineLike {
  /** Optional cleanup supplied by a custom renderer; not required of CherryEngine. */
  destroyRenderedContent?(container: Element): void;
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
  el: HTMLElement;
  /** Native Cherry theme; does not change the document. */
  theme?: string;
  /** Selection formatting controls. No top toolbar is mounted. */
  bubble?: boolean;
  value?: string;
  /** Optional renderer supplied by the consumer. No Cherry editor instance is required. */
  engine?: CherryEngineLike;
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
  /** @internal Keeps an async picker anchored while transactions occur. */
  trackSelection?(): { resolve(): Selection | null; release(): void };
  getMarkdown(): string;
  setMarkdown(markdown: string, options?: { emit?: boolean }): void;
  focus(): void;
  destroy(): Promise<void>;
}

export type {
  CherryDiagramRenderContext,
  CherryVisualRenderer,
  CherryVisualRenderContext,
  CherryVisualRendererResult,
} from './wysiwyg/index.js';
