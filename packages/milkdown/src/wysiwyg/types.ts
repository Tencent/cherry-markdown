import type { CherryEngineLike } from '../types.js';

export interface CherryVisualRenderContext {
  container: HTMLElement;
  engine: CherryEngineLike;
  source: string;
  syntax: string;
  /** Aborted when this revision is replaced or its NodeView is destroyed. */
  signal?: AbortSignal;
}

export type CherryDiagramRenderContext = CherryVisualRenderContext;

export type CherryVisualRendererResult = void | string | (() => void);
export type CherryVisualRenderer = (
  context: CherryVisualRenderContext,
) => CherryVisualRendererResult | Promise<CherryVisualRendererResult>;

export interface CherryInlineMatch {
  from: number;
  to: number;
  type: string;
  text?: string;
  attrs?: Record<string, string>;
  source: string;
}
