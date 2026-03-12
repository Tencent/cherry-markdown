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
  replaceLookbehind: (str: string, reg: RegExp, callback: Function) => {
    return str.replace(reg, callback);
  },
}));

// ============ 辅助函数 ============

/** 创建 mock cherry 实例 */
const createMockCherry = () => {
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

  const editor = {
    editor: {
      on: vi.fn(),
      getOption: vi.fn(() => ({})),
      setOption: vi.fn(),
      focus: vi.fn(),
      replaceRange: vi.fn(),
      getCursor: vi.fn(() => ({ line: 0, ch: 0 })),
      setCursor: vi.fn(),
      setSelection: vi.fn(),
      getLine: vi.fn(() => ''),
      display: {
        wrapper: document.createElement('div'),
      },
    },
    options: {
      showSuggestList: true,
    },
  };

  return {
    locale: 'zh-CN',
    wrapperDom,
    options: {
      editor: {
        suggester: {},
      },
    },
    editor,
  };
};

/** 创建 mock 配置 */
const createMockConfig = () => ({
  suggester: [
    {
      keyword: '@',
      suggestList: vi.fn((word, callback) => {
        callback([{ label: 'test', value: 'testvalue' }]);
      }),
      echo: vi.fn((text) => `@${text}`),
    },
  ],
});

// ============ 测试开始 ============

