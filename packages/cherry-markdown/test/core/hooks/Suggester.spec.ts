import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Suggester from '../../../src/core/hooks/Suggester';
import { suggesterKeywords } from '../../../src/core/hooks/SuggestList';

// Mock isBrowser
vi.mock('@/utils/env', () => ({
  isBrowser: () => true,
}));

// Mock isLookbehindSupported
vi.mock('@/utils/regexp', () => ({
  isLookbehindSupported: () => true,
}));

// Mock lookbehind-replace
vi.mock('@/utils/lookbehind-replace', () => ({
  replaceLookbehind: (str: string, reg: RegExp, callback: (match: string, ...args: unknown[]) => string) => {
    return str.replace(reg, callback);
  },
}));

// ============ 辅助函数 ============

/** 自动 mock 工厂函数 - 使用 Proxy 动态生成所有属性 */
const createAutoMock = (): any => {
  const handler: ProxyHandler<any> = {
    get: (target, prop) => {
      if (!(prop in target)) {
        const mockFn = vi.fn();
        // 为某些方法返回特定值
        if (prop === 'getCursor') mockFn.mockReturnValue(0);
        if (prop === 'getOption') mockFn.mockReturnValue({});
        if (prop === 'getLine') mockFn.mockReturnValue('');
        if (prop === 'getSelection') mockFn.mockReturnValue('');
        if (prop === 'getValue') mockFn.mockReturnValue('');
        if (prop === 'getRange') mockFn.mockReturnValue('');
        if (prop === 'lineCount') mockFn.mockReturnValue(0);
        if (prop === 'lastLine') mockFn.mockReturnValue(0);
        if (prop === 'hasFocus') mockFn.mockReturnValue(false);
        if (prop === 'somethingSelected') mockFn.mockReturnValue(false);
        if (prop === 'getScrollInfo') mockFn.mockReturnValue({});
        if (prop === 'charCoords') mockFn.mockReturnValue({ left: 0, top: 0 });
        if (prop === 'cursorCoords') mockFn.mockReturnValue({ left: 0, top: 0 });
        if (prop === 'coordsAtPos') mockFn.mockReturnValue({ left: 0, top: 0 });
        if (prop === 'operation') mockFn.mockImplementation((fn: () => void) => fn());

        target[prop] = mockFn;
      }
      return target[prop];
    },
  };
  return new Proxy({}, handler);
};

/** 创建完整的 KeyboardEvent mock */
const createMockKeyboardEvent = (keyCode: number = 0, options?: Partial<KeyboardEvent>): KeyboardEvent => {
  const evt = new KeyboardEvent('keydown', {
    keyCode,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  return evt as unknown as KeyboardEvent;
};

/** 创建完整的 CM6 编辑器 mock */
const createMockEditorAdapter = (): any => {
  const editor = createAutoMock();

  editor.view = createAutoMock();
  editor.view.state = {
    doc: createAutoMock(),
    selection: { main: { head: 0 } },
  };
  editor.view.state.doc.sliceString = vi.fn(() => '');
  editor.view.coordsAtPos = vi.fn(() => ({ left: 100, top: 100 }));
  editor.view.dispatch = vi.fn();
  editor.view.focus = vi.fn();

  editor.state = {
    doc: createAutoMock(),
  };
  editor.state.doc.sliceString = vi.fn(() => '');

  editor.display = {
    wrapper: document.createElement('div'),
  };

  editor.options = {};

  return editor;
};

/** 创建 mock cherry 实例 */
const createMockCherry = (suggesterConfig = {}) => {
  const wrapperDom = {
    appendChild: vi.fn(),
    querySelector: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      left: 100,
      top: 100,
      width: 800,
      height: 600,
      right: 900,
      bottom: 700,
    })),
    clientWidth: 800,
    clientHeight: 600,
  };

  const editorAdapter = createMockEditorAdapter();

  // mock $cherry.$event（afterChange/beforeSelectionChange/onScroll 事件总线）
  const $event = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  return {
    locale: 'zh-CN',
    wrapperDom,
    $event,
    options: {
      editor: {
        suggester: suggesterConfig,
      },
    },
    editor: {
      editor: editorAdapter,
      options: {
        showSuggestList: true,
      },
    },
  };
};

