import { $ctx } from '@milkdown/kit/utils';
import type {
  CherryEngineLike,
  CherryMilkdownErrorPhase,
  CherryMilkdownFileUpload,
  CherryMilkdownMathliveOptions,
} from '../types.js';
import type { CherryVisualRenderer } from './types.js';

export interface CherryWysiwygConfig {
  engine: CherryEngineLike;
  /** Engine configured to emit package-owned mount markers inside native layouts. */
  nativeEngine?: CherryEngineLike;
  readonly: boolean;
  bubble: boolean;
  debounce: number;
  mathlive?: CherryMilkdownMathliveOptions;
  fileUpload?: CherryMilkdownFileUpload;
  renderers?: Record<string, CherryVisualRenderer>;
  onError?: (error: unknown, phase: CherryMilkdownErrorPhase) => void;
}

const fallbackConfig: CherryWysiwygConfig = {
  engine: { makeHtml: (markdown) => markdown },
  readonly: false,
  bubble: true,
  debounce: 30,
};

export const cherryWysiwygConfigCtx = $ctx<CherryWysiwygConfig, 'cherryWysiwygConfig'>(
  fallbackConfig,
  'cherryWysiwygConfig',
);
