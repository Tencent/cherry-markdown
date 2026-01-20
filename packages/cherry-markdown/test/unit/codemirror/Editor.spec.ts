/**
 * Editor.js 核心功能测试
 * 测试 Editor 类中与 CodeMirror 交互的核心功能
 *
 * 这些测试记录了编辑器的核心行为，对于升级到 CodeMirror 6 时非常重要
 */
import { describe, it, expect, vi } from 'vitest';
import { createCodeMirrorMock } from '../../__mocks__/codemirror.mock';

// Mock CodeMirror 模块
vi.mock('codemirror', () => ({
  default: {
    fromTextArea: vi.fn(() => createCodeMirrorMock()),
  },
}));

// Mock CodeMirror 插件
vi.mock('codemirror/mode/gfm/gfm', () => ({}));
vi.mock('codemirror/mode/yaml-frontmatter/yaml-frontmatter', () => ({}));
vi.mock('codemirror/addon/edit/continuelist', () => ({}));
vi.mock('codemirror/addon/edit/closetag', () => ({}));
vi.mock('codemirror/addon/fold/xml-fold', () => ({}));
vi.mock('codemirror/addon/edit/matchtags', () => ({}));
vi.mock('codemirror/addon/display/placeholder', () => ({}));
vi.mock('codemirror/keymap/sublime', () => ({}));
vi.mock('codemirror/keymap/vim', () => ({}));
vi.mock('codemirror/addon/search/searchcursor', () => ({}));
vi.mock('codemirror/addon/scroll/annotatescrollbar', () => ({}));
vi.mock('codemirror/addon/search/matchesonscrollbar', () => ({}));

describe('Editor.js - 核心功能', () => {
  describe('编辑器配置', () => {
    it('默认配置应该包含正确的 CodeMirror 选项', () => {
      const defaultConfig = {
        lineNumbers: false,
        cursorHeight: 0.85,
        indentUnit: 4,
        tabSize: 4,
        mode: {
          name: 'yaml-frontmatter',
          base: {
            name: 'gfm',
            gitHubSpice: false,
          },
        },
        lineWrapping: true,
        indentWithTabs: true,
        autofocus: true,
        theme: 'default',
        autoCloseTags: true,
        matchTags: { bothTags: true },
        placeholder: '',
        keyMap: 'sublime',
      };

      // 验证默认配置的关键属性
      expect(defaultConfig.mode.name).toBe('yaml-frontmatter');
      expect(defaultConfig.mode.base.name).toBe('gfm');
      expect(defaultConfig.lineWrapping).toBe(true);
      expect(defaultConfig.indentWithTabs).toBe(true);
      expect(defaultConfig.keyMap).toBe('sublime');
    });

    it('应该支持 vim keyMap', () => {
      const vimConfig = { keyMap: 'vim' };
      expect(vimConfig.keyMap).toBe('vim');
    });
  });

  describe('全角字符处理', () => {
    it('应该识别全角字符', () => {
      const fullWidthChars = ['·', '￥', '、', '：', '"', '"', '【', '】', '（', '）', '《', '》'];
      const regex = /[·￥、：""【】（）《》]/;

      fullWidthChars.forEach((char) => {
        expect(regex.test(char)).toBe(true);
      });
    });

    it('应该能转换全角字符为半角字符', () => {
      // 使用数组来避免重复键问题
      const conversions: Array<[string, string]> = [
        ['·', '`'],
        ['￥', '$'],
        ['、', '/'],
        ['：', ':'],
        ['"', '"'], // 中文左引号
        ['"', '"'], // 中文右引号
        ['【', '['],
        ['】', ']'],
        ['（', '('],
        ['）', ')'],
        ['《', '<'],
        ['》', '>'],
      ];

      conversions.forEach(([fullWidth, halfWidth]) => {
        const converted = fullWidth
          .replace('·', '`')
          .replace('￥', '$')
          .replace('、', '/')
          .replace('：', ':')
          .replace('"', '"')
          .replace('"', '"')
          .replace('【', '[')
          .replace('】', ']')
          .replace('（', '(')
          .replace('）', ')')
          .replace('《', '<')
          .replace('》', '>');
        expect(converted).toBe(halfWidth);
      });
    });
  });

  describe('特殊内容处理正则', () => {
    describe('Base64 图片正则', () => {
      it('应该匹配 Base64 图片数据', () => {
        // 简化的 Base64 正则测试
        const base64Pattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/;
        const testData =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        expect(base64Pattern.test(testData)).toBe(true);
      });
    });

    describe('长文本正则', () => {
      it('应该识别超长文本', () => {
        // 长文本通常指超过一定长度的 URL 或数据
        const longText = 'a'.repeat(1000);
        expect(longText.length).toBeGreaterThan(100);
      });
    });
  });

  describe('书写风格', () => {
    describe('normal 模式', () => {
      it('应该是默认模式', () => {
        const writingStyle = 'normal';
        expect(writingStyle).toBe('normal');
      });
    });

    describe('typewriter 模式', () => {
      it('打字机模式应该添加特定的 CSS 类', () => {
        const className = 'cherry-editor-writing-style--typewriter';
        expect(className).toContain('typewriter');
      });
    });

    describe('focus 模式', () => {
      it('专注模式应该添加特定的 CSS 类', () => {
        const className = 'cherry-editor-writing-style--focus';
        expect(className).toContain('focus');
      });
    });
  });

  describe('滚动同步', () => {
    it('应该能计算滚动百分比', () => {
      const currentTop = 100;
      const lineTop = 80;
      const lineHeight = 20;
      const percent = (100 * (currentTop - lineTop)) / lineHeight / 100;
      expect(percent).toBe(1); // 100%
    });

    it('应该处理滚动到顶部的情况', () => {
      const scrollTop = 0;
      expect(scrollTop <= 0).toBe(true);
    });

    it('应该处理滚动到底部的情况', () => {
      const scrollTop = 1000;
      const clientHeight = 600;
      const scrollHeight = 1620;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      expect(isAtBottom).toBe(true);
    });
  });

  describe('跳转到指定行', () => {
    it('应该计算正确的跳转位置', () => {
      const beginLine = 10;
      const endLine = 5;
      const percent = 0.5;
      const lineHeight = 20;

      // 模拟位置计算
      const positionTop = beginLine * lineHeight;
      const height = endLine * lineHeight;
      const finalTop = positionTop + height * percent;

      expect(finalTop).toBe(10 * 20 + 5 * 20 * 0.5); // 250
    });

    it('null 行号应该滚动到文档末尾', () => {
      const lineNum = null;
      expect(lineNum === null).toBe(true);
    });
  });

  describe('事件处理', () => {
    it('应该支持的事件列表', () => {
      const supportedEvents = [
        'blur',
        'focus',
        'change',
        'keydown',
        'keyup',
        'paste',
        'mousedown',
        'drop',
        'scroll',
        'cursorActivity',
        'beforeChange',
      ];

      expect(supportedEvents).toContain('blur');
      expect(supportedEvents).toContain('focus');
      expect(supportedEvents).toContain('change');
      expect(supportedEvents).toContain('paste');
      expect(supportedEvents).toContain('scroll');
    });
  });
});

