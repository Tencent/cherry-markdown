import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  destroySearcherBridge,
  getSearcherBridge,
  initSearcherBridge,
} from '@/toolbars/searcher/SearcherBridge';
import Search from '@/toolbars/hooks/Search';

/** Searcher 桥接测试用 Cherry 宿主形态 */
type SearcherCherryHost = {
  locale?: Record<string, string | undefined>;
  options?: {
    locale?: string;
    toolbars?: {
      toolbar?: Array<string | Record<string, unknown>>;
    };
  };
  editor?: {
    editor: Record<string, unknown>;
    options?: { editorDom?: HTMLElement; wrapperDom?: HTMLElement };
  };
  wrapperDom?: HTMLElement;
  $event?: {
    Events: { afterChangeLocale: string; afterChange: string };
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  };
  $currentMenuOptions?: { name?: string; icon?: string };
};

function createMockCherry(overrides: Partial<SearcherCherryHost> = {}): SearcherCherryHost {
  const editorDom = document.createElement('div');
  editorDom.classList.add('cherry-editor');
  const wrapperDom = document.createElement('div');
  wrapperDom.appendChild(editorDom);

  const editor = {
    view: {
      state: {
        doc: { toString: () => 'abc', sliceString: (from: number, to: number) => 'abc'.slice(from, to) },
        selection: { main: { from: 0, to: 0, head: 0 } },
      },
      focus: vi.fn(),
    },
    getOption: (key: string) => (key === 'readOnly' ? false : undefined),
  };

  return {
    locale: { searchFor: 'Search for' },
    options: {
      locale: 'en_US',
      toolbars: {
        toolbar: ['search'],
      },
    },
    editor: {
      editor,
      options: { editorDom, wrapperDom },
    },
    wrapperDom,
    $event: { Events: { afterChangeLocale: 'afterChangeLocale', afterChange: 'afterChange' }, on: vi.fn(), off: vi.fn() },
    ...overrides,
  };
}

describe('SearcherBridge', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('initSearcherBridge 在 toolbar 含 search 时创建桥接层', () => {
    const cherry = createMockCherry();
    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    expect(bridge).toBeDefined();
    expect(bridge?.panel.dom.parentNode).toBe(cherry.editor?.options?.editorDom);
  });

  it('toolbar 未配置 search 时不初始化桥接层', () => {
    const cherry = createMockCherry({
      options: { locale: 'en_US', toolbars: { toolbar: ['bold'] } },
    });
    initSearcherBridge(cherry);
    expect(getSearcherBridge(cherry)).toBeUndefined();
  });

  it('工具栏按钮可打开搜索面板', () => {
    const cherry = createMockCherry();
    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    if (!bridge) {
      throw new Error('searcher bridge is not initialized');
    }

    cherry.$currentMenuOptions = { name: 'search', icon: 'search' };
    const searchMenu = new Search(cherry);
    searchMenu.dom = document.createElement('button');
    searchMenu.onClick('');

    expect(bridge.panel.isVisible()).toBe(true);
  });

  it('Cherry locale 映射到面板文案', () => {
    const cherry = createMockCherry({
      locale: { searchFor: '查找' },
      options: {
        locale: 'zh_CN',
        toolbars: { toolbar: ['search'] },
      },
    });

    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    expect(bridge?.panel.locale.searchFor).toBe('查找');
    expect(bridge?.panel.input.placeholder).toBe('查找');
  });

  it('EditorAdapter.setSearchQuery 透传 asRegex 参数', () => {
    const setSearchQuery = vi.fn();
    const cherry = createMockCherry({
      editor: {
        editor: {
          view: {
            state: {
              doc: { toString: () => 'abc', sliceString: () => '' },
              selection: { main: { from: 0, to: 0, head: 0 } },
            },
            focus: vi.fn(),
          },
          setSearchQuery,
          clearSearchQuery: vi.fn(),
          getOption: () => false,
        },
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
    });

    initSearcherBridge(cherry);
    getSearcherBridge(cherry)?.panel.editorAdapter.setSearchQuery('hello', true, true);
    expect(setSearchQuery).toHaveBeenCalledWith('hello', true, true);
  });

  it('destroySearcherBridge 销毁 Bridge 并解绑 Cherry 事件', () => {
    const editorDom = document.createElement('div');
    const off = vi.fn();
    const cherry = createMockCherry({
      editor: {
        editor: {
          view: {
            state: {
              doc: { toString: () => 'abc', sliceString: () => '' },
              selection: { main: { from: 0, to: 0, head: 0 } },
            },
            focus: vi.fn(),
          },
          setSearchQuery: vi.fn(),
          clearSearchQuery: vi.fn(),
          getOption: () => false,
        },
        options: { editorDom, wrapperDom: document.body },
      },
      $event: {
        Events: { afterChangeLocale: 'afterChangeLocale', afterChange: 'afterChange' },
        on: vi.fn(),
        off,
      },
    });

    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    const destroySpy = vi.spyOn(bridge!.panel, 'destroy');

    destroySearcherBridge(cherry);

    expect(destroySpy).toHaveBeenCalled();
    expect(off).toHaveBeenCalledWith('afterChangeLocale', expect.any(Function));
    expect(off).toHaveBeenCalledWith('afterChange', expect.any(Function));
    expect(off).toHaveBeenCalledWith('toolbarHide', expect.any(Function));
    expect(getSearcherBridge(cherry)).toBeUndefined();
  });

  it('afterChange 在面板可见时刷新搜索匹配', async () => {
    vi.useFakeTimers();

    let doc = 'foo bar foo';
    const handlers: Record<string, (msg?: unknown) => void> = {};
    const cherry = createMockCherry({
      editor: {
        editor: {
          view: {
            state: {
              doc: {
                toString: () => doc,
                sliceString: (from: number, to: number) => doc.slice(from, to),
              },
              selection: { main: { from: 0, to: 0, head: 0 } },
            },
            focus: vi.fn(),
          },
          setSelection: vi.fn(),
          setSearchQuery: vi.fn(),
          clearSearchQuery: vi.fn(),
          getOption: () => false,
        },
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
      $event: {
        Events: { afterChangeLocale: 'afterChangeLocale', afterChange: 'afterChange' },
        on: (event: string, handler: (msg?: unknown) => void) => {
          handlers[event] = handler;
        },
        off: vi.fn(),
      },
    });

    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    bridge?.panel.show('foo');
    expect(bridge?.panel.state.matches).toHaveLength(2);

    doc = 'foo';
    handlers.afterChange?.({});
    await vi.advanceTimersByTimeAsync(150);
    expect(bridge?.panel.state.matches).toHaveLength(1);
    vi.useRealTimers();
  });
});
