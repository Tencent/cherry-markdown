import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import SearcherCherryPlugin from '@/addons/cherry-searcher-plugin';
import { CherryStatic } from '@/CherryStatic';
import { mac } from '@/utils/shortcutKey';

describe('SearcherCherryPlugin', () => {
  beforeEach(() => {
    SearcherCherryPlugin.mergedOptions = {};
    CherryStatic._pluginInits.length = 0;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('install 仅合并 options，不注册 toolbar', () => {
    const defaults = { toolbars: { toolbar: ['bold'], customMenu: {} } };
    SearcherCherryPlugin.install(defaults, { localeId: 'zh_CN' });
    expect(defaults.toolbars.toolbar).toEqual(['bold']);
    expect(defaults.toolbars.customMenu).toEqual({});
    expect(SearcherCherryPlugin.mergedOptions.localeId).toBe('zh_CN');
  });

  it('onCherryInit 绑定 Bridge 与 Mod+F 快捷键', () => {
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
      setSelection: vi.fn(),
      replaceRange: vi.fn(),
      setSearchQuery: vi.fn(),
      clearSearchQuery: vi.fn(),
      getOption: (key) => (key === 'readOnly' ? false : undefined),
    };

    const handlers = {};
    const cherry = {
      locale: { searchFor: 'Search for' },
      options: { locale: 'en_US' },
      editor: {
        editor,
        options: { editorDom, wrapperDom },
      },
      wrapperDom,
      $event: {
        Events: { afterChangeLocale: 'afterChangeLocale', afterChange: 'afterChange' },
        on: (event, handler) => {
          handlers[event] = handler;
        },
        off: vi.fn(),
      },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    expect(cherry.searcherBridge).toBeDefined();
    expect(cherry.searcherBridge.panel.dom.parentNode).toBe(wrapperDom);

    const event = new KeyboardEvent('keydown', {
      key: 'f',
      code: 'KeyF',
      metaKey: mac,
      ctrlKey: !mac,
      bubbles: true,
    });
    editorDom.dispatchEvent(event);

    expect(cherry.searcherBridge.panel.isVisible()).toBe(true);
  });

  it('Cherry locale 映射到 panel.options.locale', () => {
    SearcherCherryPlugin.install({}, {});

    const cherry = {
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
    expect(cherry.searcherBridge.panel.options.localeId).toBe('zh_CN');
    expect(cherry.searcherBridge.panel.options.locale?.searchFor).toBe('查找');
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

    const cherry = {
      locale: {},
      options: { locale: 'en_US' },
      editor: {
        editor,
        options: { editorDom: document.createElement('div'), wrapperDom: document.body },
      },
      $event: { Events: { afterChangeLocale: 'afterChangeLocale' }, on: vi.fn() },
    };

    SearcherCherryPlugin.onCherryInit(cherry);
    cherry.searcherBridge.panel.editorAdapter.setSearchQuery('hello', true, true);

    expect(editor.setSearchQuery).toHaveBeenCalledWith('hello', true, true);
  });

  it('onCherryDestroy 销毁 Bridge 并解绑 Cherry 事件', () => {
    SearcherCherryPlugin.install({}, {});

    const editorDom = document.createElement('div');
    const off = vi.fn();
    const cherry = {
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
    const destroySpy = vi.spyOn(cherry.searcherBridge.panel, 'destroy');

    SearcherCherryPlugin.onCherryDestroy(cherry);

    expect(destroySpy).toHaveBeenCalled();
    expect(off).toHaveBeenCalledWith('afterChangeLocale', expect.any(Function));
    expect(off).toHaveBeenCalledWith('afterChange', expect.any(Function));
    expect(off).toHaveBeenCalledWith('toolbarHide', expect.any(Function));
    expect(cherry.searcherBridge).toBeUndefined();
  });

  it('afterChange 在面板可见时刷新搜索匹配', () => {
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
    const cherry = {
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
    cherry.searcherBridge.panel.show({ left: 0, top: 0, width: 0, height: 0 }, 'foo');
    expect(cherry.searcherBridge.panel.state.matches).toHaveLength(2);

    doc = 'foo';
    handlers.afterChange?.({});
    expect(cherry.searcherBridge.panel.state.matches).toHaveLength(1);
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

    CherryStatic._pluginInits.push({ PluginClass: FakePlugin, args: [] });
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
    expect(CherryStatic._pluginInits).toHaveLength(1);
    expect(CherryStatic._pluginInits[0].args).toEqual([{ foo: 1 }]);
  });
});