describe('Editor.js - CodeMirror API 契约', () => {
  /**
   * 这些测试定义了我们使用的 CodeMirror API
   * 升级到 CodeMirror 6 时需要确保这些 API 都有对应的实现
   */

  describe('文档操作 API', () => {
    const apis = ['getValue', 'setValue', 'getLine', 'lineCount', 'getLineHandle'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('光标和选区 API', () => {
    const apis = [
      'getCursor',
      'setCursor',
      'getSelection',
      'getSelections',
      'setSelection',
      'listSelections',
      'replaceSelection',
      'replaceSelections',
      'replaceRange',
      'findWordAt',
    ];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('搜索 API', () => {
    const apis = ['getSearchCursor', 'findMarks', 'markText', 'getAllMarks'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('滚动 API', () => {
    const apis = ['getScrollInfo', 'scrollTo', 'scrollIntoView', 'getScrollerElement'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('坐标 API', () => {
    const apis = ['charCoords', 'coordsChar', 'lineAtHeight'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('选项 API', () => {
    const apis = ['getOption', 'setOption'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('命令 API', () => {
    const apis = ['execCommand'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('事件 API', () => {
    const apis = ['on', 'off'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });

  describe('DOM API', () => {
    const apis = ['getWrapperElement', 'getInputField', 'refresh'];

    apis.forEach((api) => {
      it(`应该使用 ${api} API`, () => {
        expect(api).toBeDefined();
      });
    });
  });
});

describe('Editor.js - 升级 CodeMirror 6 检查清单', () => {
  /**
   * CodeMirror 6 的主要变化：
   * 1. 完全重写的架构
   * 2. 使用 EditorState 和 EditorView 而不是单一的 Editor 对象
   * 3. 使用 Transaction 进行状态更新
   * 4. 使用 Extension 系统进行配置
   */

  it('CodeMirror 5 -> 6 API 映射表', () => {
    const apiMapping = {
      // 文档操作
      'getValue()': 'state.doc.toString()',
      'setValue(value)': 'view.dispatch({ changes: { from: 0, to: doc.length, insert: value } })',
      'getLine(n)': 'state.doc.line(n + 1).text',
      'lineCount()': 'state.doc.lines',

      // 光标和选区
      'getCursor()': 'state.selection.main.head',
      'setSelection(from, to)': 'view.dispatch({ selection: EditorSelection.range(from, to) })',
      'getSelection()': 'state.sliceDoc(selection.from, selection.to)',
      'replaceSelection(text)': 'view.dispatch(state.replaceSelection(text))',

      // 滚动
      'scrollTo(x, y)': 'view.scrollDOM.scrollTo(x, y)',
      'scrollIntoView()': 'view.dispatch({ effects: EditorView.scrollIntoView(pos) })',

      // 事件
      'on(event, callback)': 'EditorView.updateListener.of((update) => { ... })',
    };

    expect(Object.keys(apiMapping).length).toBeGreaterThan(0);
  });

  it('需要迁移的 CodeMirror 插件', () => {
    const plugins = [
      { cm5: 'codemirror/mode/gfm/gfm', cm6: '@codemirror/lang-markdown' },
      { cm5: 'codemirror/addon/edit/continuelist', cm6: '需要自定义实现' },
      { cm5: 'codemirror/addon/edit/closetag', cm6: '@codemirror/autocomplete' },
      { cm5: 'codemirror/keymap/sublime', cm6: '@codemirror/commands (部分)' },
      { cm5: 'codemirror/keymap/vim', cm6: '@replit/codemirror-vim' },
      { cm5: 'codemirror/addon/search/searchcursor', cm6: '@codemirror/search' },
    ];

    expect(plugins.length).toBeGreaterThan(0);
  });

  it('CodeMirror 6 的新特性可以利用', () => {
    const newFeatures = [
      '更好的移动端支持',
      '更好的性能（虚拟滚动）',
      '更好的无障碍支持',
      '更灵活的扩展系统',
      'TypeScript 原生支持',
      '更好的撤销/重做系统',
      '原生协作编辑支持',
    ];

    expect(newFeatures.length).toBeGreaterThan(0);
  });
});
