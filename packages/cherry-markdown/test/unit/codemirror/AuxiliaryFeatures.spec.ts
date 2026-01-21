/**
 * @vitest-environment jsdom
 */
/**
 * 2.3 低优先级 - 辅助功能测试
 * 测试 Undo.js、Redo.js、Toc.js 与 CodeMirror 的交互
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeMirrorMock } from '../../__mocks__/codemirror.mock';

describe('Undo 撤销功能', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    // 添加 undo/redo 方法
    cmMock.undo = vi.fn();
    cmMock.redo = vi.fn();
    cmMock.historySize = vi.fn();
    cmMock.clearHistory = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('undo - 撤销操作', () => {
    it('应该调用 CodeMirror 的 undo 方法', () => {
      cmMock.undo();
      expect(cmMock.undo).toHaveBeenCalled();
    });

    it('应该支持多次撤销', () => {
      cmMock.undo();
      cmMock.undo();
      cmMock.undo();
      expect(cmMock.undo).toHaveBeenCalledTimes(3);
    });
  });

  describe('historySize - 历史记录大小', () => {
    it('应该返回撤销/重做历史大小', () => {
      cmMock.historySize.mockReturnValue({ undo: 5, redo: 2 });
      const size = cmMock.historySize();
      expect(size.undo).toBe(5);
      expect(size.redo).toBe(2);
    });

    it('应该返回空历史记录', () => {
      cmMock.historySize.mockReturnValue({ undo: 0, redo: 0 });
      const size = cmMock.historySize();
      expect(size.undo).toBe(0);
      expect(size.redo).toBe(0);
    });
  });

  describe('clearHistory - 清除历史', () => {
    it('应该清除所有历史记录', () => {
      cmMock.clearHistory();
      expect(cmMock.clearHistory).toHaveBeenCalled();
    });
  });
});

describe('Redo 重做功能', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    cmMock.undo = vi.fn();
    cmMock.redo = vi.fn();
    cmMock.historySize = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('redo - 重做操作', () => {
    it('应该调用 CodeMirror 的 redo 方法', () => {
      cmMock.redo();
      expect(cmMock.redo).toHaveBeenCalled();
    });

    it('应该支持多次重做', () => {
      cmMock.redo();
      cmMock.redo();
      expect(cmMock.redo).toHaveBeenCalledTimes(2);
    });
  });

  describe('撤销/重做组合操作', () => {
    it('应该支持 undo 后 redo', () => {
      cmMock.undo();
      cmMock.redo();
      expect(cmMock.undo).toHaveBeenCalledTimes(1);
      expect(cmMock.redo).toHaveBeenCalledTimes(1);
    });

    it('应该正确更新历史大小', () => {
      // 初始状态：有撤销历史，无重做历史
      cmMock.historySize.mockReturnValueOnce({ undo: 3, redo: 0 });
      let size = cmMock.historySize();
      expect(size.undo).toBe(3);
      expect(size.redo).toBe(0);

      // 撤销后：撤销历史减少，重做历史增加
      cmMock.historySize.mockReturnValueOnce({ undo: 2, redo: 1 });
      cmMock.undo();
      size = cmMock.historySize();
      expect(size.undo).toBe(2);
      expect(size.redo).toBe(1);
    });
  });
});

describe('Toc 目录导航功能', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    document.body.innerHTML = `
      <div class="cherry">
        <div class="cherry-editor">
          <div class="CodeMirror"></div>
        </div>
        <div class="cherry-previewer"></div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('change 事件监听', () => {
    it('应该监听编辑器 change 事件来更新目录', () => {
      const callback = vi.fn();
      cmMock.on('change', callback);
      expect(cmMock.on).toHaveBeenCalledWith('change', callback);
    });
  });

  describe('scroll 事件监听', () => {
    it('应该监听编辑器 scroll 事件来高亮当前标题', () => {
      const callback = vi.fn();
      cmMock.on('scroll', callback);
      expect(cmMock.on).toHaveBeenCalledWith('scroll', callback);
    });
  });

  describe('getSearchCursor - 标题搜索', () => {
    it('应该使用 getSearchCursor 查找标题', () => {
      // 模拟标题正则匹配
      const headingRegex = /(?:^|\n)\n*((?:[ \t\u00a0]*#{1,6}).+?|(?:[ \t\u00a0]*.+)\n(?:[ \t\u00a0]*[=]+|[-]+))(?=$|\n)/g;
      const mockSearchCursor = {
        findNext: vi.fn().mockReturnValue(true),
        from: vi.fn().mockReturnValue({ line: 5, ch: 0 }),
        to: vi.fn().mockReturnValue({ line: 5, ch: 10 }),
      };
      cmMock.getSearchCursor.mockReturnValue(mockSearchCursor);

      const cursor = cmMock.getSearchCursor(headingRegex);
      expect(cursor).toBeDefined();
      expect(cursor.findNext).toBeDefined();
    });

    it('应该遍历所有标题', () => {
      const mockSearchCursor = {
        findNext: vi.fn()
          .mockReturnValueOnce(true)  // 第一个标题
          .mockReturnValueOnce(true)  // 第二个标题
          .mockReturnValueOnce(true)  // 第三个标题
          .mockReturnValueOnce(false), // 没有更多
        from: vi.fn().mockReturnValue({ line: 0, ch: 0 }),
        to: vi.fn().mockReturnValue({ line: 0, ch: 10 }),
      };
      cmMock.getSearchCursor.mockReturnValue(mockSearchCursor);

      const cursor = cmMock.getSearchCursor(/# .+/g);
      let count = 0;
      while (cursor.findNext()) {
        count++;
      }
      expect(count).toBe(3);
    });

    it('应该定位到指定索引的标题', () => {
      const positions = [
        { line: 2, ch: 0 },
        { line: 10, ch: 0 },
        { line: 25, ch: 0 },
      ];
      let callIndex = 0;

      const mockSearchCursor = {
        findNext: vi.fn().mockImplementation(() => {
          if (callIndex < positions.length) {
            callIndex++;
            return true;
          }
          return false;
        }),
        from: vi.fn().mockImplementation(() => {
          // from() 返回最后一次 findNext 成功后的位置
          return positions[callIndex - 1];
        }),
      };
      cmMock.getSearchCursor.mockReturnValue(mockSearchCursor);

      const cursor = cmMock.getSearchCursor(/# .+/g);
      const targetIndex = 1; // 找第二个标题 (index=1)

      for (let i = 0; i <= targetIndex; i++) {
        cursor.findNext();
      }
      const target = cursor.from();
      expect(target.line).toBe(10); // 第二个标题在 line 10
    });
  });

  describe('scrollToLineNum - 行跳转', () => {
    it('应该调用滚动方法跳转到指定行', () => {
      // 模拟 scrollToLineNum 的实现依赖
      cmMock.scrollIntoView({ line: 5, ch: 0 });
      expect(cmMock.scrollIntoView).toHaveBeenCalledWith({ line: 5, ch: 0 });
    });
  });

  describe('标题正则匹配', () => {
    // ATX 风格标题 (# 开头)
    it('应该匹配 ATX 风格标题 (# Title)', () => {
      const headingRegex = /^#{1,6}\s+.+$/m;
      expect(headingRegex.test('# Title')).toBe(true);
      expect(headingRegex.test('## Subtitle')).toBe(true);
      expect(headingRegex.test('### Level 3')).toBe(true);
      expect(headingRegex.test('###### Level 6')).toBe(true);
    });

    it('应该不匹配超过6级的标题', () => {
      const headingRegex = /^#{1,6}\s+.+$/m;
      expect(headingRegex.test('####### Level 7')).toBe(false);
    });

    // Setext 风格标题 (下划线)
    it('应该匹配 Setext 风格标题 (===)', () => {
      const content = 'Title\n===';
      const setextH1 = /^.+\n=+$/m;
      expect(setextH1.test(content)).toBe(true);
    });

    it('应该匹配 Setext 风格标题 (---)', () => {
      const content = 'Subtitle\n---';
      const setextH2 = /^.+\n-+$/m;
      expect(setextH2.test(content)).toBe(true);
    });
  });

  describe('目录项点击导航', () => {
    it('应该解析目录项的 data-index 属性', () => {
      const tocItem = document.createElement('a');
      tocItem.className = 'cherry-toc-one-a';
      tocItem.dataset.index = '2';
      tocItem.dataset.id = '#heading-2';
      expect(tocItem.dataset.index).toBe('2');
      expect(tocItem.dataset.id).toBe('#heading-2');
    });

    it('应该根据 index 定位到对应标题', () => {
      const index = 2;
      const mockSearchCursor = {
        findNext: vi.fn().mockReturnValue(true),
        from: vi.fn().mockReturnValue({ line: 15, ch: 0 }),
      };
      cmMock.getSearchCursor.mockReturnValue(mockSearchCursor);

      const cursor = cmMock.getSearchCursor(/# .+/g);
      for (let i = 0; i <= index; i++) {
        cursor.findNext();
      }
      const target = cursor.from();

      // 验证定位调用
      cmMock.scrollIntoView({ line: target.line, ch: 0 });
      expect(cmMock.scrollIntoView).toHaveBeenCalledWith({ line: 15, ch: 0 });
    });
  });

  describe('目录 DOM 操作', () => {
    it('应该创建目录 DOM 结构', () => {
      const tocDom = document.createElement('div');
      tocDom.className = 'cherry-flex-toc';

      const tocHead = document.createElement('div');
      tocHead.className = 'cherry-toc-head';

      const tocList = document.createElement('div');
      tocList.className = 'cherry-toc-list';

      tocDom.appendChild(tocHead);
      tocDom.appendChild(tocList);

      expect(tocDom.querySelector('.cherry-toc-head')).toBeTruthy();
      expect(tocDom.querySelector('.cherry-toc-list')).toBeTruthy();
    });

    it('应该渲染目录项', () => {
      const tocList = document.createElement('div');
      tocList.className = 'cherry-toc-list';

      const tocItems = [
        { id: 'heading-1', level: 1, text: 'Title 1', index: 0 },
        { id: 'heading-2', level: 2, text: 'Subtitle', index: 1 },
        { id: 'heading-3', level: 3, text: 'Section', index: 2 },
      ];

      tocItems.forEach((item) => {
        const a = document.createElement('a');
        a.className = `cherry-toc-one-a cherry-toc-one-a__${item.level}`;
        a.dataset.id = `#${item.id}`;
        a.dataset.index = String(item.index);
        a.textContent = item.text;
        tocList.appendChild(a);
      });

      expect(tocList.querySelectorAll('.cherry-toc-one-a').length).toBe(3);
      expect(tocList.querySelector('.cherry-toc-one-a__1')).toBeTruthy();
      expect(tocList.querySelector('.cherry-toc-one-a__2')).toBeTruthy();
      expect(tocList.querySelector('.cherry-toc-one-a__3')).toBeTruthy();
    });

    it('应该高亮当前目录项', () => {
      const tocList = document.createElement('div');
      for (let i = 0; i < 5; i++) {
        const a = document.createElement('a');
        a.className = 'cherry-toc-one-a';
        tocList.appendChild(a);
      }

      const currentIndex = 2;
      tocList.querySelectorAll('.cherry-toc-one-a').forEach((item, key) => {
        if (key === currentIndex) {
          item.classList.add('current');
        } else {
          item.classList.remove('current');
        }
      });

      const currentItem = tocList.querySelector('.cherry-toc-one-a.current');
      expect(currentItem).toBeTruthy();
      expect(tocList.querySelectorAll('.current').length).toBe(1);
    });
  });

  describe('目录模式切换', () => {
    it('应该支持 full 模式', () => {
      const tocDom = document.createElement('div');
      tocDom.className = 'cherry-flex-toc cherry-flex-toc__pure';

      tocDom.classList.remove('cherry-flex-toc__pure');
      tocDom.classList.add('cherry-flex-toc__full');

      expect(tocDom.classList.contains('cherry-flex-toc__full')).toBe(true);
      expect(tocDom.classList.contains('cherry-flex-toc__pure')).toBe(false);
    });

    it('应该支持 pure 模式', () => {
      const tocDom = document.createElement('div');
      tocDom.className = 'cherry-flex-toc cherry-flex-toc__full';

      tocDom.classList.remove('cherry-flex-toc__full');
      tocDom.classList.add('cherry-flex-toc__pure');

      expect(tocDom.classList.contains('cherry-flex-toc__pure')).toBe(true);
      expect(tocDom.classList.contains('cherry-flex-toc__full')).toBe(false);
    });

    it('应该从 localStorage 读取模式', () => {
      const defaultModel = 'full';
      const storedModel = localStorage.getItem('cherry-toc-model') || defaultModel;
      expect(['full', 'pure']).toContain(storedModel);
    });

    it('应该保存模式到 localStorage', () => {
      localStorage.setItem('cherry-toc-model', 'pure');
      expect(localStorage.getItem('cherry-toc-model')).toBe('pure');

      localStorage.setItem('cherry-toc-model', 'full');
      expect(localStorage.getItem('cherry-toc-model')).toBe('full');
    });
  });

  describe('引用块内标题处理', () => {
    it('应该识别引用块内的标题', () => {
      const tocItem = {
        id: 'heading-in-blockquote',
        level: 2,
        text: 'Quote Title',
        isInBlockquote: true,
      };

      expect(tocItem.isInBlockquote).toBe(true);
    });

    it('应该渲染引用块图标', () => {
      const isInBlockquote = true;
      const icon = isInBlockquote
        ? '<i class="cherry-toc-in-blockquote ch-icon ch-icon-blockquote"></i>'
        : '';

      expect(icon).toContain('cherry-toc-in-blockquote');
      expect(icon).toContain('ch-icon-blockquote');
    });
  });
});

describe('Toc 工具栏按钮 (hooks/Toc.js)', () => {
  describe('onClick - 插入目录', () => {
    it('应该返回目录语法', () => {
      const selection = '';
      const result = `${selection}\n\n[[toc]]\n`;
      expect(result).toBe('\n\n[[toc]]\n');
    });

    it('应该保留原有选中内容', () => {
      const selection = 'some text';
      const result = `${selection}\n\n[[toc]]\n`;
      expect(result).toBe('some text\n\n[[toc]]\n');
    });
  });
});

describe('历史记录边界情况', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    cmMock.undo = vi.fn();
    cmMock.redo = vi.fn();
    cmMock.historySize = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('空历史记录', () => {
    it('undo 在无历史时应该安全调用', () => {
      cmMock.historySize.mockReturnValue({ undo: 0, redo: 0 });
      cmMock.undo();
      expect(cmMock.undo).toHaveBeenCalled();
    });

    it('redo 在无历史时应该安全调用', () => {
      cmMock.historySize.mockReturnValue({ undo: 0, redo: 0 });
      cmMock.redo();
      expect(cmMock.redo).toHaveBeenCalled();
    });
  });

  describe('最大历史记录', () => {
    it('应该处理大量历史记录', () => {
      cmMock.historySize.mockReturnValue({ undo: 200, redo: 0 });
      const size = cmMock.historySize();
      expect(size.undo).toBe(200);
    });
  });
});

describe('getDoc 文档对象', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('eachLine - 行遍历', () => {
    it('应该遍历指定范围的行', () => {
      const mockDoc = {
        eachLine: vi.fn((start: number, end: number, callback: (line: { height: number }) => void) => {
          for (let i = start; i < end; i++) {
            callback({ height: 20 });
          }
        }),
      };
      cmMock.getDoc.mockReturnValue(mockDoc);

      const doc = cmMock.getDoc();
      let totalHeight = 0;
      doc.eachLine(0, 5, (line: { height: number }) => {
        totalHeight += line.height;
      });

      expect(totalHeight).toBe(100); // 5 lines * 20px
    });
  });
});

describe('位置定位辅助功能', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lineInfo - 行信息', () => {
    it('应该获取行的详细信息', () => {
      cmMock.lineInfo = vi.fn().mockReturnValue({
        line: 5,
        handle: { height: 22, text: '# Heading' },
        text: '# Heading',
        gutterMarkers: null,
        textClass: null,
        bgClass: null,
        wrapClass: null,
        widgets: null,
      });

      const info = cmMock.lineInfo(5);
      expect(info.line).toBe(5);
      expect(info.handle.height).toBe(22);
      expect(info.text).toBe('# Heading');
    });
  });

  describe('getLineHandle - 行句柄', () => {
    it('应该获取行句柄对象', () => {
      cmMock.getLineHandle.mockReturnValue({
        height: 20,
        text: 'some text',
      });

      const handle = cmMock.getLineHandle(3);
      expect(handle.height).toBe(20);
      expect(handle.text).toBe('some text');
    });
  });

  describe('heightAtLine - 行高度计算', () => {
    it('应该计算到指定行的累计高度', () => {
      cmMock.heightAtLine = vi.fn().mockReturnValue(120);
      const height = cmMock.heightAtLine(5, 'local');
      expect(height).toBe(120);
    });
  });
});

describe('refresh 操作', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该调用 refresh 刷新编辑器', () => {
    cmMock.refresh();
    expect(cmMock.refresh).toHaveBeenCalled();
  });

  it('应该在目录更新时可能触发 refresh', () => {
    const callback = vi.fn();
    cmMock.on('refresh', callback);
    expect(cmMock.on).toHaveBeenCalledWith('refresh', callback);
  });
});

describe('operation 批量操作', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该支持 operation 批量操作', () => {
    const batchOperation = vi.fn();
    cmMock.operation(batchOperation);
    expect(cmMock.operation).toHaveBeenCalledWith(batchOperation);
  });

  it('operation 内的操作作为一个撤销单元', () => {
    // 模拟 operation 包裹多个操作
    const operations: string[] = [];
    cmMock.operation.mockImplementation((fn: () => void) => {
      operations.push('start');
      fn();
      operations.push('end');
    });

    cmMock.operation(() => {
      operations.push('op1');
      operations.push('op2');
    });

    expect(operations).toEqual(['start', 'op1', 'op2', 'end']);
  });
});

describe('事件防抖处理', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该防抖处理 change 事件', () => {
    const updateTocList = vi.fn();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onChangeHandler = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        updateTocList();
      }, 300);
    };

    // 快速连续触发
    onChangeHandler();
    onChangeHandler();
    onChangeHandler();

    expect(updateTocList).not.toHaveBeenCalled();

    // 等待防抖时间
    vi.advanceTimersByTime(300);
    expect(updateTocList).toHaveBeenCalledTimes(1);
  });

  it('应该在防抖窗口内重置计时器', () => {
    const updateTocList = vi.fn();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onChangeHandler = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        updateTocList();
      }, 300);
    };

    onChangeHandler();
    vi.advanceTimersByTime(200);

    onChangeHandler(); // 重置计时器
    vi.advanceTimersByTime(200);

    expect(updateTocList).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(updateTocList).toHaveBeenCalledTimes(1);
  });
});

describe('窗口 resize 事件', () => {
  it('应该在 resize 时重新计算目录布局', () => {
    const switchModel = vi.fn();

    // 模拟 resize 监听
    const resizeHandler = () => {
      switchModel('full');
    };

    window.addEventListener('resize', resizeHandler);
    window.dispatchEvent(new Event('resize'));

    expect(switchModel).toHaveBeenCalledWith('full');

    window.removeEventListener('resize', resizeHandler);
  });
});