describe('core/hooks/Suggester', () => {
  let mockCherry: any;
  let mockConfig: any;

  beforeEach(() => {
    mockCherry = createMockCherry();
    mockConfig = createMockConfig();
    // 清理 DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Suggester 类', () => {
    describe('constructor', () => {
      it('应该正确初始化', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        expect(suggester).toBeDefined();
        expect(suggester.config).toBe(mockConfig);
        expect(suggester.$cherry).toBe(mockCherry);
        expect(suggester.suggesterPanel).toBeDefined();
      });

      it('应该初始化配置', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        expect(suggester.inited).toBe(true);
        expect(suggester.suggester).toBeDefined();
      });
    });

    describe('initConfig', () => {
      it('应该使用默认配置', () => {
        const config = { suggester: {} };
        const suggester = new Suggester({ config, cherry: mockCherry });
        expect(Object.keys(suggester.suggester).length).toBeGreaterThan(0);
        // 应该包含 suggesterKeywords 中的关键字
        suggesterKeywords.split('').forEach((keyword) => {
          expect(suggester.suggester[keyword]).toBeDefined();
        });
      });

      it('应该合并自定义配置', () => {
        const customConfig = {
          suggester: [
            {
              keyword: 'custom',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config: customConfig, cherry: mockCherry });
        expect(suggester.suggester['custom']).toBeDefined();
      });

      it('应该处理空关键字', () => {
        const config = {
          suggester: [
            {
              keyword: '',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        // 空关键字应该被设置为默认的 '@'
        expect(suggester.suggester['']).toBeDefined();
      });

      it('应该警告缺少 suggestList', () => {
        const warnSpy = vi.spyOn(console, 'warn');
        const config = {
          suggester: [
            {
              keyword: 'test',
              // 没有 suggestList
            },
          ],
        };
        new Suggester({ config, cherry: mockCherry });
        expect(warnSpy).toHaveBeenCalledWith('[cherry-suggester]: the suggestList of config is missing.');
      });
    });

    describe('afterInit', () => {
      it('应该调用回调函数', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        const callback = vi.fn();
        suggester.afterInit(callback);
        expect(callback).toHaveBeenCalled();
      });

      it('应该忽略非函数参数', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        expect(() => suggester.afterInit('not a function' as any)).not.toThrow();
      });
    });

    describe('rule', () => {
      it('应该返回空对象当没有配置', () => {
        const suggester = new Suggester({ config: { suggester: {} }, cherry: mockCherry });
        const rule = suggester.rule();
        expect(rule).toEqual({});
      });

      it('应该生成正则规则（数组配置）', () => {
        const config = {
          suggester: [
            { keyword: '@', suggestList: vi.fn() },
            { keyword: '#', suggestList: vi.fn() },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
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
        const suggester = new Suggester({ config, cherry: mockCherry });
        const rule = suggester.rule();
        expect(rule.reg).toBeDefined();
      });
    });

    describe('makeHtml', () => {
      it('应该在没有规则时返回原字符串', () => {
        const suggester = new Suggester({ config: { suggester: {} }, cherry: mockCherry });
        suggester.RULE = {};
        const result = suggester.makeHtml('test string');
        expect(result).toBe('test string');
      });
    });

    describe('toHtml', () => {
      it('应该使用自定义 echo 函数', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
              echo: vi.fn((text) => `<custom>@${text}</custom>`),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        const result = suggester.toHtml('', ' ', '@', 'user');
        expect(result).toBe('<custom>@user</custom>');
      });

      it('应该使用默认格式', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        const result = suggester.toHtml('', ' ', '@', 'user');
        expect(result).toContain('cherry-suggestion');
        expect(result).toContain('@user');
      });

      it('应该处理 echo 为 false', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
              echo: false,
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        const result = suggester.toHtml('', ' ', '@', 'user');
        expect(result).toBe(' ');
      });

      it('应该处理不存在的关键字', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        const result = suggester.toHtml('', ' ', 'nonexistent', 'text');
        expect(result).toContain('text');
      });

      it('应该处理空文本', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        const result = suggester.toHtml('', ' ', '@', '');
        expect(result).toBe(' ');
      });
    });
  });

  describe('SuggesterPanel 类', () => {
    describe('hasEditor', () => {
      it('应该返回 false 当没有编辑器', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        expect(suggester.suggesterPanel.hasEditor()).toBe(false);
      });

      it('应该返回 true 当有编辑器', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        expect(suggester.suggesterPanel.hasEditor()).toBe(true);
      });
    });

    describe('setEditor', () => {
      it('应该设置编辑器', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.setEditor(mockCherry.editor);
        expect(suggester.suggesterPanel.editor).toBe(mockCherry.editor);
      });
    });

    describe('setSuggester', () => {
      it('应该设置 suggester 配置', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        const config = { '@': { keyword: '@', suggestList: vi.fn() } };
        suggester.suggesterPanel.setSuggester(config);
        expect(suggester.suggesterPanel.suggesterConfig).toBe(config);
      });
    });

    describe('renderPanelItem', () => {
      it('应该渲染选中项', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        const result = suggester.suggesterPanel.renderPanelItem('test', true);
        expect(result).toContain('cherry-suggester-panel__item--selected');
        expect(result).toContain('test');
      });

      it('应该渲染未选中项', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        const result = suggester.suggesterPanel.renderPanelItem('test', false);
        expect(result).not.toContain('cherry-suggester-panel__item--selected');
        expect(result).toContain('test');
      });
    });

    describe('createDom', () => {
      it('应该创建 DOM 元素', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        const result = suggester.suggesterPanel.createDom('<div class="test">content</div>');
        expect(result).toBeDefined();
      });
    });

    describe('startRelate', () => {
      it('应该开始关联', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        // Mock tryCreatePanel and relocatePanelWithBoundaryCheck to avoid DOM issues
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });

        expect(suggester.suggesterPanel.searchCache).toBe(true);
        expect(suggester.suggesterPanel.keyword).toBe('@');
        expect(suggester.suggesterPanel.cursorFrom).toEqual({ line: 0, ch: 0 });
      });
    });

    describe('stopRelate', () => {
      it('应该停止关联', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });
        suggester.suggesterPanel.stopRelate();

        expect(suggester.suggesterPanel.searchCache).toBe(false);
        expect(suggester.suggesterPanel.keyword).toBe('');
        expect(suggester.suggesterPanel.cursorFrom).toBeNull();
      });
    });

    describe('enableRelate', () => {
      it('应该返回关联状态', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        expect(suggester.suggesterPanel.enableRelate()).toBe(false);

        suggester.suggesterPanel.searchCache = true;
        expect(suggester.suggesterPanel.enableRelate()).toBe(true);
      });
    });

    describe('pasteSelectResult', () => {
      it('应该粘贴选择结果（字符串值）', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.cursorFrom = { line: 0, ch: 0 };
        suggester.suggesterPanel.keyword = '@';
        suggester.suggesterPanel.optionList = [{ label: 'test', value: 'testvalue' }];
        suggester.suggesterPanel.searchKeyCache = ['@', 't'];

        suggester.suggesterPanel.pasteSelectResult(0);

        expect(mockCherry.editor.editor.replaceRange).toHaveBeenCalled();
      });

      it('应该粘贴选择结果（函数值）', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.cursorFrom = { line: 0, ch: 0 };
        suggester.suggesterPanel.keyword = '@';
        suggester.suggesterPanel.optionList = [
          { label: 'test', value: () => 'function_value' },
        ];
        suggester.suggesterPanel.searchKeyCache = ['@'];

        suggester.suggesterPanel.pasteSelectResult(0);

        expect(mockCherry.editor.editor.replaceRange).toHaveBeenCalledWith(
          'function_value',
          { line: 0, ch: 0 },
          { line: 0, ch: 1 }
        );
      });

      it('应该处理空值', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.cursorFrom = { line: 0, ch: 0 };
        suggester.suggesterPanel.keyword = '@';
        suggester.suggesterPanel.optionList = [{ label: 'test' }];
        suggester.suggesterPanel.searchKeyCache = ['@'];

        suggester.suggesterPanel.pasteSelectResult(0);

        expect(mockCherry.editor.editor.replaceRange).toHaveBeenCalled();
      });

      it('应该处理 goLeft 参数', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.cursorFrom = { line: 0, ch: 0 };
        suggester.suggesterPanel.keyword = '@';
        suggester.suggesterPanel.optionList = [
          { label: 'test', value: 'test()', goLeft: 1 },
        ];
        suggester.suggesterPanel.searchKeyCache = ['@'];

        suggester.suggesterPanel.pasteSelectResult(0);

        expect(mockCherry.editor.editor.setCursor).toHaveBeenCalled();
      });

      it('应该处理 selection 参数', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.cursorFrom = { line: 0, ch: 0 };
        suggester.suggesterPanel.keyword = '@';
        suggester.suggesterPanel.optionList = [
          { label: 'test', value: 'test', selection: { from: 2, to: 1 } },
        ];
        suggester.suggesterPanel.searchKeyCache = ['@'];

        suggester.suggesterPanel.pasteSelectResult(0);

        expect(mockCherry.editor.editor.setSelection).toHaveBeenCalled();
      });

      it('应该跳过当没有 cursorFrom', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.pasteSelectResult(0);

        expect(mockCherry.editor.editor.replaceRange).not.toHaveBeenCalled();
      });
    });

    describe('onCodeMirrorChange', () => {
      it('应该开始联想当输入关键字', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn((word, callback) => {
                callback([{ label: 'test', value: 'test' }]);
              }),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();

        const evt = {
          text: ['@'],
          from: { line: 0, ch: 0 },
          to: { line: 0, ch: 0 },
          origin: '+input',
        };

        suggester.suggesterPanel.onCodeMirrorChange(mockCherry.editor.editor, evt);

        expect(suggester.suggesterPanel.searchCache).toBe(true);
        expect(suggester.suggesterPanel.keyword).toBe('@');
      });

      it('应该更新搜索缓存', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn((word, callback) => {
                callback([]);
              }),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });

        const evt = {
          text: ['t'],
          from: { line: 0, ch: 1 },
          to: { line: 0, ch: 1 },
          origin: '+input',
        };

        suggester.suggesterPanel.onCodeMirrorChange(mockCherry.editor.editor, evt);

        expect(suggester.suggesterPanel.searchKeyCache).toContain('t');
      });

      it('应该处理删除操作', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });
        suggester.suggesterPanel.searchKeyCache = ['@', 't'];

        const evt = {
          text: [''],
          from: { line: 0, ch: 1 },
          to: { line: 0, ch: 2 },
          origin: '+delete',
        };

        suggester.suggesterPanel.onCodeMirrorChange(mockCherry.editor.editor, evt);

        expect(suggester.suggesterPanel.searchKeyCache).toEqual(['@']);
      });

      it('应该停止联想当搜索缓存为空', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });
        suggester.suggesterPanel.searchKeyCache = ['@'];

        const evt = {
          text: [''],
          from: { line: 0, ch: 0 },
          to: { line: 0, ch: 1 },
          origin: '+delete',
        };

        suggester.suggesterPanel.onCodeMirrorChange(mockCherry.editor.editor, evt);

        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });

      it('应该停止联想当返回 false', async () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn((word, callback) => {
                callback(false);
              }),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });

        const evt = {
          text: [' '],
          from: { line: 0, ch: 1 },
          to: { line: 0, ch: 1 },
          origin: '+input',
        };

        suggester.suggesterPanel.onCodeMirrorChange(mockCherry.editor.editor, evt);

        // Wait for async callback
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });
    });

    describe('onKeyDown', () => {
      it('应该处理上键（38）', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.optionList = ['item1', 'item2', 'item3'];

        // 创建完整的面板 DOM
        const panelDiv = document.createElement('div');
        panelDiv.className = 'cherry-suggester-panel';
        panelDiv.innerHTML = '<div class="item">item1</div><div class="item">item2</div><div class="item">item3</div>';
        suggester.suggesterPanel.$suggesterPanel = panelDiv;

        const evt = { keyCode: 38, stopPropagation: vi.fn() };
        suggester.suggesterPanel.onKeyDown(mockCherry.editor.editor, evt);

        // 上键应该选中最后一项
        const lastItem = suggester.suggesterPanel.$suggesterPanel.lastElementChild;
        expect(lastItem?.classList.contains('cherry-suggester-panel__item--selected')).toBe(true);
      });

      it('应该处理下键（40）', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.optionList = ['item1', 'item2', 'item3'];

        // 创建完整的面板 DOM
        const panelDiv = document.createElement('div');
        panelDiv.className = 'cherry-suggester-panel';
        panelDiv.innerHTML = '<div class="item">item1</div><div class="item">item2</div><div class="item">item3</div>';
        suggester.suggesterPanel.$suggesterPanel = panelDiv;

        const evt = { keyCode: 40, stopPropagation: vi.fn() };
        suggester.suggesterPanel.onKeyDown(mockCherry.editor.editor, evt);

        // 下键应该选中第一项
        const firstItem = suggester.suggesterPanel.$suggesterPanel.firstElementChild;
        expect(firstItem?.classList.contains('cherry-suggester-panel__item--selected')).toBe(true);
      });

      it('应该处理回车键（13）', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.cursorFrom = { line: 0, ch: 0 };
        suggester.suggesterPanel.keyword = '@';
        suggester.suggesterPanel.optionList = [{ label: 'test', value: 'test' }];
        suggester.suggesterPanel.searchKeyCache = ['@'];

        // 创建完整的面板 DOM
        const panelDiv = document.createElement('div');
        panelDiv.className = 'cherry-suggester-panel';
        panelDiv.innerHTML = '<div class="cherry-suggester-panel__item cherry-suggester-panel__item--selected">test</div>';
        suggester.suggesterPanel.$suggesterPanel = panelDiv;

        const evt = { keyCode: 13, stopPropagation: vi.fn() };
        suggester.suggesterPanel.onKeyDown(mockCherry.editor.editor, evt);

        expect(mockCherry.editor.editor.focus).toHaveBeenCalled();
      });

      it('应该处理 ESC 键（27）', async () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });

        const evt = { keyCode: 27, stopPropagation: vi.fn() };
        suggester.suggesterPanel.onKeyDown(mockCherry.editor.editor, evt);

        // Wait for setTimeout
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(suggester.suggesterPanel.searchCache).toBe(false);
      });

      it('应该在空列表时停止联想', () => {
        const config = {
          suggester: [
            {
              keyword: '@',
              suggestList: vi.fn(),
            },
          ],
        };
        const suggester = new Suggester({ config, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.optionList = [];
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        suggester.suggesterPanel.relocatePanelWithBoundaryCheck = vi.fn();
        suggester.suggesterPanel.startRelate(mockCherry.editor.editor, '@', { line: 0, ch: 0 });

        const evt = { keyCode: 38, stopPropagation: vi.fn() };
        suggester.suggesterPanel.onKeyDown(mockCherry.editor.editor, evt);

        // 应该在 setTimeout 后停止联想
      });
    });

    describe('bindEvent', () => {
      it('应该绑定事件', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.setSuggester(suggester.suggester);
        // Mock tryCreatePanel
        suggester.suggesterPanel.tryCreatePanel = vi.fn();
        const panelDiv = document.createElement('div');
        panelDiv.className = 'cherry-suggester-panel';
        suggester.suggesterPanel.$suggesterPanel = panelDiv;
        suggester.suggesterPanel.bindEvent();

        expect(mockCherry.editor.editor.on).toHaveBeenCalled();
      });

      it('应该跳过当没有 showSuggestList', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });
        mockCherry.editor.options.showSuggestList = false;
        suggester.suggesterPanel.editor = mockCherry.editor;
        suggester.suggesterPanel.bindEvent();

        expect(mockCherry.editor.editor.on).not.toHaveBeenCalled();
      });
    });

    describe('findSelectedItemIndex', () => {
      it('应该找到选中项索引', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });

        // 创建面板 DOM
        const panelDiv = document.createElement('div');
        panelDiv.className = 'cherry-suggester-panel';
        const item1 = document.createElement('div');
        item1.className = 'cherry-suggester-panel__item';
        const item2 = document.createElement('div');
        item2.className = 'cherry-suggester-panel__item cherry-suggester-panel__item--selected';
        const item3 = document.createElement('div');
        item3.className = 'cherry-suggester-panel__item';
        panelDiv.appendChild(item1);
        panelDiv.appendChild(item2);
        panelDiv.appendChild(item3);

        suggester.suggesterPanel.$suggesterPanel = panelDiv;

        const index = suggester.suggesterPanel.findSelectedItemIndex();
        expect(index).toBe(1);
      });

      it('应该返回 -1 当没有选中项', () => {
        const suggester = new Suggester({ config: mockConfig, cherry: mockCherry });

        // 创建面板 DOM
        const panelDiv = document.createElement('div');
        panelDiv.className = 'cherry-suggester-panel';
        const item1 = document.createElement('div');
        item1.className = 'cherry-suggester-panel__item';
        const item2 = document.createElement('div');
        item2.className = 'cherry-suggester-panel__item';
        panelDiv.appendChild(item1);
        panelDiv.appendChild(item2);

        suggester.suggesterPanel.$suggesterPanel = panelDiv;

        const index = suggester.suggesterPanel.findSelectedItemIndex();
        expect(index).toBe(-1);
      });
    });
  });
});
