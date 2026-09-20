import type { Editor } from '@milkdown/kit/core';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { Selection } from '@milkdown/kit/prose/state';
import type CherryEngineConstructor from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import type { CherryVisualRenderer } from './wysiwyg/index.js';

export type CherryMilkdownErrorPhase = 'create' | 'parse' | 'render';

export interface CherryEngineLike {
  /** Optional cleanup supplied by a custom renderer; not required of CherryEngine. */
  destroyRenderedContent?(container: Element): void;
  makeHtml(markdown: string): string;
}

// Cherry's published deep-entry declaration currently describes the runtime
// instance as `CherryEngine` rather than the `Engine` returned by its factory
// constructor, so `makeHtml` is missing from that inferred public type. Accept
// that exact published instance type at the API boundary, then validate its
// runtime contract before the editor uses it.
export type CherryEngineInput = CherryEngineLike | InstanceType<typeof CherryEngineConstructor>;

export interface CherryMilkdownChange {
  markdown: string;
}

export interface CherryMilkdownMathliveOptions {
  macros?: Record<string, string>;
  virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
}

export interface CherryMilkdownFileUploadParams {
  name?: string;
  width?: number | string;
  height?: number | string;
  isBorder?: boolean;
  isShadow?: boolean;
  isRadius?: boolean;
}

export interface CherryMilkdownFileUploadContext {
  /** Aborted when the picker is replaced, closed, or the editor is destroyed. */
  signal: AbortSignal;
}

/** Cherry-compatible upload callback. The editor never owns storage or networking. */
export type CherryMilkdownFileUpload = (
  file: File,
  callback: (url: string, params?: CherryMilkdownFileUploadParams) => void,
  context: CherryMilkdownFileUploadContext,
) => void | Promise<void>;

export type CherryMilkdownTheme = 'default' | 'dark' | 'abyss' | 'green' | 'red' | 'gray' | 'violet' | 'blue';

export interface CherryMilkdownOptions {
  /** Standalone host. Cherry editor and Previewer instances are not created. */
  root: string | HTMLElement;
  value?: string;
  /** Reuse an existing CherryEngine instance. */
  engine?: CherryEngineInput;
  /** Used only when this package creates the default CherryEngine. */
  engineOptions?: Record<string, unknown>;
  /** Selection formatting controls. No top toolbar is mounted. */
  bubble?: boolean;
  readonly?: boolean;
  /** Cherry theme token scope used by both rendered content and contextual controls. */
  theme?: CherryMilkdownTheme;
  debounce?: number;
  mathlive?: CherryMilkdownMathliveOptions;
  /** Optional Cherry-compatible uploader used by the image editor. */
  fileUpload?: CherryMilkdownFileUpload;
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
  setTheme(theme: CherryMilkdownTheme): void;
  focus(): void;
  destroy(): Promise<void>;
}

export type {
  CherryDiagramRenderContext,
  CherryVisualRenderer,
  CherryVisualRenderContext,
  CherryVisualRendererResult,
} from './wysiwyg/index.js';
