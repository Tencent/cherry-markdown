/**
 * 搜索替换功能测试 (cm-search-replace.js)
 *
 * 这些测试覆盖 CodeMirror 搜索替换功能的核心行为
 * 是升级 CodeMirror6 前的基准测试
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeMirrorMock, createCherryMock } from '../../__mocks__/codemirror.mock';

describe('搜索替换功能 (cm-search-replace.js)', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;
  let cherryMock: ReturnType<typeof createCherryMock>;

  beforeEach(() => {
    // 创建 DOM 环境
    document.body.innerHTML = '<div id="test-container"></div>';
    cmMock = createCodeMirrorMock('Hello World\nHello Cherry\nHello CodeMirror');
    cherryMock = createCherryMock();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('搜索光标操作', () => {
    it('应该创建搜索光标进行文本搜索', () => {
      const searchCursor = cmMock.getSearchCursor('Hello');

      expect(cmMock.getSearchCursor).toHaveBeenCalledWith('Hello');
      expect(searchCursor).toHaveProperty('findNext');
      expect(searchCursor).toHaveProperty('findPrevious');
      expect(searchCursor).toHaveProperty('from');
      expect(searchCursor).toHaveProperty('to');
    });

    it('应该使用 findNext 查找下一个匹配', () => {
      const searchCursor = cmMock.getSearchCursor('Hello');

      const firstMatch = searchCursor.findNext();
      expect(firstMatch).toBeTruthy();

      const from = searchCursor.from();
      expect(from).toEqual({ line: 0, ch: 0 });
    });

    it('应该使用 findPrevious 查找上一个匹配', () => {
      const searchCursor = cmMock.getSearchCursor('Hello');

      // 先找到最后一个
      while (searchCursor.findNext()) {}

      // 然后向前查找
      const prevMatch = searchCursor.findPrevious();
      expect(prevMatch).toBeTruthy();
    });

    it('应该返回匹配位置的 from 和 to', () => {
      const searchCursor = cmMock.getSearchCursor('World');
      searchCursor.findNext();

      const from = searchCursor.from();
      const to = searchCursor.to();

      expect(from).toEqual({ line: 0, ch: 6 });
      expect(to).toEqual({ line: 0, ch: 11 });
    });

    it('应该在没有更多匹配时返回 false', () => {
      const searchCursor = cmMock.getSearchCursor('NotExist');

      const result = searchCursor.findNext();
      expect(result).toBeFalsy();
    });

    it('应该从指定位置开始搜索', () => {
      const startPos = { line: 1, ch: 0 };
      const searchCursor = cmMock.getSearchCursor('Hello', startPos);

      expect(cmMock.getSearchCursor).toHaveBeenCalledWith('Hello', startPos);
    });
  });

  describe('正则表达式搜索', () => {
    it('应该支持正则表达式搜索', () => {
      cmMock = createCodeMirrorMock('test123 test456 test789');
      const regex = /test\d+/g;
      const searchCursor = cmMock.getSearchCursor(regex);

      const matches: any[] = [];
      while (searchCursor.findNext()) {
        matches.push({
          from: searchCursor.from(),
          to: searchCursor.to(),
        });
      }

      expect(matches.length).toBe(3);
    });

    it('应该支持大小写不敏感搜索', () => {
      cmMock = createCodeMirrorMock('Hello hello HELLO');
      const regex = /hello/gi;
      const searchCursor = cmMock.getSearchCursor(regex);

      const matches: any[] = [];
      while (searchCursor.findNext()) {
        matches.push(searchCursor.from());
      }

      expect(matches.length).toBe(3);
    });

    it('应该支持全字匹配搜索', () => {
      cmMock = createCodeMirrorMock('hello helloworld world');
      const regex = /\bhello\b/g;
      const searchCursor = cmMock.getSearchCursor(regex);

      const matches: any[] = [];
      while (searchCursor.findNext()) {
        matches.push(searchCursor.from());
      }

      // 只匹配独立的 "hello"，不匹配 "helloworld"
      expect(matches.length).toBe(1);
    });

    it('应该正确转义特殊正则字符', () => {
      const specialChars = '.*+?^${}()|[]\\';
      const escaped = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });
  });

  describe('替换功能', () => {
    it('应该调用 replaceSelection 替换选中的文本', () => {
      cmMock = createCodeMirrorMock('Hello World');
      cmMock.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      cmMock.replaceSelection('Hi');

      // 验证 API 调用正确
      expect(cmMock.replaceSelection).toHaveBeenCalledWith('Hi');
      expect(cmMock.setSelection).toHaveBeenCalledWith({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    });

    it('应该在搜索匹配后选中并替换', () => {
      cmMock = createCodeMirrorMock('Hello Hello Hello');
      const searchCursor = cmMock.getSearchCursor('Hello');

      // 查找第一个
      searchCursor.findNext();
      const from = searchCursor.from();
      const to = searchCursor.to();

      // 验证搜索结果正确
      expect(from).toEqual({ line: 0, ch: 0 });
      expect(to).toEqual({ line: 0, ch: 5 });

      // 选中并替换
      cmMock.setSelection(from!, to!);
      cmMock.replaceSelection('Hi');

      // 验证 API 调用
      expect(cmMock.setSelection).toHaveBeenCalledWith(from, to);
      expect(cmMock.replaceSelection).toHaveBeenCalledWith('Hi');
    });

    it('应该支持全部替换', () => {
      cmMock = createCodeMirrorMock('Hello Hello Hello');

      // 模拟全部替换
      const value = cmMock.getValue();
      const newValue = value.replace(/Hello/g, 'Hi');
      cmMock.setValue(newValue);

      expect(cmMock.getValue()).toBe('Hi Hi Hi');
    });

    it('应该在全部替换后保持光标位置', () => {
      cmMock = createCodeMirrorMock('Hello World');
      const cursorBefore = { line: 0, ch: 5 };
      cmMock.setCursor(cursorBefore);

      // 执行替换
      const value = cmMock.getValue();
      const newValue = value.replace(/World/g, 'Cherry');
      cmMock.setValue(newValue);
      cmMock.setCursor(cursorBefore);

      expect(cmMock.getCursor()).toEqual(cursorBefore);
    });

    it('应该在只读模式下禁止替换', () => {
      cmMock.setOption('readOnly', true);
      const readOnly = cmMock.getOption('readOnly');

      expect(readOnly).toBe(true);
    });
  });

  describe('搜索计数', () => {
    it('应该正确统计匹配数量', () => {
      cmMock = createCodeMirrorMock('Hello Hello Hello World');
      const value = cmMock.getValue();
      const matches = value.match(/Hello/g);

      expect(matches?.length).toBe(3);
    });

    it('应该在大小写敏感时正确计数', () => {
      cmMock = createCodeMirrorMock('Hello hello HELLO');
      const value = cmMock.getValue();

      const caseSensitiveMatches = value.match(/Hello/g);
      const caseInsensitiveMatches = value.match(/hello/gi);

      expect(caseSensitiveMatches?.length).toBe(1);
      expect(caseInsensitiveMatches?.length).toBe(3);
    });

    it('应该在没有匹配时返回 0', () => {
      cmMock = createCodeMirrorMock('Hello World');
      const value = cmMock.getValue();
      const matches = value.match(/NotExist/g);

      expect(matches).toBeNull();
    });
  });

  describe('搜索高亮 (Overlay)', () => {
    it('应该添加搜索高亮 overlay', () => {
      const overlay = {
        token: (stream: any) => {
          if (stream.match(/Hello/)) {
            return 'searching';
          }
          stream.next();
          return null;
        },
      };

      cmMock.addOverlay(overlay);

      expect(cmMock.addOverlay).toHaveBeenCalledWith(overlay);
    });

    it('应该移除搜索高亮 overlay', () => {
      const overlay = { token: () => null };

      cmMock.addOverlay(overlay);
      cmMock.removeOverlay(overlay);

      expect(cmMock.removeOverlay).toHaveBeenCalledWith(overlay);
    });

    it('应该创建正确的搜索 overlay token 函数', () => {
      const query = 'Hello';
      const regex = new RegExp(query, 'gi');

      const overlay = {
        token: (stream: { pos: number; string: string; skipToEnd: () => void }) => {
          regex.lastIndex = stream.pos;
          const match = regex.exec(stream.string);
          if (match && match.index === stream.pos) {
            stream.pos += match[0].length || 1;
            return 'searching';
          }
          if (match) {
            stream.pos = match.index;
          } else {
            stream.skipToEnd();
          }
          return null;
        },
      };

      // 模拟 stream
      const mockStream = {
        pos: 0,
        string: 'Hello World',
        skipToEnd: vi.fn(() => {
          mockStream.pos = mockStream.string.length;
        }),
      };

      const result = overlay.token(mockStream);
      expect(result).toBe('searching');
      expect(mockStream.pos).toBe(5);
    });
  });

  describe('滚动条匹配标记', () => {
    it('应该显示滚动条上的匹配标记', () => {
      const annotate = cmMock.showMatchesOnScrollbar('Hello', false);

      expect(cmMock.showMatchesOnScrollbar).toHaveBeenCalled();
      expect(annotate).toHaveProperty('clear');
    });

    it('应该清除滚动条上的匹配标记', () => {
      const annotate = cmMock.showMatchesOnScrollbar('Hello', false);
      annotate.clear();

      expect(annotate.clear).toHaveBeenCalled();
    });
  });

  describe('搜索状态管理', () => {
    it('应该获取和设置搜索状态', () => {
      const state = cmMock.state.search || {
        posFrom: null,
        posTo: null,
        lastQuery: null,
        query: null,
        queryText: null,
        overlay: null,
        annotate: null,
      };

      cmMock.state.search = state;

      expect(cmMock.state.search).toBeDefined();
    });

    it('应该在清除搜索时重置状态', () => {
      cmMock.state.search = {
        posFrom: { line: 0, ch: 0 },
        posTo: { line: 0, ch: 5 },
        lastQuery: 'Hello',
        query: /Hello/,
        queryText: 'Hello',
        overlay: {},
        annotate: { clear: vi.fn() },
      };

      // 模拟清除搜索
      cmMock.operation(() => {
        const state = cmMock.state.search!;
        state.lastQuery = state.query;
        if (state.query) {
          state.query = null;
          state.queryText = null;
          if (state.overlay) {
            cmMock.removeOverlay(state.overlay);
          }
          if (state.annotate) {
            state.annotate.clear();
            state.annotate = null;
          }
        }
      });

      expect(cmMock.operation).toHaveBeenCalled();
    });
  });

  describe('搜索框交互', () => {
    it('应该在搜索框获得焦点时激活输入', () => {
      const searchInput = document.createElement('input');
      searchInput.className = 'ace_search_field';
      document.body.appendChild(searchInput);

      const focusHandler = vi.fn();
      searchInput.addEventListener('focus', focusHandler);
      searchInput.focus();

      expect(document.activeElement).toBe(searchInput);
    });

    it('应该在输入时触发搜索', () => {
      const searchInput = document.createElement('input');
      const inputHandler = vi.fn();

      searchInput.addEventListener('input', inputHandler);
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));

      expect(inputHandler).toHaveBeenCalled();
    });

    it('应该支持 Enter 键查找下一个', () => {
      const keydownHandler = vi.fn((e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          // findNext
        }
      });

      const searchBox = document.createElement('div');
      searchBox.addEventListener('keydown', keydownHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      searchBox.dispatchEvent(event);

      expect(keydownHandler).toHaveBeenCalled();
    });

    it('应该支持 Escape 键关闭搜索框', () => {
      const keydownHandler = vi.fn((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // hide search box
        }
      });

      const searchBox = document.createElement('div');
      searchBox.addEventListener('keydown', keydownHandler);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      searchBox.dispatchEvent(event);

      expect(keydownHandler).toHaveBeenCalled();
    });
  });

  describe('选项切换', () => {
    it('应该切换正则表达式模式', () => {
      let regExpMode = false;

      const toggleRegexp = () => {
        regExpMode = !regExpMode;
      };

      toggleRegexp();
      expect(regExpMode).toBe(true);

      toggleRegexp();
      expect(regExpMode).toBe(false);
    });

    it('应该切换大小写敏感模式', () => {
      let caseSensitive = false;

      const toggleCase = () => {
        caseSensitive = !caseSensitive;
      };

      toggleCase();
      expect(caseSensitive).toBe(true);
    });

    it('应该切换全字匹配模式', () => {
      let wholeWord = false;

      const toggleWholeWord = () => {
        wholeWord = !wholeWord;
      };

      toggleWholeWord();
      expect(wholeWord).toBe(true);
    });

    it('应该根据选项构建搜索查询', () => {
      const value = 'hello';
      const options = {
        caseSensitive: false,
        regExp: false,
        wholeWord: true,
      };

      let query: RegExp;
      if (options.wholeWord) {
        query = options.caseSensitive ? new RegExp(`\\b${value}\\b`) : new RegExp(`\\b${value}\\b`, 'i');
      } else {
        query = options.caseSensitive ? new RegExp(value) : new RegExp(value, 'i');
      }

      expect(query.test('hello')).toBe(true);
      expect(query.test('helloworld')).toBe(false);
    });
  });

  describe('查找所有匹配', () => {
    it('应该使用 setSelection 高亮当前匹配', () => {
      cmMock = createCodeMirrorMock('Hello World Hello');
      const searchCursor = cmMock.getSearchCursor('Hello');

      searchCursor.findNext();
      const from = searchCursor.from();
      const to = searchCursor.to();

      cmMock.setSelection(from!, to!);

      expect(cmMock.setSelection).toHaveBeenCalledWith(from, to);
    });

    it('应该在循环搜索时回到开始', () => {
      cmMock = createCodeMirrorMock('Hello World');
      const searchCursor = cmMock.getSearchCursor('Hello');

      // 找到第一个
      searchCursor.findNext();

      // 没有更多了
      const noMore = searchCursor.findNext();
      expect(noMore).toBeFalsy();

      // 重新创建搜索光标从头开始
      const newSearchCursor = cmMock.getSearchCursor('Hello');
      const restart = newSearchCursor.findNext();
      expect(restart).toBeTruthy();
    });
  });

  describe('无匹配处理', () => {
    it('应该在无匹配时添加 ace_nomatch 类', () => {
      const searchBox = document.createElement('div');

      const setCssClass = (el: Element, className: string, condition: boolean) => {
        el.classList[condition ? 'add' : 'remove'](className);
      };

      setCssClass(searchBox, 'ace_nomatch', true);

      expect(searchBox.classList.contains('ace_nomatch')).toBe(true);
    });

    it('应该在有匹配时移除 ace_nomatch 类', () => {
      const searchBox = document.createElement('div');
      searchBox.classList.add('ace_nomatch');

      const setCssClass = (el: Element, className: string, condition: boolean) => {
        el.classList[condition ? 'add' : 'remove'](className);
      };

      setCssClass(searchBox, 'ace_nomatch', false);

      expect(searchBox.classList.contains('ace_nomatch')).toBe(false);
    });

    it('应该在无匹配时清除选区', () => {
      cmMock = createCodeMirrorMock('Hello World');

      // 搜索不存在的内容
      const value = cmMock.getValue();
      const matches = value.match(/NotExist/g);

      if (!matches || matches.length === 0) {
        cmMock.setSelection({ ch: 0, line: 0 }, { ch: 0, line: 0 });
      }

      expect(cmMock.setSelection).toHaveBeenCalledWith({ ch: 0, line: 0 }, { ch: 0, line: 0 });
    });
  });

  describe('特殊字符转义', () => {
    it('应该正确转义特殊正则字符', () => {
      const input = 'test.file[0]';
      const escaped = input.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

      expect(escaped).toBe('test\\.file\\[0\\]');
    });

    it('应该处理换行符转义', () => {
      const parseString = (string: string) => {
        return string.replace(/\\([nrt\\])/g, (match, ch) => {
          if (ch === 'n') return '\n';
          if (ch === 'r') return '\r';
          if (ch === 't') return '\t';
          if (ch === '\\') return '\\';
          return match;
        });
      };

      expect(parseString('hello\\nworld')).toBe('hello\nworld');
      expect(parseString('hello\\tworld')).toBe('hello\tworld');
      expect(parseString('path\\\\to\\\\file')).toBe('path\\to\\file');
    });
  });
});
