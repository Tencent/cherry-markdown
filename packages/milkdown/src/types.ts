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
  /** Reuse the current Cherry instance's engine when mounting in its previewer. */
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

export interface CherryPreviewContentRendererContext {
  container: HTMLElement;
  markdown: string;
  html: string;
}

export interface CherryPreviewContentRenderer {
  update(context: CherryPreviewContentRendererContext): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

export interface CherryPreviewerHost {
  getDom(): HTMLElement;
  update(html: string): void;
  setContentRenderer(renderer: CherryPreviewContentRenderer): void;
  clearContentRenderer(renderer?: CherryPreviewContentRenderer): boolean;
}

/** Minimal public surface used to connect Milkdown to an existing Cherry previewer. */
export interface CherryMilkdownHost {
  engine: CherryEngineLike;
  getMarkdown(): string;
  getPreviewer(): CherryPreviewerHost;
  setValue(markdown: string, keepCursor?: boolean): void;
}

export interface CherryMilkdownPreviewOptions extends Omit<
  CherryMilkdownOptions,
  'root' | 'value' | 'engine' | 'onChange'
> {
  onChange?: CherryMilkdownOptions['onChange'];
}

export interface CherryMilkdownPreviewInstance extends CherryMilkdownInstance {
  /** Detaches Milkdown and restores Cherry's native rendered preview. */
  detach(): Promise<void>;
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
