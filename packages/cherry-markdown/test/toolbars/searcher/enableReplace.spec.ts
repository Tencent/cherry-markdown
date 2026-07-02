import { describe, expect, it, vi } from 'vitest';
import mergeWith from '@/utils/toolkit/mergeWith';
import cloneDeep from '@/utils/toolkit/cloneDeep';
import defaultConfig from '@/Cherry.config';
// cspell:ignore customizer
import { customizer as configMergeFn } from '@/utils/config';
import { initSearcherBridge, getSearcherBridge, type SearcherCherryHost } from '@/toolbars/searcher/SearcherBridge';
import Search from '@/toolbars/hooks/Search';

function createMockCherry(overrides: Partial<SearcherCherryHost> = {}): SearcherCherryHost {
  const editorDom = document.createElement('div');
  editorDom.classList.add('cherry-editor');

  const editor = {
    view: {
      state: {
        doc: { toString: () => '', sliceString: () => '' },
        selection: { main: { from: 0, to: 0, head: 0 } },
      },
      focus: vi.fn(),
    },
    getOption: () => false,
    setSearchQuery: vi.fn(),
    clearSearchQuery: vi.fn(),
  };

  return {
    locale: {},
    options: {
      toolbars: {
        toolbar: ['search'],
        config: { searcher: { enableReplace: false } },
      },
    },
    editor: {
      editor,
      options: { editorDom },
    },
    wrapperDom: document.body,
    $event: {
      Events: { afterChangeLocale: 'afterChangeLocale', afterChange: 'afterChange' },
      on: vi.fn(),
      off: vi.fn(),
    },
    ...overrides,
  } as SearcherCherryHost;
}

describe('enableReplace 配置', () => {
  it('Cherry.config 默认 enableReplace 为 true', () => {
    expect(defaultConfig.toolbars.config.searcher.enableReplace).toBe(true);
  });

  it('merge 后可通过 toolbars.config.searcher 关闭替换', () => {
    const merged = mergeWith(
      {},
      cloneDeep(defaultConfig),
      {
        toolbars: {
          toolbar: ['search'],
          config: { searcher: { enableReplace: false } },
        },
      },
      configMergeFn,
    );
    expect(merged.toolbars.config.searcher.enableReplace).toBe(false);
  });

  it('enableReplace 为 false 时不渲染替换区 DOM', () => {
    const cherry = createMockCherry();
    initSearcherBridge(cherry);
    const { panel } = getSearcherBridge(cherry)!;
    expect(panel.enableReplace).toBe(false);
    expect(panel.dom.querySelector('.cherry-searcher__replace-row')).toBeNull();
    expect(panel.dom.querySelector('.cherry-searcher__expand-btn')).toBeNull();
  });

  it('enableReplace 为 false 时不注册 Mod+H 快捷键', () => {
    const cherry = createMockCherry();
    const searchMenu = new Search(cherry);
    expect(Object.keys(searchMenu.shortcutKeyMap)).toHaveLength(1);
    expect(Object.values(searchMenu.shortcutKeyMap)[0]).toMatchObject({ aliasName: 'search' });
  });

  it('index-demo 式 config 覆盖后仍保留默认 enableReplace', () => {
    const merged = mergeWith(
      {},
      cloneDeep(defaultConfig),
      {
        toolbars: {
          toolbar: ['search'],
          config: {
            mapTable: {
              sourceUrl: ['https://example.com/map.json'],
            },
          },
        },
      },
      configMergeFn,
    );
    expect(merged.toolbars.config.searcher.enableReplace).toBe(true);
  });
});
