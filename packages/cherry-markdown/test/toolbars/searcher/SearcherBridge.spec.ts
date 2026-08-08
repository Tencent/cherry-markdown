import { describe, expect, it, vi, afterEach } from 'vite-plus/test';
import {
  destroySearcherBridge,
  getSearcherBridge,
  initSearcherBridge,
  resolveSearcherConfig,
  type SearcherCherryHost,
} from '@/toolbars/searcher/SearcherBridge';
import Search from '@/toolbars/hooks/Search';
import Event from '@/Event';

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
    setSearchQuery: vi.fn(),
    clearSearchQuery: vi.fn(),
  };

  const mockCherry: SearcherCherryHost = {
    locale: { searchFor: 'Search for' },
    options: {
      toolbars: {
        toolbar: ['search'],
      },
    },
    editor: {
      editor,
      options: { editorDom, wrapperDom },
    },
    wrapperDom,
    $event: new Event('test'),
    ...overrides,
  };
  return mockCherry;
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
      options: { toolbars: { toolbar: ['bold'] } },
    });
    initSearcherBridge(cherry);
    expect(getSearcherBridge(cherry)).toBeUndefined();
  });

  it('仅 sidebar 配置 search 时也会初始化桥接层', () => {
    const cherry = createMockCherry({
      options: { toolbars: { sidebar: ['search'] } },
    });
    initSearcherBridge(cherry);
    expect(getSearcherBridge(cherry)).toBeDefined();
  });

  it('只读模式下仍可打开搜索面板', () => {
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
          getOption: (key: string) => (key === 'readOnly' ? true : undefined),
        },
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
    });

    initSearcherBridge(cherry);
    getSearcherBridge(cherry)?.handleTrigger('', 'search');
    expect(getSearcherBridge(cherry)?.panel.isVisible()).toBe(true);
    expect(getSearcherBridge(cherry)?.panel.canPerformReplace()).toBe(false);
  });

  it('resolveSearcherConfig 解析 enableReplace 与 expandReplaceOnOpen', () => {
    expect(resolveSearcherConfig(undefined)).toEqual({ enableReplace: true, expandReplaceOnOpen: false });
    expect(resolveSearcherConfig({ enableReplace: false, expandReplaceOnOpen: true })).toEqual({
      enableReplace: false,
      expandReplaceOnOpen: true,
    });
  });

  it('面板隐藏时文档变更仍同步匹配列表', async () => {
    vi.useFakeTimers();

    let doc = 'foo bar foo';
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
    });

    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    bridge?.panel.show('foo');
    bridge?.panel.hide();

    doc = 'foo';
    cherry.$event?.emit('afterChange', {});
    expect(bridge?.panel.state.matches).toHaveLength(1);
    vi.useRealTimers();
  });

  it('工具栏按钮可打开搜索面板', () => {
    const cherry = createMockCherry();
    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    if (!bridge) {
      throw new Error('searcher bridge is not initialized');
    }

    Object.assign(cherry, { $currentMenuOptions: { name: 'search', icon: 'search' } });
    const searchMenu = new Search(cherry);
    searchMenu.dom = document.createElement('button');
    searchMenu.onClick('');

    expect(bridge.panel.isVisible()).toBe(true);
  });

  it('工具栏按钮再次点击可关闭搜索面板', () => {
    const cherry = createMockCherry();
    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    if (!bridge) {
      throw new Error('searcher bridge is not initialized');
    }

    Object.assign(cherry, { $currentMenuOptions: { name: 'search', icon: 'search' } });
    const searchMenu = new Search(cherry);
    searchMenu.dom = document.createElement('button');
    searchMenu.onClick('');
    expect(bridge.panel.isVisible()).toBe(true);

    expect(searchMenu.toggleToolbarPanel()).toBe(true);
    expect(bridge.panel.isVisible()).toBe(false);
  });

  it('快捷键 aliasName 为 search 时再次触发可关闭面板', () => {
    const cherry = createMockCherry();
    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    if (!bridge) {
      throw new Error('searcher bridge is not initialized');
    }

    bridge.handleTrigger('', 'search');
    expect(bridge.panel.isVisible()).toBe(true);
    bridge.handleTrigger('', 'search');
    expect(bridge.panel.isVisible()).toBe(false);
  });

  it('Cherry locale 映射到面板文案', () => {
    const cherry = createMockCherry({
      locale: { searchFor: '查找' },
      options: {
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
    const $event = new Event('test');
    const offSpy = vi.spyOn($event, 'off');
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
      $event,
    });

    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    const destroySpy = vi.spyOn(bridge!.panel, 'destroy');

    destroySearcherBridge(cherry);

    expect(destroySpy).toHaveBeenCalled();
    expect(offSpy).toHaveBeenCalledWith('afterChangeLocale', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('afterChange', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('toolbarHide', expect.any(Function));
    expect(getSearcherBridge(cherry)).toBeUndefined();
  });

  it('afterChange 在面板可见时刷新搜索匹配', async () => {
    vi.useFakeTimers();

    let doc = 'foo bar foo';
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
    });

    initSearcherBridge(cherry);
    const bridge = getSearcherBridge(cherry);
    bridge?.panel.show('foo');
    expect(bridge?.panel.state.matches).toHaveLength(2);

    doc = 'foo';
    cherry.$event?.emit('afterChange', {});
    await vi.advanceTimersByTimeAsync(150);
    expect(bridge?.panel.state.matches).toHaveLength(1);
    vi.useRealTimers();
  });
});
