import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { CherryVisualRenderer } from './wysiwyg/index.js';

export type CherryMilkdownErrorPhase = 'create' | 'parse' | 'render';

export interface CherryEngineLike {
  /** Optional cleanup supplied by a custom renderer; not required of CherryEngine. */
  destroyRenderedContent?(container: Element): void;
  makeHtml(markdown: string): string;
}

/** Cherry's published JS Engine entry has no matching subpath declaration.
 * Accept its instance and verify makeHtml at the runtime boundary. */
export type CherryEngineInput = object;

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
  /**
   * Visual renderers keyed by fenced-code language. A configured language is
   * automatically exposed as a live source block; `tableChart` is reserved
   * for Cherry table-chart previews.
   */
  renderers?: Record<string, CherryVisualRenderer>;
  onChange?: (result: CherryMilkdownChange) => void;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
}

export interface CherryMilkdownInstance {
  /** Cherry rendering boundary used by this instance. */
  engine: CherryEngineLike;
  getMarkdown(): string;
  /**
   * Full replacement outside IME. During IME, rebase the latest non-conflicting
   * write after commit; overlaps preserve local input and report onError('parse').
   */
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
