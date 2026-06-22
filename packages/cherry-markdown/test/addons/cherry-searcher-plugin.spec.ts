import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import SearcherCherryPlugin from '@/addons/cherry-searcher-plugin';
import Searcher from '@/toolbars/hooks/Searcher';
import { CherryStatic } from '@/CherryStatic';
import type { CherryToolbarsOptions } from '../../types/cherry';

/** 与 cherry-searcher-plugin.js JSDoc 中的 SearcherCherryHost 保持一致 */
type SearcherCherryHost = Parameters<typeof SearcherCherryPlugin.onCherryInit>[0];

/** 获取 onCherryInit 后挂载的 searcherBridge（测试断言用） */
function getSearcherBridge(cherry: SearcherCherryHost) {
  if (!cherry.searcherBridge) {
    throw new Error('searcherBridge is not initialized');
  }
  return cherry.searcherBridge;
}

describe('SearcherCherryPlugin', () => {
  beforeEach(() => {
    SearcherCherryPlugin.mergedOptions = {};
    CherryStatic.pluginInits.length = 0;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('install 仅合并 options 并写入 toolbars.config.searcher', () => {
    const defaults: { toolbars: CherryToolbarsOptions } = {
      toolbars: { toolbar: ['bold'], customMenu: {} },
    };
    SearcherCherryPlugin.install(defaults, { localeId: 'zh_CN' });
    expect(defaults.toolbars.toolbar).toEqual(['bold']);
    expect(defaults.toolbars.customMenu).toEqual({});
    expect(defaults.toolbars.config?.searcher?.localeId).toBe('zh_CN');
    expect(SearcherCherryPlugin.mergedOptions.localeId).toBe('zh_CN');
  });

  it('工具栏按钮可打开搜索面板', () => {
    SearcherCherryPlugin.install({}, { enableReplace: true });

    const editorDom = document.createElement('div');
    const wrapperDom = document.createElement('div');
    wrapperDom.appendChild(editorDom);

    const editor = {
      view: {
        state: {
          doc: { toString: () => 'abc', sliceString: (from, to) => 'abc'.slice(from, to) },
          selection: { main: { from: 0, to: 0, head: 0 } },
        },
        focus: vi.fn(),
      },
      getOption: (key) => (key === 'readOnly' ? false : undefined),
    };

    const cherry: SearcherCherryHost = {
      locale: { searchFor: 'Search for' },
      options: { locale: 'en_US', toolbars: { config: { searcher: { enableReplace: true } } } },
      editor: {
        editor,
        options: { editorDom, wrapperDom },
      },
      wrapperDom,
      $event: { Events: { afterChangeLocale: 'afterChangeLocale' }, on: vi.fn() },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    const bridge = getSearcherBridge(cherry);
    expect(bridge.panel.dom.parentNode).toBe(wrapperDom);

    const toolbarButton = document.createElement('button');
    const searcherMenu = new Searcher({
      ...cherry,
      editor: cherry.editor,
      options: cherry.options,
      locale: cherry.locale,
      $currentMenuOptions: { name: 'searcher', icon: 'search' },
    });
    searcherMenu.dom = toolbarButton;
    searcherMenu.onClick('');

    expect(bridge.panel.isVisible()).toBe(true);
  });

  it('实例 toolbars.config.searcher 覆盖 usePlugin 配置', () => {
    SearcherCherryPlugin.install({}, { enableReplace: true, localeId: 'en_US' });

    const cherry: SearcherCherryHost = {
      locale: {},
      options: {
        locale: 'zh_CN',
        toolbars: { config: { searcher: { enableReplace: false, localeId: 'zh_CN' } } },
      },
      editor: {
        editor: {
          view: {
            state: {
              doc: { toString: () => '', sliceString: () => '' },
              selection: { main: { from: 0, to: 0, head: 0 } },
            },
            focus: vi.fn(),
          },
          getOption: () => false,
        },
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
      $event: { Events: { afterChangeLocale: 'afterChangeLocale' }, on: vi.fn() },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    const bridge = getSearcherBridge(cherry);
    expect(bridge.panel.options.enableReplace).toBe(false);
    expect(bridge.panel.options.localeId).toBe('zh_CN');
  });

  it('Cherry locale 映射到 panel.options.locale', () => {
    SearcherCherryPlugin.install({}, {});

    const cherry: SearcherCherryHost = {
      locale: {
        searchFor: '查找',
      },
      options: { locale: 'zh_CN' },
      editor: {
        editor: {
          view: {
            state: {
              doc: { toString: () => '', sliceString: () => '' },
              selection: { main: { from: 0, to: 0, head: 0 } },
            },
            focus: vi.fn(),
          },
          getOption: () => false,
        },
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
      $event: { Events: { afterChangeLocale: 'afterChangeLocale' }, on: vi.fn() },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    const bridge = getSearcherBridge(cherry);
    expect(bridge.panel.options.localeId).toBe('zh_CN');
    expect(bridge.panel.options.locale?.searchFor).toBe('查找');
  });

  it('EditorAdapter.setSearchQuery 透传 asRegex 参数', () => {
    SearcherCherryPlugin.install({}, {});

    const editor = {
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
    };

    const cherry: SearcherCherryHost = {
      locale: {},
      options: { locale: 'en_US' },
      editor: {
        editor,
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
      $event: { Events: { afterChangeLocale: 'afterChangeLocale' }, on: vi.fn() },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    getSearcherBridge(cherry).panel.editorAdapter.setSearchQuery('hello', true, true);

    expect(editor.setSearchQuery).toHaveBeenCalledWith('hello', true, true);
  });

  it('onCherryDestroy 销毁 Bridge 并解绑 Cherry 事件', () => {
    SearcherCherryPlugin.install({}, {});

    const editorDom = document.createElement('div');
    const off = vi.fn();
    const cherry: SearcherCherryHost = {
      locale: {},
      options: { locale: 'en_US' },
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
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    const bridge = getSearcherBridge(cherry);
    const destroySpy = vi.spyOn(bridge.panel, 'destroy');

    SearcherCherryPlugin.onCherryDestroy(cherry);

    expect(destroySpy).toHaveBeenCalled();
    expect(off).toHaveBeenCalledWith('afterChangeLocale', expect.any(Function));
    expect(off).toHaveBeenCalledWith('afterChange', expect.any(Function));
    expect(off).toHaveBeenCalledWith('toolbarHide', expect.any(Function));
    expect(cherry.searcherBridge).toBeUndefined();
  });

  it('afterChange 在面板可见时刷新搜索匹配', async () => {
    vi.useFakeTimers();
    SearcherCherryPlugin.install({}, {});

    let doc = 'foo bar foo';
    const editor = {
      view: {
        state: {
          doc: {
            toString: () => doc,
            sliceString: (from, to) => doc.slice(from, to),
          },
          selection: { main: { from: 0, to: 0, head: 0 } },
        },
        focus: vi.fn(),
      },
      setSelection: vi.fn(),
      setSearchQuery: vi.fn(),
      clearSearchQuery: vi.fn(),
      getOption: () => false,
    };

    const handlers: Record<string, (msg?: unknown) => void> = {};
    const cherry: SearcherCherryHost = {
      locale: {},
      options: { locale: 'en_US' },
      editor: {
        editor,
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
      $event: {
        Events: { afterChangeLocale: 'afterChangeLocale', afterChange: 'afterChange' },
        on: (event: string, handler: (msg?: unknown) => void) => {
          handlers[event] = handler;
        },
        off: vi.fn(),
      },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    const bridge = getSearcherBridge(cherry);
    bridge.panel.show({ left: 0, top: 0, width: 0, height: 0 }, 'foo');
    expect(bridge.panel.state.matches).toHaveLength(2);

    doc = 'foo';
    handlers.afterChange?.({});
    await vi.advanceTimersByTimeAsync(150);
    expect(bridge.panel.state.matches).toHaveLength(1);
    vi.useRealTimers();
  });

  it('invokePluginDestroys 调用已注册插件的 onCherryDestroy', () => {
    const destroy = vi.fn();

    class FakePlugin {
      static install() {}

      static onCherryInit() {}

      static onCherryDestroy(cherry: { id: string }) {
        destroy(cherry.id);
      }
    }

    CherryStatic.pluginInits.push({ PluginClass: FakePlugin, args: [] });
    CherryStatic.invokePluginDestroys({ id: 'demo' });
    expect(destroy).toHaveBeenCalledWith('demo');
  });

  it('usePlugin 注册 onCherryInit 回调', () => {
    class FakePlugin {
      static install() {}
      static onCherryInit() {}
    }

    const FakeCherry = class extends CherryStatic {
      static initialized = false;
      static config = { defaults: {} };
    };

    FakeCherry.usePlugin(FakePlugin, { foo: 1 });
    expect(CherryStatic.pluginInits).toHaveLength(1);
    expect(CherryStatic.pluginInits[0].args).toEqual([{ foo: 1 }]);
  });

  it('SearcherCherryPlugin 源码导出关键 API', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const sourcePath = resolve(process.cwd(), 'src/addons/cherry-searcher-plugin.js');

    const content = readFileSync(sourcePath, 'utf-8');
    expect(content).toContain('export default class SearcherCherryPlugin');
    expect(content).toContain('static install');
    expect(content).toContain('static onCherryInit');
    expect(content).toContain('static onCherryDestroy');
    expect(content).toContain('export class SearcherCherryBridge');
    expect(content).toContain('export function createCherryEditorAdapter');
    expect(content).toContain('export function resolvePluginUserOptions');
    expect(content).toContain('handleTrigger');
    expect(content).toContain('@typedef {Object} SearcherCherryHost');
  });
});
