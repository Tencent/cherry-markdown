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

export interface CherryMilkdownHost {
  options: CherryOptions;
  engine: CherryEngineLike;
  getInstanceId(): string;
  getMarkdown(): string;
  getPreviewer(): {
    getDom(): HTMLElement;
    getDomContainer(): HTMLElement;
    setContentRenderer?(renderer: {
      update(html: string): void;
      getValue?(): string;
      destroy?(): void;
    }): () => void;
  };
  setValue(markdown: string, keepCursor?: boolean): void;
  destroy(): void;
}

export interface CherryMilkdownChange {
  markdown: string;
  /** Present when the editor is mounted through Cherry.usePlugin(). */
  cherry?: CherryMilkdownHost;
  /** Present when the editor is mounted through Cherry.usePlugin(). */
  instanceId?: string;
}

export interface CherryMilkdownMathliveOptions {
  macros?: Record<string, string>;
  virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
}

export interface CherryMilkdownPluginOptions {
  /** Selection formatting controls. No top toolbar is mounted. */
  bubble?: boolean;
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
  trackSelection(): { resolve(): Selection | null; release(): void };
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
