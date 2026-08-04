import type { CherryEngineLike, CherryMilkdownErrorPhase } from '../types.js';

export interface CherryWysiwygConfig {
  engine: CherryEngineLike;
  readonly: boolean;
  renderers?: Record<string, CherryVisualRenderer>;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
}

export interface CherryVisualRenderContext {
  container: HTMLElement;
  engine: CherryEngineLike;
  source: string;
  syntax: string;
}

export type CherryVisualRendererResult = void | string | (() => void);
export type CherryVisualRenderer = (
  context: CherryVisualRenderContext,
) => CherryVisualRendererResult | Promise<CherryVisualRendererResult>;

export interface CherryVisualNodeAttrs {
  syntax: string;
  source: string;
}

export interface CherryInlineMatch {
  from: number;
  to: number;
  type: string;
  text?: string;
  attrs?: Record<string, string>;
  source: string;
}