/** Suggester 配置项类型 */
interface SuggesterConfigItem {
  keyword: string;
  suggestList?: (word: string, callback: Function) => void;
  echo?: ((text: string) => string) | false;
}

/** Suggester 配置类型 */
interface SuggesterConfig {
  suggester: SuggesterConfigItem[] | Record<string, SuggesterConfigItem>;
}

/** 创建 mock 配置 */
const createMockConfig = (): SuggesterConfig => ({
  suggester: [
    {
      keyword: '@',
      suggestList: vi.fn((word: string, callback: Function) => {
        callback([{ label: 'test', value: 'testvalue' }]);
      }),
      echo: vi.fn((text: string) => `@${text}`),
    },
  ],
});

/** 创建联想面板 DOM 元素 */
const createPanelDom = (items: string[] = [], selectedIdx: number = -1): HTMLDivElement => {
  const panelDiv = document.createElement('div');
  panelDiv.className = 'cherry-suggester-panel';
  panelDiv.innerHTML = items
    .map(
      (item, idx) =>
        `<div class="cherry-suggester-panel__item${idx === selectedIdx ? ' cherry-suggester-panel__item--selected' : ''}">${item}</div>`,
    )
    .join('');
  return panelDiv;
};

/** 设置 SuggesterPanel 基础状态用于键盘测试 */
const setupPanelForKeyboardTest = (
  suggester: Suggester,
  cherry: ReturnType<typeof createMockCherry>,
  options: {
    optionList?: any[];
    keyword?: string;
    cursorFrom?: number | { line: number; ch: number };
    searchKeyCache?: string[];
    panelItems?: string[];
    selectedIdx?: number;
  } = {},
) => {
  const {
    optionList = ['item1', 'item2', 'item3'],
    keyword = '@',
    cursorFrom,
    searchKeyCache,
    panelItems,
    selectedIdx = -1,
  } = options;

  Object.assign(suggester.suggesterPanel, {
    editor: cherry.editor,
    optionList,
    keyword,
    cursorFrom: cursorFrom ?? suggester.suggesterPanel.cursorFrom,
    searchKeyCache: searchKeyCache ?? suggester.suggesterPanel.searchKeyCache,
    $suggesterPanel: createPanelDom(panelItems || optionList.map(String), selectedIdx),
  });
};

/** 创建带默认配置的 Suggester 实例 */
const createSuggesterInstance = (config?: SuggesterConfig, cherry?: ReturnType<typeof createMockCherry>) => {
  return new Suggester({ config: config ?? mockConfig, cherry: cherry ?? mockCherry });
};

// ============ 测试开始 ============

let mockCherry: ReturnType<typeof createMockCherry>;
let mockConfig: ReturnType<typeof createMockConfig>;

