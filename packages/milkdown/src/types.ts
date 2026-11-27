// This published declaration also exists before Cherry's dist build.
import type { CherryOptions } from 'cherry-markdown/types/cherry.js';
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

/**
 * Rendering hooks supported by the built-in Engine adapter.
 * Advanced Cherry configuration belongs on an explicitly supplied engine.
 */
export interface CherryMilkdownEngineOptions {
  callback?: Pick<NonNullable<CherryOptions['callback']>, 'urlProcessor' | 'beforeImageMounted'>;
}

export interface CherryMilkdownOptions {
  /** Container for the editor’s owned Shadow DOM host. */
  root: string | HTMLElement;
  /** Initial Markdown. Defaults to an empty string. */
  value?: string;
  /** Custom Cherry renderer. Defaults to the built-in Engine; excludes engineOptions. */
  engine?: CherryEngineInput;
  /** Default Engine rendering hooks. Defaults to Cherry behavior; excludes engine. */
  engineOptions?: CherryMilkdownEngineOptions;
  /** Selection formatting controls. Defaults to true; hidden in readonly mode. */
  bubble?: boolean;
  /** Disable user editing. Defaults to false; API writes still work. */
  readonly?: boolean;
  /** Theme for content and controls. Defaults to 'default'. */
  theme?: CherryMilkdownTheme;
  /** Non-negative finite milliseconds. Defaults to 30; notifications and preview scheduling. */
  debounce?: number;
  /** Formula options. Defaults to MathLive behavior; requires the optional mathlive peer. */
  mathlive?: CherryMilkdownMathliveOptions;
  /** Image uploader. Defaults to no upload handler; URL editing remains available. */
  fileUpload?: CherryMilkdownFileUpload;
  /** Additional plugins. Defaults to []; schema/NodeView overrides require integration checks. */
  plugins?: MilkdownPlugin[];
  /**
   * Defaults to no custom renderers; Mermaid has a built-in lazy renderer.
   * Visual renderers keyed by fenced-code language. A configured language is
   * automatically exposed as a live source block; `tableChart` is reserved
   * for Cherry table-chart previews.
   */
  renderers?: Record<string, CherryVisualRenderer>;
  /** Optional debounced Markdown notification. Defaults to no callback. */
  onChange?: (result: CherryMilkdownChange) => void;
  /** Optional create/parse/render error callback. Defaults to no callback. */
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
