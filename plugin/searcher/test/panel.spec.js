import { describe, expect, it, vi } from 'vitest';
import SearcherPanel from '../src/SearcherPanel.js';

/** @returns {import('../types/searcher.types.js').EditorAdapter} */
function createMockAdapter(text = 'hello world hello') {
  let doc = text;
  let selection = { from: 0, to: 0 };
  let cursor = 0;

  return {
    getDocString: () => doc,
    getSelection: () => selection,
    getSelectedText: () => (selection.from === selection.to ? '' : doc.slice(selection.from, selection.to)),
    getCursorHead: () => cursor,
    setSelection: (from, to) => {
      selection = { from, to };
      cursor = to;
    },
    replaceRange: (replacement, from, to) => {
      doc = doc.slice(0, from) + replacement + doc.slice(to);
    },
    setSearchQuery: vi.fn(),
    clearSearchQuery: vi.fn(),
    focus: vi.fn(),
    isReadOnly: () => false,
  };
}

describe('SearcherPanel', () => {
  it('挂载到 mountTarget 并默认隐藏', () => {
    const mountTarget = document.createElement('div');
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter(),
      mountTarget,
    });

    expect(mountTarget.contains(panel.dom)).toBe(true);
    expect(panel.isVisible()).toBe(false);
  });

  it('show 后可见并写入搜索词', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo bar foo'),
      mountTarget: document.body,
      options: { enableReplace: true },
    });

    panel.show({ left: 10, top: 20, width: 100, height: 30 }, 'foo');
    expect(panel.isVisible()).toBe(true);
    expect(panel.dom.querySelector('.cherry-searcher__input')?.value).toBe('foo');
  });

  it('hide 后不可见并清除高亮', () => {
    const adapter = createMockAdapter();
    const panel = new SearcherPanel({
      editorAdapter: adapter,
      mountTarget: document.body,
    });

    panel.show({ left: 0, top: 0, width: 0, height: 0 }, 'a');
    panel.hide();
    expect(panel.isVisible()).toBe(false);
    expect(adapter.clearSearchQuery).toHaveBeenCalled();
  });

  it('applyHighlight 以 asRegex=true 调用 setSearchQuery', async () => {
    vi.useFakeTimers();
    const adapter = createMockAdapter('hello world');
    const panel = new SearcherPanel({
      editorAdapter: adapter,
      mountTarget: document.body,
    });

    panel.input.value = 'hello';
    panel.input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(150);

    expect(adapter.setSearchQuery).toHaveBeenCalledWith(expect.any(String), false, true);
    panel.destroy();
    vi.useRealTimers();
  });

  it('onSearch 在搜索完成后触发', () => {
    const onSearch = vi.fn();
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('hello world hello'),
      mountTarget: document.body,
      options: { onSearch },
    });

    panel.show({ left: 0, top: 0, width: 0, height: 0 }, 'hello');

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'hello',
        caseSensitive: false,
        wholeWord: false,
        activeMatchIndex: expect.any(Number),
        matches: expect.arrayContaining([
          { from: 0, to: 5 },
          { from: 12, to: 17 },
        ]),
      }),
    );
    panel.destroy();
  });

  it('onReplace 在单个 / 全部替换成功后触发', () => {
    const onReplace = vi.fn();
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo bar foo'),
      mountTarget: document.body,
      options: { enableReplace: true, onReplace },
    });

    panel.show({ left: 0, top: 0, width: 0, height: 0 }, 'foo');
    panel.replaceInput.value = 'baz';
    panel.replaceCurrent();

    expect(onReplace).toHaveBeenCalledWith({
      mode: 'single',
      query: 'foo',
      from: 'foo',
      to: 'baz',
      count: 1,
      range: { from: 0, to: 3 },
    });

    panel.replaceAll();
    expect(onReplace).toHaveBeenLastCalledWith({
      mode: 'all',
      query: 'foo',
      from: 'foo',
      to: 'baz',
      count: 1,
    });
    panel.destroy();
  });
});