describe('core/hooks/Suggester', () => {
  beforeEach(() => {
    mockCherry = createMockCherry();
    mockConfig = createMockConfig();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Suggester 类', () => {
    describe('constructor', () => {
      it('应该正确初始化', () => {
        const suggester = createSuggesterInstance();
        expect(suggester).toBeDefined();
        expect(suggester.config).toBe(mockConfig);
        expect(suggester.$cherry).toBe(mockCherry);
        expect(suggester.suggesterPanel).toBeDefined();
      });

      it('应该初始化配置', () => {
        const suggester = createSuggesterInstance();
        expect(suggester.inited).toBe(true);
        expect(suggester.suggester).toBeDefined();
      });
    });

    describe('initConfig', () => {
      it('应该使用默认配置', () => {
        const config = { suggester: {} };
        const suggester = createSuggesterInstance(config, mockCherry);
        expect(Object.keys(suggester.suggester || {}).length).toBeGreaterThan(0);
        suggesterKeywords.split('').forEach((keyword) => {
          expect(suggester.suggester?.[keyword]).toBeDefined();
        });
      });

      it('应该合并自定义配置', () => {
        const customConfig = {
          suggester: [{ keyword: 'custom', suggestList: vi.fn() }],
        };
        const customCherry = createMockCherry(customConfig);
        const suggester = createSuggesterInstance(customConfig, customCherry);
        expect(suggester.suggester?.custom).toBeDefined();
      });

      it('应该处理空关键字', () => {
        const customConfig = {
          suggester: [{ keyword: '', suggestList: vi.fn() }],
        };
        const customCherry = createMockCherry(customConfig);
        const suggester = createSuggesterInstance(customConfig, customCherry);
        expect(suggester.suggester?.['@']).toBeDefined();
      });

      it('应该警告缺少 suggestList', () => {
        const warnSpy = vi.spyOn(console, 'warn');
        const customConfig = {
          suggester: [{ keyword: 'test' }],
        };
        const customCherry = createMockCherry(customConfig);
        createSuggesterInstance(customConfig, customCherry);
        expect(warnSpy).toHaveBeenCalledWith('[cherry-suggester]: the suggestList of config is missing.');
      });
    });

    describe('afterInit', () => {
      it('应该调用回调函数', () => {
        const suggester = createSuggesterInstance();
        const callback = vi.fn();
        suggester.afterInit(callback);
        expect(callback).toHaveBeenCalled();
      });

      it('应该忽略非函数参数', () => {
        const suggester = createSuggesterInstance();
        expect(() => suggester.afterInit('not a function')).not.toThrow();
      });
    });

    describe('rule', () => {
      it('应该返回空对象当没有配置', () => {
        const suggester = createSuggesterInstance({ suggester: {} }, mockCherry);
        expect(suggester.rule()).toEqual({});
      });

      it('应该生成正则规则（数组配置）', () => {
        const config = {
          suggester: [
            { keyword: '@', suggestList: vi.fn() },
            { keyword: '#', suggestList: vi.fn() },
          ],
        };
        const suggester = createSuggesterInstance(config, mockCherry);
        const rule = suggester.rule();
        expect(rule.reg).toBeDefined();
        expect(rule.reg.source).toContain('@');
        expect(rule.reg.source).toContain('#');
      });

      it('应该生成正则规则（对象配置）', () => {
        const config = {
          suggester: {
            at: { keyword: '@', suggestList: vi.fn() },
            hash: { keyword: '#', suggestList: vi.fn() },
          },
        };
        const suggester = createSuggesterInstance(config, mockCherry);
        expect(suggester.rule().reg).toBeDefined();
      });
    });

    describe('makeHtml', () => {
      it('应该在没有规则时返回原字符串', () => {
        const suggester = createSuggesterInstance({ suggester: {} }, mockCherry);
        suggester.RULE = {};
        expect(suggester.makeHtml('test string')).toBe('test string');
      });
    });

    describe('toHtml', () => {
      it('应该使用自定义 echo 函数', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
              echo: vi.fn((text: string) => `<custom>@${text}</custom>`),
            },
          ],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        expect(suggester.toHtml('', ' ', '@', 'user')).toBe('<custom>@user</custom>');
      });

      it('应该使用默认格式', () => {
        const config = {
          suggester: [{ keyword: '@', suggestList: vi.fn() }],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        const result = suggester.toHtml('', ' ', '@', 'user');
        expect(result).toContain('cherry-suggestion');
        expect(result).toContain('@user');
      });

      it('应该处理 echo 为 false', () => {
        const config: SuggesterConfig = {
          suggester: [{ keyword: '@', suggestList: vi.fn(), echo: false as const }],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        expect(suggester.toHtml('', ' ', '@', '')).toBe(' ');
      });

      it('应该处理不存在的关键字', () => {
        const suggester = createSuggesterInstance();
        expect(suggester.toHtml('', ' ', 'nonexistent', 'text')).toContain('text');
      });

      it('应该处理空文本', () => {
        const config = {
          suggester: [{ keyword: '@', suggestList: vi.fn() }],
        };
        const suggester = createSuggesterInstance(config, mockCherry);
        expect(suggester.toHtml('', ' ', '@', '')).toBe(' ');
      });
    });
  });

  describe('SuggesterPanel 类', () => {
    describe('hasEditor', () => {
      it('应该返回 false 当没有编辑器', () => {
        const suggester = createSuggesterInstance();
        expect(suggester.suggesterPanel.hasEditor()).toBe(false);
      });

      it('应该返回 true 当有编辑器', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.editor = mockCherry.editor;
        expect(suggester.suggesterPanel.hasEditor()).toBe(true);
      });
    });

    describe('setEditor', () => {
      it('应该设置编辑器', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.setEditor(mockCherry.editor);
        expect(suggester.suggesterPanel.editor).toBe(mockCherry.editor);
      });
    });

    describe('setSuggester', () => {
      it('应该设置 suggester 配置', () => {
        const suggester = createSuggesterInstance();
        const config = { '@': { keyword: '@', suggestList: vi.fn() } };
        suggester.suggesterPanel.setSuggester(config);
        expect(suggester.suggesterPanel.suggesterConfig).toBe(config);
      });
    });

    describe('renderPanelItem', () => {
      it('应该渲染选中项', () => {
        const suggester = createSuggesterInstance();
        const result = suggester.suggesterPanel.renderPanelItem('test', true);
        expect(result).toContain('cherry-suggester-panel__item--selected');
        expect(result).toContain('test');
      });

      it('应该渲染未选中项', () => {
        const suggester = createSuggesterInstance();
        const result = suggester.suggesterPanel.renderPanelItem('test', false);
        expect(result).not.toContain('cherry-suggester-panel__item--selected');
        expect(result).toContain('test');
      });
    });

    describe('createDom', () => {
      it('应该创建 DOM 元素', () => {
        const suggester = createSuggesterInstance();
        const result = suggester.suggesterPanel.createDom('<div class="test">content</div>');
        expect(result).toBeDefined();
      });
    });

    describe('startRelate', () => {
      it('应该开始关联', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', 0);

        expect(suggester.suggesterPanel.searchCache).toBe(true);
        expect(suggester.suggesterPanel.keyword).toBe('@');
        expect(suggester.suggesterPanel.cursorFrom).toBe(0);
      });
    });

    describe('stopRelate', () => {
      it('应该停止关联', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', 0);
        suggester.suggesterPanel.stopRelate();

        expect(suggester.suggesterPanel.searchCache).toBe(false);
        expect(suggester.suggesterPanel.keyword).toBe('');
        expect(suggester.suggesterPanel.cursorFrom).toBeNull();
      });
    });

    describe('enableRelate', () => {
      it('应该返回关联状态', () => {
        const suggester = createSuggesterInstance();
        expect(suggester.suggesterPanel.enableRelate()).toBe(false);
        suggester.suggesterPanel.searchCache = true;
        expect(suggester.suggesterPanel.enableRelate()).toBe(true);
      });
    });

    describe('pasteSelectResult', () => {
      it('应该粘贴选择结果（字符串值）', () => {
        const suggester = createSuggesterInstance();
        setupPanelForKeyboardTest(suggester, mockCherry, {
          optionList: [{ label: 'test', value: 'testvalue' }],
          cursorFrom: 0,
          searchKeyCache: ['@', 't'],
        });

        suggester.suggesterPanel.pasteSelectResult(0);
        expect(mockCherry.editor.editor.replaceRange).toHaveBeenCalledWith('testvalue', 0, 2);
      });

      it('应该粘贴选择结果（函数值）', () => {
        const suggester = createSuggesterInstance();
        setupPanelForKeyboardTest(suggester, mockCherry, {
          optionList: [{ label: 'test', value: () => 'function_value' }],
          cursorFrom: 0,
          searchKeyCache: ['@'],
        });

        suggester.suggesterPanel.pasteSelectResult(0);
        expect(mockCherry.editor.editor.replaceRange).toHaveBeenCalledWith('function_value', 0, 1);
      });

      it('应该处理空值', () => {
        const suggester = createSuggesterInstance();
        setupPanelForKeyboardTest(suggester, mockCherry, {
          optionList: [{ label: 'test' }],
          cursorFrom: 0,
          searchKeyCache: ['@'],
        });

        suggester.suggesterPanel.pasteSelectResult(0);
        expect(mockCherry.editor.editor.replaceRange).toHaveBeenCalledWith(' @[object Object] ', 0, 1);
      });

      it('应该处理 goLeft 参数', () => {
        const suggester = createSuggesterInstance();
        setupPanelForKeyboardTest(suggester, mockCherry, {
          optionList: [{ label: 'test', value: 'test()', goLeft: 1 }],
          cursorFrom: 0,
          searchKeyCache: ['@'],
        });

        suggester.suggesterPanel.pasteSelectResult(0);
        // CM6 原生方式：使用 view.dispatch 设置光标
        expect(mockCherry.editor.editor.view.dispatch).toHaveBeenCalled();
      });

      it('应该处理 selection 参数', () => {
        const suggester = createSuggesterInstance();
        setupPanelForKeyboardTest(suggester, mockCherry, {
          optionList: [{ label: 'test', value: 'test', selection: { from: 2, to: 1 } }],
          cursorFrom: 0,
          searchKeyCache: ['@'],
        });

        suggester.suggesterPanel.pasteSelectResult(0);
        expect(mockCherry.editor.editor.setSelection).toHaveBeenCalled();
      });

      it('应该跳过当没有 cursorFrom', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.pasteSelectResult(0);
        expect(mockCherry.editor.editor.replaceRange).not.toHaveBeenCalled();
      });
    });

    describe('onCodeMirrorChange', () => {
      it('应该开始联想当输入关键字', async () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn((word: string, callback: Function) => {
                callback([{ label: 'test', value: 'test' }]);
              }),
            },
          ],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = createPanelDom();

        // CM6: from/to 使用偏移量
        const evt = { text: ['@'], from: 0, to: 0, origin: '+input' };
        suggester.suggesterPanel.onCodeMirrorChange(customCherry.editor.editor, evt);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.keyword).toBe('@');
      });

      it('应该更新搜索缓存', async () => {
        const config = {
          suggester: [{ keyword: '@', suggestList: vi.fn((word: string, callback: Function) => callback([])) }],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = createPanelDom();
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(customCherry.editor.editor, '@', 0);

        // CM6: from/to 使用偏移量
        const evt = { text: ['t'], from: 1, to: 1, origin: '+input' };
        suggester.suggesterPanel.onCodeMirrorChange(customCherry.editor.editor, evt);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchKeyCache).toContain('t');
      });

      it('应该处理删除操作', () => {
        const config = {
          suggester: [{ keyword: '@', suggestList: vi.fn() }],
        };
        const suggester = createSuggesterInstance(config, mockCherry);
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', 0);
        suggester.suggesterPanel.searchKeyCache = ['@', 't'];

        // CM6: from/to 使用偏移量
        const evt = { text: [''], from: 1, to: 2, origin: '+delete' };
        suggester.suggesterPanel.onCodeMirrorChange(mockCherry.editor.editor, evt);

        expect(suggester.suggesterPanel.searchKeyCache).toEqual(['@']);
      });

      it('应该停止联想当搜索缓存为空', () => {
        const config = {
          suggester: [{ keyword: '@', suggestList: vi.fn() }],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(customCherry.editor.editor, '@', 0);
        suggester.suggesterPanel.searchKeyCache = ['@'];

        // CM6: from/to 使用偏移量
        const evt = { text: [''], from: 0, to: 1, origin: '+delete' };
        suggester.suggesterPanel.onCodeMirrorChange(customCherry.editor.editor, evt);

        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });

      it('应该停止联想当返回 false', async () => {
        const config = {
          suggester: [{ keyword: '@', suggestList: vi.fn((word: string, callback: Function) => callback(false)) }],
        };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(customCherry.editor.editor, '@', 0);

        // CM6: from/to 使用偏移量
        const evt = { text: [' '], from: 1, to: 1, origin: '+input' };
        suggester.suggesterPanel.onCodeMirrorChange(customCherry.editor.editor, evt);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });
    });

    describe('onKeyDown', () => {
      it('应该处理上键（38）- 选中最后一项', () => {
        const config = { suggester: [{ keyword: '@', suggestList: vi.fn() }] };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        setupPanelForKeyboardTest(suggester, customCherry);

        const evt = createMockKeyboardEvent(38);
        suggester.suggesterPanel.onKeyDown(customCherry.editor.editor, evt);

        const lastItem = suggester.suggesterPanel.$suggesterPanel.lastElementChild;
        expect(lastItem?.classList.contains('cherry-suggester-panel__item--selected')).toBe(true);
      });

      it('应该处理下键（40）- 选中第一项', () => {
        const config = { suggester: [{ keyword: '@', suggestList: vi.fn() }] };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        setupPanelForKeyboardTest(suggester, customCherry);

        const evt = createMockKeyboardEvent(40);
        suggester.suggesterPanel.onKeyDown(customCherry.editor.editor, evt);

        const firstItem = suggester.suggesterPanel.$suggesterPanel.firstElementChild;
        expect(firstItem?.classList.contains('cherry-suggester-panel__item--selected')).toBe(true);
      });

      it('应该处理回车键（13）', () => {
        const config = { suggester: [{ keyword: '@', suggestList: vi.fn() }] };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        setupPanelForKeyboardTest(suggester, customCherry, {
          optionList: [{ label: 'test', value: 'test' }],
          cursorFrom: 0,
          searchKeyCache: ['@'],
          panelItems: ['test'],
          selectedIdx: 0,
        });

        const evt = createMockKeyboardEvent(13);
        suggester.suggesterPanel.onKeyDown(customCherry.editor.editor, evt);

        // CM6 原生方式：使用 view.focus()
        expect(customCherry.editor.editor.view.focus).toHaveBeenCalled();
      });

      it('应该处理 ESC 键（27）', async () => {
        const config = { suggester: [{ keyword: '@', suggestList: vi.fn() }] };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = document.createElement('div');
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(customCherry.editor.editor, '@', 0);

        const evt = createMockKeyboardEvent(27);
        suggester.suggesterPanel.onKeyDown(customCherry.editor.editor, evt);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });

      it('应该在空列表时停止联想', async () => {
        const config = { suggester: [{ keyword: '@', suggestList: vi.fn() }] };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.optionList = [];
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = document.createElement('div');
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(customCherry.editor.editor, '@', 0);

        const evt = createMockKeyboardEvent(38);
        suggester.suggesterPanel.onKeyDown(customCherry.editor.editor, evt);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });

      it('应该处理左右方向键退出联想', async () => {
        const config = { suggester: [{ keyword: '@', suggestList: vi.fn() }] };
        const customCherry = createMockCherry(config);
        const suggester = createSuggesterInstance(config, customCherry);
        suggester.suggesterPanel.editor = customCherry.editor;
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = document.createElement('div');
        // CM6: 使用偏移量格式
        suggester.suggesterPanel.startRelate(customCherry.editor.editor, '@', 0);

        // 左箭头 (0x25 = 37)
        const leftEvt = createMockKeyboardEvent(0x25);
        suggester.suggesterPanel.onKeyDown(customCherry.editor.editor, leftEvt);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });
    });

    describe('bindEvent', () => {
      it('应该绑定 change 事件到 editor.editor.on', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.$cherry = mockCherry;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = createPanelDom();
        suggester.suggesterPanel.bindEvent();

        // change 事件保留在 CM6Adapter 上（需要 {text, from, to, origin} 细节）
        expect(mockCherry.editor.editor.on).toHaveBeenCalledWith('change', expect.any(Function));
      });

      it('应该绑定 cursorActivity/scroll 事件到 $cherry.$event', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.$cherry = mockCherry;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.$suggesterPanel = createPanelDom();
        suggester.suggesterPanel.bindEvent();

        // cursorActivity 和 scroll 使用 $cherry.$event 统一管理
        expect(mockCherry.$event.on).toHaveBeenCalledWith('beforeSelectionChange', expect.any(Function));
        expect(mockCherry.$event.on).toHaveBeenCalledWith('onScroll', expect.any(Function));
        // afterChange 不应出现（已改为 editor.editor.on('change')）
        expect(mockCherry.$event.on).not.toHaveBeenCalledWith('afterChange', expect.any(Function));
      });

      it('应该跳过当没有 showSuggestList', () => {
        const suggester = createSuggesterInstance();
        mockCherry.editor.options.showSuggestList = false;
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.$cherry = mockCherry;
        suggester.suggesterPanel.bindEvent();

        expect(mockCherry.editor.editor.on).not.toHaveBeenCalled();
        expect(mockCherry.$event.on).not.toHaveBeenCalled();
      });
    });

    describe('findSelectedItemIndex', () => {
      it('应该找到选中项索引', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.$suggesterPanel = createPanelDom(['item1', 'item2', 'item3'], 1);

        expect(suggester.suggesterPanel.findSelectedItemIndex()).toBe(1);
      });

      it('应该返回 -1 当没有选中项', () => {
        const suggester = createSuggesterInstance();
        suggester.suggesterPanel.$suggesterPanel = createPanelDom(['item1', 'item2']);

        expect(suggester.suggesterPanel.findSelectedItemIndex()).toBe(-1);
      });
    });
  });
});
