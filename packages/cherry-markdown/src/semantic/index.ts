import { createSemanticEngine, cloneSemanticBlocks } from './engine';
import { SemanticParser } from './parser';
import type { SemanticOptions, SemanticTransformOptions, SemanticEngine, SemanticBlock } from './types';
import type { SemanticParseStats } from './parser';

export const SEMANTIC_SCHEMA_VERSION = 1 as const;
export const SEMANTIC_CORE_VERSION: string = CHERRY_SEMANTIC_CORE_VERSION;
export interface SemanticDocument {
  schemaVersion: typeof SEMANTIC_SCHEMA_VERSION;
  blocks: SemanticBlock[];
  stats: Readonly<SemanticParseStats>;
}

export interface SemanticBridge {
  readonly schemaVersion: number;
  readonly engine: SemanticEngine;
  parse(markdown: string, options?: SemanticTransformOptions): SemanticDocument;
  getParseStats(): Readonly<SemanticParseStats>;
}

/** Shared Cherry grammar and incremental state, independent of Web or native rendering. */
export class CherrySemanticParser implements SemanticBridge {
  readonly schemaVersion = SEMANTIC_SCHEMA_VERSION;
  readonly engine: SemanticEngine;
  readonly options: SemanticOptions;
  private readonly parser: SemanticParser;

  constructor(options: SemanticOptions = {}) {
    this.options = {
      ...options,
      engine: {
        ...options.engine,
        global: {
          ...options.engine?.global,
          flowSessionContext: options.engine?.global?.flowSessionContext ?? true,
        },
      },
    };
    this.engine = createSemanticEngine(this.options) as SemanticEngine;
    this.parser = new SemanticParser(this.engine, this.options);
  }

  parse(markdown: string, options: SemanticTransformOptions = {}): SemanticDocument {
    const result = this.parser.parse(markdown || '', options);
    return {
      schemaVersion: SEMANTIC_SCHEMA_VERSION,
      blocks: cloneSemanticBlocks(result.blocks),
      stats: this.getParseStats(),
    };
  }

  getParseStats(): Readonly<SemanticParseStats> {
    return { ...this.parser.stats };
  }
}

export default CherrySemanticParser;
export type * from './types';
export type { SemanticParseStats } from './parser';
export { createSemanticEngine, cloneSemanticBlocks, isValidSemanticUrl } from './engine';

export { cherryThemes } from './theme';
export type { CherryThemeName, CherryThemeTokens } from './theme';

export { parseDocument as parseHtmlDocument } from 'htmlparser2';

export type { SemanticRenderer } from '~types/semantic';
