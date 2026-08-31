import type { Editor } from '@milkdown/kit/core';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { CherryOptions } from 'cherry-markdown/types/cherry';
import type { CherryVisualRenderer } from './wysiwyg/index.js';

export type CherryMilkdownErrorPhase = 'create' | 'parse' | 'render';

export interface CherryEngineLike {
  makeHtml(markdown: string): string;
  /** Optional future/public cleanup contract. Older Cherry versions use the hook fallback below. */
  destroyRenderedContent?(container: Element): void;
  /** @internal Compatibility surface used only to dispose native table-chart instances. */
  hooks?: Partial<
    Record<
      'sentence' | 'paragraph',
      Array<{
        chartRenderEngine?: {
          destroyChart?(target: Element): void;
        };
      }>
    >
  >;
}

export interface CherryMilkdownChange {
  markdown: string;
}

export interface CherryUpdateContext {
  source?: string;
  revision?: number;
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
  /** @internal Use Cherry's native preview surface without Milkdown's floating component chrome. */
  nativePreview?: boolean;
  renderers?: Record<string, CherryVisualRenderer>;
  onChange?: (result: CherryMilkdownChange) => void;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
  /** @internal Immediate document synchronization used by the Cherry preview extension. */
  onImmediateChange?: (result: CherryMilkdownChange) => void;
}

export interface CherryPreviewContentRendererContext {
  container: HTMLElement;
  markdown: string;
  html: string;
  updateContext?: CherryUpdateContext;
}

export interface CherryPreviewContentRenderer {
  update(context: CherryPreviewContentRendererContext): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

export interface CherryPreviewerHost {
  getDom(): HTMLElement;
  update(html: string, updateContext?: CherryUpdateContext): void;
  setContentRenderer(renderer: CherryPreviewContentRenderer): void;
  clearContentRenderer(renderer?: CherryPreviewContentRenderer): boolean;
  setEditingBridge?(bridge: CherryPreviewEditingBridge): void;
  clearEditingBridge?(bridge?: CherryPreviewEditingBridge): boolean;
}

export interface CherryToolbarCommand {
  name: string;
  shortKey: string;
  event?: Event;
  menu?: unknown;
}

export interface CherryToolbarCommandState {
  active: boolean;
  enabled: boolean;
  value?: string | number;
  subMenuIndex?: number;
}

export type CherryPreviewElementKind = 'image' | 'mermaid';

export interface CherryPreviewElementChange {
  kind: CherryPreviewElementKind;
  width?: number | string;
  height?: number | string;
  type?: string;
}

export interface CherryPreviewEditingBridge {
  isActive(): boolean;
  /** Return true when the preview editor owns scroll synchronization. */
  handleScroll?(container: HTMLElement): boolean;
  /** Return true to suppress Cherry's source-to-preview line animation. */
  handleEditorScroll?(lineNum: number | null, linePercent?: number): boolean;
  queryCommandState?(command: CherryToolbarCommand): CherryToolbarCommandState;
  runCommand?(command: CherryToolbarCommand): boolean;
  insert?(content: string, options: { select: boolean; focus: boolean }): boolean;
  /** Whether a native preview control may operate on an element owned by this editing surface. */
  ownsPreviewElement?(target: Element, kind: CherryPreviewElementKind): boolean;
  /** Apply an existing Cherry preview control to an element owned by this editing surface. */
  updatePreviewElement?(target: Element, change: CherryPreviewElementChange): boolean;
  destroy?(): void;
}

/** Minimal public surface used to connect Milkdown to an existing Cherry previewer. */
export interface CherryMilkdownHost {
  engine: CherryEngineLike;
  /** Cherry's existing source editor. Used by the preview bridge for scroll synchronization. */
  editor?: {
    scrollToLineNum(lineNum: number | null, endLine?: number, percent?: number): void;
  };
  getMarkdown(): string;
  getPreviewer(): CherryPreviewerHost;
  setValue(markdown: string, keepCursor?: boolean, updateContext?: CherryUpdateContext): void;
  getCodeMirror?(): { hasFocus: boolean };
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
