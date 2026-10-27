import { CherrySemanticParser } from 'cherry-markdown/semantic';
import { nativeThemeStyle, nativeInlineStyle } from '../src/native/theme';
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

  it('gives duplicate nested rows and cells unique keys that survive tail growth', () => {
    const state = new NativeViewState();
    const source = '| A | B |\n| --- | --- |\n| same | same |\n| same | same |';
    const stream = new CherryStream();
    const initial = state.update(stream.setMarkdown(source));
    const table = initial['blocks[0]'] as MiniProgramViewBlock & {
      id: string;
      rows: Array<{ id: string; cells: Array<{ id: string }> }>;
    };
    expect(new Set(table.rows.map((row) => row.id)).size).toBe(2);
    expect(new Set(table.rows.flatMap((row) => row.cells.map((cell) => cell.id))).size).toBe(4);
    const updated = state.update(stream.setMarkdown(source + ' tail'))['blocks[0]'] as typeof table;
    expect(updated.id).toBe(table.id);
    expect(updated.rows[0].id).toBe(table.rows[0].id);
    expect(updated.rows[0].cells[0].id).toBe(table.rows[0].cells[0].id);
    expect(stream.makeView(source)[0]).not.toHaveProperty('id');
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

describe('public semantic bridge and native presentation', () => {
  it('consumes the public Cherry document and can use an injected compatible core', () => {
    const bridge = new CherrySemanticParser();
    const parse = vi.spyOn(bridge, 'parse');
    const stream = new CherryStream({ bridge });
    const markdown = '# Shared\n\n**native**';
    expect(stream.makeBlocks(markdown)).toEqual(new CherrySemanticParser().parse(markdown).blocks);
    expect(parse).toHaveBeenCalledWith(markdown, expect.any(Object));
    expect(() => new CherryStream({ bridge: { ...bridge, schemaVersion: 2 } as unknown as typeof bridge })).toThrow(
      'Unsupported Cherry semantic schema',
    );
  });
  it('maps Cherry color and size semantics onto safe native text styles', () => {
    const stream = new CherryStream();
    const view = stream.makeView('!!#c0392b 红色!! 和 !24 大号!');
    expect(view[0]).toMatchObject({
      type: 'paragraph',
      inlines: expect.arrayContaining([
        expect.objectContaining({ text: '红色', style: 'color:#c0392b' }),
        expect.objectContaining({ text: '大号', style: 'font-size:24px' }),
      ]),
    });
    const panel = stream.makeView(':::tip Title\nbody\n:::')[0];
    expect(panel).toMatchObject({ type: 'panel', title: 'Title' });
    expect(JSON.stringify(panel)).not.toContain('"text":"Title"');
    expect(nativeInlineStyle('color:#123456;background-color:rgb(1, 2, 3);font-size:24px')).toBe(
      'color:#123456;background-color:rgb(1, 2, 3);font-size:24px',
    );
    expect(nativeInlineStyle('background-image:url(x);position:fixed;color:expression(x);font-size:99999px')).toBe('');
    expect(nativeThemeStyle('dark')).not.toBe(nativeThemeStyle('default'));
    expect(nativeThemeStyle('__proto__')).toBe(nativeThemeStyle('default'));
  });
});
