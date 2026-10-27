// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import CherryStream from '../src';
import { NativeMarkdownController, NativeViewState } from '../src/native/controller';
import type { NativeViewPatch } from '../src/native/controller';
import type { MiniProgramViewBlock } from '../src/types';

const paragraph = (text: string): MiniProgramViewBlock => ({ type: 'paragraph', inlines: [{ type: 'text', text }] });
afterEach(() => vi.useRealTimers());

describe('native view reconciliation', () => {
  it('only transmits the changing tail and keeps its native component identity', () => {
    const state = new NativeViewState();
    const initial = state.update([paragraph('fixed'), paragraph('a')]);
    const patch = state.update([paragraph('fixed'), paragraph('ab')]);
    expect(Object.keys(patch)).toEqual(['blocks[1]']);
    expect(patch['blocks[1]']).toMatchObject({ id: (initial['blocks[1]'] as { id: string }).id });
    expect(state.update([paragraph('fixed'), paragraph('ab')])).toEqual({});
  });

  it('keeps transmission bounded to the changed block in a long document', () => {
    const state = new NativeViewState();
    const view = Array.from({ length: 1000 }, (_, index) => paragraph(`Paragraph ${index}: ${'content '.repeat(20)}`));
    state.update(view);
    const updated = [...view.slice(0, -1), paragraph('Changed tail')];
    const patch = state.update(updated);
    expect(Object.keys(patch)).toEqual(['blocks[999]']);
    expect(JSON.stringify(patch).length).toBeLessThan(JSON.stringify(updated).length / 100);
  });

  it('preserves unchanged identities through insertions and removes stale array tails', () => {
    const state = new NativeViewState();
    const initial = state.update([paragraph('a'), paragraph('b'), paragraph('b')]);
    const inserted = state.update([paragraph('x'), paragraph('a'), paragraph('b'), paragraph('b')]);
    expect(inserted['blocks[1]']).toBe(initial['blocks[0]']);
    expect(inserted['blocks[2]']).toBe(initial['blocks[1]']);
    expect(inserted['blocks[3]']).toBe(initial['blocks[2]']);
    expect(state.update([])).toEqual({ blocks: [] });
  });

  it('does not freeze earlier blocks when later Markdown changes their interpretation', () => {
    const state = new NativeViewState();
    const renderer = new CherryStream();
    const first = renderer.setMarkdown('[go][target]\n\nTail');
    state.update(first);
    const final = renderer.setMarkdown('[go][target]\n\nTail\n\n[target]: https://example.com');
    expect(final[0]).not.toEqual(first[0]);
    expect(state.update(final)).toHaveProperty('blocks[0]');
  });

  it('keeps nested list blocks, quotes, code, and tables in the native view', () => {
    const view = new CherryStream().setMarkdown(
      '- outer\n  - inner\n\n> quote\n\n```js\nconst x = 1\n```\n\n| A |\n| --- |\n| B |',
    );
    expect(view).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'list',
          children: expect.arrayContaining([
            expect.objectContaining({ children: expect.arrayContaining([expect.objectContaining({ type: 'list' })]) }),
          ]),
        }),
        expect.objectContaining({ type: 'blockquote' }),
        expect.objectContaining({ type: 'code_block' }),
        expect.objectContaining({ type: 'table' }),
      ]),
    );
    expect(JSON.stringify(view)).not.toContain('"type":"html"');
    expect(typeof globalThis.window).toBe('undefined');
  });
});

describe('native streaming controller', () => {
  it('coalesces high-frequency chunks before parsing and immediately flushes completion', () => {
    vi.useFakeTimers();
    const commits: NativeViewPatch[] = [];
    const controller = new NativeMarkdownController((patch, done) => {
      commits.push(patch);
      done();
    });
    controller.setMarkdown('a', true);
    controller.setMarkdown('ab', true);
    controller.setMarkdown('abc', true);
    expect(commits).toHaveLength(0);
    vi.advanceTimersByTime(80);
    expect(commits).toHaveLength(1);
    expect(JSON.stringify(commits)).toContain('abc');
    controller.setMarkdown('![A](/a.png)', true);
    controller.setMarkdown('![A](/a.png)', false);
    expect(commits).toHaveLength(2);
    expect(JSON.stringify(commits[1])).toContain('"type":"image"');
    vi.runAllTimers();
    expect(commits).toHaveLength(2);
    controller.dispose();
  });

  it('waits for commit acknowledgement, then delivers the latest final state', () => {
    vi.useFakeTimers();
    const commits: NativeViewPatch[] = [];
    const acknowledgements: Array<() => void> = [];
    const controller = new NativeMarkdownController((patch, done) => {
      commits.push(patch);
      acknowledgements.push(done);
    });
    controller.setMarkdown('a');
    controller.setMarkdown('ab', true);
    controller.setMarkdown('abc');
    vi.runAllTimers();
    expect(commits).toHaveLength(1);
    acknowledgements[0]();
    expect(commits).toHaveLength(2);
    expect(JSON.stringify(commits[1])).toContain('abc');
    controller.dispose();
    acknowledgements[1]();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels scheduled work and ignores late acknowledgements after detachment', () => {
    vi.useFakeTimers();
    const commit = vi.fn();
    const controller = new NativeMarkdownController(commit);
    controller.setMarkdown('a', true);
    controller.dispose();
    controller.setMarkdown('b');
    vi.runAllTimers();
    expect(commit).not.toHaveBeenCalled();
  });
});
