import type { SemanticBlock, SemanticEngine, SemanticOptions, SemanticTransformOptions } from './types';
import { SemanticWriter } from './writer';
import type { SemanticResult, SemanticSegment } from './writer';

export interface SemanticParseStats {
  mode: 'full' | 'incremental' | 'unchanged';
  parsedCharacters: number;
  reusedCharacters: number;
  reason?: 'replacement' | 'document-dependency' | 'configuration' | 'boundary-validation';
}

const hasFunction = (value: unknown, seen = new WeakSet<object>()): boolean => {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((item) => hasFunction(item, seen));
};
const join = (segments: SemanticSegment[]): SemanticBlock[] => segments.flatMap((segment) => segment.blocks);

/** Incremental checkpoints come from Cherry's parsed top-level blocks, never guessed fence regexes. */
export class SemanticParser {
  private source = '';
  private frozenOffset = 0;
  private frozen: SemanticSegment[] = [];
  private last: SemanticResult = { blocks: [], segments: [], documentDependent: false, checkpointBlocked: false };
  private optionKey = '';
  private dependency = false;
  private readonly configurationDependent: boolean;
  stats: SemanticParseStats = { mode: 'full', parsedCharacters: 0, reusedCharacters: 0 };

  constructor(
    private readonly engine: SemanticEngine,
    options: SemanticOptions = {},
  ) {
    const syntax = options.engine?.syntax;
    const emphasis = syntax?.fontEmphasis as { allowWhitespace?: boolean } | undefined;
    this.configurationDependent =
      options.incremental === false ||
      hasFunction(options) ||
      !!emphasis?.allowWhitespace ||
      (!!options.engine?.customSyntax && Object.keys(options.engine.customSyntax as object).length > 0);
  }

  private headings(segments: SemanticSegment[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const segment of segments) for (const base of segment.headings) counts.set(base, (counts.get(base) || 0) + 1);
    return counts;
  }

  private render(
    source: string,
    options: SemanticTransformOptions,
    headings: ReadonlyMap<string, number>,
  ): SemanticResult {
    this.stats.parsedCharacters += source.length;
    const writer = new SemanticWriter((value) => this.engine.restoreSemanticText(value), options, headings);
    return writer.finish(this.engine.makeSemantic(source, writer, options.forceNoCursor !== false));
  }

  parse(markdown: string, options: SemanticTransformOptions = {}): SemanticResult {
    markdown = markdown.replace(/\r\n?/g, '\n');
    const key = JSON.stringify({ unknownTag: options.unknownTag || 'text', cursor: options.forceNoCursor !== false });
    const append = markdown.startsWith(this.source) && key === this.optionKey;
    this.stats = { mode: 'full', parsedCharacters: 0, reusedCharacters: 0 };
    if (!append) {
      this.frozenOffset = 0;
      this.frozen = [];
      this.dependency = false;
      this.stats.reason = key !== this.optionKey && this.optionKey ? 'configuration' : 'replacement';
    }
    let global = this.dependency || this.configurationDependent;
    if (global) {
      this.frozenOffset = 0;
      this.frozen = [];
      this.stats.reason = this.configurationDependent ? 'configuration' : 'document-dependency';
    }
    if (markdown === this.source && key === this.optionKey && !this.configurationDependent) {
      this.stats.mode = 'unchanged';
      this.stats.reusedCharacters = markdown.length;
      return this.last;
    }
    let suffix = markdown.slice(this.frozenOffset);
    let seed = this.headings(this.frozen);
    let result = this.render(suffix, options, seed);
    if (result.documentDependent) {
      this.dependency = true;
      global = true;
      this.stats.reason = 'document-dependency';
      if (this.frozenOffset) {
        this.frozenOffset = 0;
        this.frozen = [];
        suffix = markdown;
        seed = new Map();
        result = this.render(suffix, options, seed);
      }
    }
    this.stats.reusedCharacters = this.frozenOffset;
    this.stats.mode = this.frozenOffset ? 'incremental' : 'full';
    const combined = {
      blocks: [...join(this.frozen), ...result.blocks],
      segments: [...this.frozen, ...result.segments],
      documentDependent: global,
      checkpointBlocked: result.checkpointBlocked,
    };

    // Retain two trailing parsed blocks and their leading separator: future input may extend/reclassify it.
    if (!global && !result.checkpointBlocked && result.segments.length > 2) {
      const complete = result.segments.slice(0, -2);
      const lines = complete.reduce((total, segment) => total + segment.lines, 0);
      let offset = 0;
      for (let line = 0; line < lines; line++) {
        const newline = suffix.indexOf('\n', offset);
        if (newline === -1) {
          offset = 0;
          break;
        }
        offset = newline + 1;
      }
      if (offset > 0 && offset < suffix.length) {
        // Cherry's line counts are primarily preview metadata. Verify the proposed source boundary
        // with the actual parser before trusting it as an incremental checkpoint.
        const left = this.render(suffix.slice(0, offset), options, seed);
        const right = this.render(suffix.slice(offset), options, this.headings([...this.frozen, ...complete]));
        if (
          JSON.stringify(left.blocks) === JSON.stringify(join(complete)) &&
          JSON.stringify(right.blocks) === JSON.stringify(join(result.segments.slice(-2)))
        ) {
          this.frozen.push(...complete);
          this.frozenOffset += offset;
        } else this.stats.reason = 'boundary-validation';
      }
    }
    this.source = markdown;
    this.optionKey = key;
    this.last = combined;
    return combined;
  }
}
