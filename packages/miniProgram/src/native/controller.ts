import CherryStream from '../renderer';
import { withNativeKeys } from './keys';
import type { MiniProgramRenderOptions, MiniProgramViewBlock } from '../types';

export type NativeViewBlock = MiniProgramViewBlock & { id: string };
export type NativeViewPatch = Record<string, NativeViewBlock | NativeViewBlock[]>;
export type NativeCommit = (patch: NativeViewPatch, done: () => void) => void;

/** Reconcile complete results, including earlier blocks affected by later Markdown. */
export class NativeViewState {
  private blocks: NativeViewBlock[] = [];
  private signatures: string[] = [];
  private sequence = 0;

  update(view: MiniProgramViewBlock[]): NativeViewPatch {
    const signatures = view.map((block) => JSON.stringify(block));
    const available = new Map<string, NativeViewBlock[]>();
    for (let index = this.signatures.length - 1; index >= 0; index--) {
      const signature = this.signatures[index];
      const matches = available.get(signature) || [];
      matches.push(this.blocks[index]);
      available.set(signature, matches);
    }
    const matches = signatures.map((signature) => available.get(signature)?.pop());
    const reserved = new Set(matches.flatMap((block) => (block ? [block.id] : [])));
    const blocks = view.map((block, index): NativeViewBlock => {
      if (matches[index]) return matches[index];
      const previous = this.blocks[index];
      const id = previous?.type === block.type && !reserved.has(previous.id) ? previous.id : `md-${this.sequence++}`;
      return { ...withNativeKeys(block, id), id };
    });
    const patch: NativeViewPatch = {};
    // setData cannot truncate an array with indexed updates.
    if (blocks.length < this.blocks.length) {
      patch.blocks = blocks;
    } else {
      blocks.forEach((block, index) => {
        if (block !== this.blocks[index]) patch[`blocks[${index}]`] = block;
      });
    }
    this.blocks = blocks;
    this.signatures = signatures;
    return patch;
  }
}

export interface NativeControllerOptions {
  interval?: number;
  renderOptions?: MiniProgramRenderOptions;
}

/** Coalesces input and permits at most one native commit in flight. */
export class NativeMarkdownController {
  private readonly state = new NativeViewState();
  private readonly renderer = new CherryStream();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pending: { markdown: string; streaming: boolean } | undefined;
  private committing = false;
  private disposed = false;

  constructor(
    private readonly commit: NativeCommit,
    private readonly options: NativeControllerOptions = {},
  ) {}

  setMarkdown(markdown: string, streaming = false): void {
    if (this.disposed) return;
    this.pending = { markdown, streaming };
    if (!streaming) {
      this.flush();
    } else if (!this.timer && !this.committing) {
      this.timer = setTimeout(() => this.flush(), Math.max(16, this.options.interval ?? 80));
    }
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (this.disposed || this.committing || !this.pending) return;
    const { markdown, streaming } = this.pending;
    this.pending = undefined;
    const view = this.renderer.setMarkdown(markdown, {
      ...this.options.renderOptions,
      deferImages: streaming,
    });
    const patch = this.state.update(view);
    if (Object.keys(patch).length === 0) return;
    this.committing = true;
    this.commit(patch, () => {
      this.committing = false;
      if (this.disposed || !this.pending) return;
      // A completed stream must not wait for the streaming timer.
      if (!this.pending.streaming) this.flush();
      else this.setMarkdown(this.pending.markdown, true);
    });
  }

  dispose(): void {
    this.disposed = true;
    this.pending = undefined;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
