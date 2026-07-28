import { describe, expect, it, vi } from 'vite-plus/test';
import SearcherPanel from '@/toolbars/searcher/SearcherPanel';

/** @returns {object} */
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
    });

    panel.show('foo');
    expect(panel.isVisible()).toBe(true);
    expect(panel.dom.querySelector('.cherry-searcher__input')?.value).toBe('foo');
  });

  it('hide 后不可见并清除高亮', () => {
    const adapter = createMockAdapter();
    const panel = new SearcherPanel({
      editorAdapter: adapter,
      mountTarget: document.body,
    });

    panel.show('a');
    panel.hide();
    expect(panel.isVisible()).toBe(false);
    expect(adapter.clearSearchQuery).toHaveBeenCalled();
  });

  it('点击面板外不关闭', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter(),
      mountTarget: document.body,
    });

    panel.show('a');
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(panel.isVisible()).toBe(true);
    panel.destroy();
  });

  it('Esc 在无搜索词时关闭面板', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter(),
      mountTarget: document.body,
    });

    panel.show('');
    panel.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel.isVisible()).toBe(false);
    panel.destroy();
  });

  it('替换框 Esc 先清空再关闭', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo'),
      mountTarget: document.body,
    });

    panel.show('foo', { expandReplace: true });
    panel.replaceInput.value = 'bar';
    panel.replaceInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel.replaceInput?.value).toBe('');
    expect(panel.isVisible()).toBe(true);

    panel.replaceInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    panel.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel.isVisible()).toBe(false);
    panel.destroy();
  });

  it('正则模式可匹配数字', async () => {
    vi.useFakeTimers();
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('a1 b22'),
      mountTarget: document.body,
    });

    panel.show('');
    panel.state.useRegex = true;
    panel.regexToggle.classList.add('is-active');
    panel.setQuery('\\d+', false);
    await vi.advanceTimersByTimeAsync(0);

    expect(panel.state.matches).toHaveLength(2);
    panel.destroy();
    vi.useRealTimers();
  });

  it('再次打开搜索框不全选已有内容', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo bar foo'),
      mountTarget: document.body,
    });

    panel.show('foo');
    panel.hide();
    panel.show('');
    expect(panel.input.selectionStart).toBe(panel.input.value.length);
    expect(panel.input.selectionEnd).toBe(panel.input.value.length);
    panel.destroy();
  });

  it('Mod+F 在面板内关闭并阻止默认行为', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter(),
      mountTarget: document.body,
    });

    panel.show('a');
    const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true });
    panel.dom.dispatchEvent(event);
    expect(panel.isVisible()).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    panel.destroy();
  });

  it('点击面板内不关闭', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo'),
      mountTarget: document.body,
    });

    panel.show('foo');
    panel.counter.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(panel.isVisible()).toBe(true);
    panel.destroy();
  });

  it('关闭后再次打开保持当前匹配序号', () => {
    const adapter = createMockAdapter('foo bar foo');
    const panel = new SearcherPanel({
      editorAdapter: adapter,
      mountTarget: document.body,
    });

    panel.show('foo');
    expect(panel.state.activeMatchIndex).toBe(0);
    expect(panel.counter.textContent).toBe('1/2');

    panel.hide();
    panel.show();
    expect(panel.state.activeMatchIndex).toBe(0);
    expect(panel.counter.textContent).toBe('1/2');
    panel.destroy();
  });

  it('有匹配时计数器使用 is-active 样式类', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo bar foo'),
      mountTarget: document.body,
    });

    panel.show('foo');
    expect(panel.counter.classList.contains('is-active')).toBe(true);
    expect(panel.counter.textContent).toBe('1/2');
    panel.destroy();
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

  it('替换输入框有内容时显示清空按钮', () => {
    const panel = new SearcherPanel({
      editorAdapter: createMockAdapter('foo'),
      mountTarget: document.body,
    });

    panel.show('foo', { expandReplace: true });
    panel.replaceInput.value = 'baz';
    panel.replaceInput.dispatchEvent(new Event('input'));

    expect(panel.dom.querySelector('.cherry-searcher__replace-clear')?.classList.contains('is-visible')).toBe(true);

    panel.replaceClearButton?.click();
    expect(panel.replaceInput?.value).toBe('');
    expect(panel.dom.querySelector('.cherry-searcher__replace-clear')?.classList.contains('is-visible')).toBe(false);
    panel.destroy();
  });

  it('单个 / 全部替换会更新文档', () => {
    const adapter = createMockAdapter('foo bar foo');
    const panel = new SearcherPanel({
      editorAdapter: adapter,
      mountTarget: document.body,
    });

    panel.show('foo');
    panel.replaceInput.value = 'baz';
    panel.replaceCurrent();

    expect(adapter.getDocString()).toBe('baz bar foo');

    panel.replaceAll();
    expect(adapter.getDocString()).toBe('baz bar baz');
    expect(panel.isVisible()).toBe(true);
    panel.destroy();
  });
});
