import { $ctx } from '@milkdown/kit/utils';
import type { CherryEngineLike, CherryMilkdownErrorPhase, CherryMilkdownMathliveOptions } from '../types.js';
import type { CherryVisualRenderer } from './types.js';

export interface CherryWysiwygConfig {
  engine: CherryEngineLike;
  readonly: boolean;
  debounce: number;
  mathlive?: CherryMilkdownMathliveOptions;
  renderers?: Record<string, CherryVisualRenderer>;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
}

const fallbackConfig: CherryWysiwygConfig = {
  engine: { makeHtml: (markdown) => markdown },
  readonly: false,
  debounce: 30,
};

export const cherryWysiwygConfigCtx = $ctx<CherryWysiwygConfig, 'cherryWysiwygConfig'>(
  fallbackConfig,
  'cherryWysiwygConfig',
);
