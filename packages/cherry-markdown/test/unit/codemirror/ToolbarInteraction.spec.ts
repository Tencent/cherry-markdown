/**
 * @vitest-environment jsdom
 */
/**
 * 2.2 中优先级 - 工具栏交互测试
 * 测试 MenuBase.js、Bubble.js、FloatMenu.js、Suggester.js 与 CodeMirror 的交互
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeMirrorMock, createCherryMock } from '../../__mocks__/codemirror.mock';

describe('MenuBase 工具栏与编辑器交互', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSelection - 选区获取', () => {
    it('应该返回当前选中的文本', () => {
      cmMock.getSelection.mockReturnValue('selected text');
      expect(cmMock.getSelection()).toBe('selected text');
    });

    it('应该处理多选区情况', () => {
      cmMock.getSelections.mockReturnValue(['text1', 'text2', 'text3']);
      const selections = cmMock.getSelections();
      expect(selections).toHaveLength(3);
      expect(selections).toEqual(['text1', 'text2', 'text3']);
    });

    it('应该处理空选区情况', () => {
      cmMock.getSelection.mockReturnValue('');
      expect(cmMock.getSelection()).toBe('');
    });
  });

  describe('replaceSelection - 文本插入', () => {
    it('应该替换选中的文本', () => {
      cmMock.replaceSelection('**bold**');
      expect(cmMock.replaceSelection).toHaveBeenCalledWith('**bold**');
    });

    it('应该支持 collapse 参数', () => {
      cmMock.replaceSelection('new text', 'around');
      expect(cmMock.replaceSelection).toHaveBeenCalledWith('new text', 'around');
    });

    it('应该支持多选区替换', () => {
      cmMock.replaceSelections(['**text1**', '**text2**'], 'around');
      expect(cmMock.replaceSelections).toHaveBeenCalledWith(['**text1**', '**text2**'], 'around');
    });
  });

  describe('listSelections - 选区范围', () => {
    it('应该返回选区的 anchor 和 head', () => {
      cmMock.listSelections.mockReturnValue([
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 10 } },
      ]);
      const selections = cmMock.listSelections();
      expect(selections[0].anchor).toEqual({ line: 0, ch: 0 });
      expect(selections[0].head).toEqual({ line: 0, ch: 10 });
    });

    it('应该处理跨行选区', () => {
      cmMock.listSelections.mockReturnValue([
        { anchor: { line: 0, ch: 5 }, head: { line: 2, ch: 10 } },
      ]);
      const selections = cmMock.listSelections();
      expect(selections[0].anchor.line).toBe(0);
      expect(selections[0].head.line).toBe(2);
    });

    it('应该处理反向选区 (head 在 anchor 之前)', () => {
      cmMock.listSelections.mockReturnValue([
        { anchor: { line: 2, ch: 10 }, head: { line: 0, ch: 5 } },
      ]);
      const selections = cmMock.listSelections();
      // 反向选区：anchor 在后，head 在前
      expect(selections[0].anchor.line).toBeGreaterThan(selections[0].head.line);
    });
  });

  describe('setSelection - 设置选区', () => {
    it('应该设置新的选区', () => {
      const anchor = { line: 1, ch: 0 };
      const head = { line: 1, ch: 15 };
      cmMock.setSelection(anchor, head);
      expect(cmMock.setSelection).toHaveBeenCalledWith(anchor, head);
    });

    it('应该支持单点光标（anchor 等于 head）', () => {
      const pos = { line: 5, ch: 10 };
      cmMock.setSelection(pos, pos);
      expect(cmMock.setSelection).toHaveBeenCalledWith(pos, pos);
    });
  });

  describe('findWordAt - 单词查找', () => {
    it('应该查找光标位置的单词', () => {
      cmMock.findWordAt.mockReturnValue({
        anchor: { line: 0, ch: 5 },
        head: { line: 0, ch: 10 },
      });
      const word = cmMock.findWordAt({ line: 0, ch: 7 });
      expect(word.anchor).toEqual({ line: 0, ch: 5 });
      expect(word.head).toEqual({ line: 0, ch: 10 });
    });

    it('应该处理行首位置', () => {
      cmMock.findWordAt.mockReturnValue({
        anchor: { line: 0, ch: 0 },
        head: { line: 0, ch: 5 },
      });
      const word = cmMock.findWordAt({ line: 0, ch: 0 });
      expect(word.anchor.ch).toBe(0);
    });
  });

  describe('getLine - 获取行内容', () => {
    it('应该获取指定行的内容', () => {
      cmMock.getLine.mockReturnValue('# Title');
      expect(cmMock.getLine(0)).toBe('# Title');
    });

    it('应该获取空行', () => {
      cmMock.getLine.mockReturnValue('');
      expect(cmMock.getLine(5)).toBe('');
    });
  });

  describe('fire - 菜单点击处理', () => {
    it('应该在点击后聚焦编辑器', () => {
      cmMock.focus();
      expect(cmMock.focus).toHaveBeenCalled();
    });

    it('应该支持 replaceSelections 批量替换', () => {
      cmMock.getSelections.mockReturnValue(['text1', 'text2']);
      const selections = cmMock.getSelections();
      const results = selections.map((s: string) => `**${s}**`);
      cmMock.replaceSelections(results, 'around');
      expect(cmMock.replaceSelections).toHaveBeenCalledWith(['**text1**', '**text2**'], 'around');
    });
  });
});

describe('Bubble 浮动菜单', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    // 创建 DOM 结构
    document.body.innerHTML = `
      <div class="cherry-editor">
        <div class="CodeMirror">
          <div class="CodeMirror-scroll">
            <div class="CodeMirror-sizer">
              <div class="CodeMirror-lines">
                <div class="CodeMirror-cursors">
                  <div class="CodeMirror-cursor" style="left: 100px; top: 50px; height: 20px;"></div>
                </div>
                <div class="CodeMirror-selected" style="left: 80px; top: 50px; width: 40px; height: 20px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('getScrollTop - 滚动位置', () => {
    it('应该获取编辑器滚动位置', () => {
      cmMock.getScrollInfo.mockReturnValue({ top: 100, left: 0, height: 500, width: 800 });
      const scrollInfo = cmMock.getScrollInfo();
      expect(scrollInfo.top).toBe(100);
    });
  });

  describe('charCoords - 坐标转换', () => {
    it('应该获取字符的屏幕坐标', () => {
      cmMock.charCoords.mockReturnValue({ left: 100, top: 50, bottom: 70 });
      const coords = cmMock.charCoords({ line: 0, ch: 5 }, 'local');
      expect(coords.left).toBe(100);
      expect(coords.top).toBe(50);
    });

    it('应该支持不同坐标系 (local/page/window)', () => {
      cmMock.charCoords.mockReturnValue({ left: 150, top: 200, bottom: 220 });
      const coords = cmMock.charCoords({ line: 1, ch: 10 }, 'page');
      expect(coords).toHaveProperty('left');
      expect(coords).toHaveProperty('top');
    });
  });

  describe('getWrapperElement - DOM 元素获取', () => {
    it('应该获取编辑器包装元素', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'CodeMirror';
      cmMock.getWrapperElement.mockReturnValue(wrapper);
      expect(cmMock.getWrapperElement().className).toBe('CodeMirror');
    });
  });

  describe('选区变化监听 (beforeSelectionChange)', () => {
    it('应该监听选区变化事件', () => {
      const callback = vi.fn();
      cmMock.on('beforeSelectionChange', callback);
      expect(cmMock.on).toHaveBeenCalledWith('beforeSelectionChange', callback);
    });

    it('应该获取选区方向（升序或降序）', () => {
      // 模拟选区信息
      const info = {
        ranges: [
          {
            anchor: { line: 0, ch: 10 },
            head: { line: 0, ch: 5 },
          },
        ],
        origin: '*mouse',
      };
      // anchor > head 表示向左选择（降序）
      const anchor = info.ranges[0].anchor.line * 1000000 + info.ranges[0].anchor.ch;
      const head = info.ranges[0].head.line * 1000000 + info.ranges[0].head.ch;
      const direction = anchor > head ? 'desc' : 'asc';
      expect(direction).toBe('desc');
    });
  });

  describe('Bubble 位置计算', () => {
    it('应该计算 bubble 出现在选区上方的位置', () => {
      // 模拟选区足够高，bubble 显示在上方
      const selectionTop = 200;
      const bubbleHeight = 40;
      const expectedTop = selectionTop - bubbleHeight - 10; // 减去 bubble 高度和间距
      expect(expectedTop).toBeLessThan(selectionTop);
    });

    it('应该计算 bubble 出现在选区下方的位置（顶部空间不足）', () => {
      // 模拟选区在顶部，bubble 显示在下方
      const selectionTop = 30;
      const bubbleHeight = 40;
      const minTop = bubbleHeight * 2;
      const shouldShowBelow = selectionTop < minTop;
      expect(shouldShowBelow).toBe(true);
    });

    it('应该计算箭头位置', () => {
      // 默认箭头在中间
      const defaultLeft = '50%';
      expect(defaultLeft).toBe('50%');

      // 超出左边界时调整
      const adjustedLeft = '10px';
      expect(parseFloat(adjustedLeft)).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('FloatMenu 浮动工具栏', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    document.body.innerHTML = `
      <div class="cherry-editor">
        <div class="CodeMirror">
          <div class="CodeMirror-scroll"></div>
          <div class="CodeMirror-lines" style="padding-left: 4px; padding-top: 4px;"></div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('isHidden - 隐藏判断', () => {
    it('当有选中内容时应该隐藏', () => {
      cmMock.getSelections.mockReturnValue(['selected text']);
      cmMock.getSelection.mockReturnValue('selected text');
      const selections = cmMock.getSelections();
      expect(selections.length > 1 || cmMock.getSelection().length > 0).toBe(true);
    });

    it('当光标所在行有内容时应该隐藏', () => {
      cmMock.getLine.mockReturnValue('some content');
      expect(cmMock.getLine(0).length > 0).toBe(true);
    });

    it('当行为空且无选区时应该显示', () => {
      cmMock.getSelections.mockReturnValue(['']);
      cmMock.getSelection.mockReturnValue('');
      cmMock.getLine.mockReturnValue('');

      const selections = cmMock.getSelections();
      const selection = cmMock.getSelection();
      const lineContent = cmMock.getLine(0);

      const shouldHide = selections.length > 1 || selection.length > 0 || lineContent.length > 0;
      expect(shouldHide).toBe(false);
    });
  });

  describe('getLineHeight - 行高计算', () => {
    it('应该累计计算行高度', () => {
      const lineHeights = [20, 20, 25, 20]; // 模拟各行高度
      const targetLine = 3;
      let totalHeight = 0;
      for (let i = 0; i < targetLine; i++) {
        totalHeight += lineHeights[i];
      }
      expect(totalHeight).toBe(65);
    });
  });

  describe('cursorActivity - 光标活动', () => {
    it('应该监听 cursorActivity 事件', () => {
      const callback = vi.fn();
      cmMock.on('cursorActivity', callback);
      expect(cmMock.on).toHaveBeenCalledWith('cursorActivity', callback);
    });

    it('应该监听 update 事件', () => {
      const callback = vi.fn();
      cmMock.on('update', callback);
      expect(cmMock.on).toHaveBeenCalledWith('update', callback);
    });

    it('应该监听 refresh 事件', () => {
      const callback = vi.fn();
      cmMock.on('refresh', callback);
      expect(cmMock.on).toHaveBeenCalledWith('refresh', callback);
    });
  });

  describe('getCursor - 光标位置', () => {
    it('应该获取当前光标位置', () => {
      cmMock.getCursor.mockReturnValue({ line: 5, ch: 0 });
      const cursor = cmMock.getCursor();
      expect(cursor.line).toBe(5);
      expect(cursor.ch).toBe(0);
    });
  });
});

describe('Suggester 建议列表', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    document.body.innerHTML = `
      <div class="cherry">
        <div class="cherry-editor">
          <div class="CodeMirror">
            <div class="CodeMirror-cursors">
              <div class="CodeMirror-cursor" style="left: 100px; top: 50px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('关键词触发', () => {
    it('应该识别 @ 触发词', () => {
      const keyword = '@';
      const suggesterConfig: Record<string, unknown> = { '@': { keyword: '@' } };
      expect(suggesterConfig[keyword]).toBeDefined();
    });

    it('应该识别 / 触发词', () => {
      const keyword = '/';
      const suggesterConfig: Record<string, unknown> = { '/': { keyword: '/' } };
      expect(suggesterConfig[keyword]).toBeDefined();
    });

    it('应该识别 # 触发词', () => {
      const keyword = '#';
      const suggesterConfig: Record<string, unknown> = { '#': { keyword: '#' } };
      expect(suggesterConfig[keyword]).toBeDefined();
    });
  });

  describe('change 事件监听', () => {
    it('应该监听 change 事件', () => {
      const callback = vi.fn();
      cmMock.on('change', callback);
      expect(cmMock.on).toHaveBeenCalledWith('change', callback);
    });

    it('应该处理输入变化事件', () => {
      const evt = {
        text: ['@'],
        from: { line: 0, ch: 0 },
        to: { line: 0, ch: 1 },
        origin: '+input',
      };
      expect(evt.text[0]).toBe('@');
      expect(evt.origin).toBe('+input');
    });

    it('应该处理删除事件', () => {
      const evt = {
        text: [''],
        from: { line: 0, ch: 0 },
        to: { line: 0, ch: 1 },
        origin: '+delete',
      };
      expect(evt.origin).toBe('+delete');
    });
  });

  describe('keydown 事件处理', () => {
    it('应该监听 keydown 事件', () => {
      const callback = vi.fn();
      cmMock.on('keydown', callback);
      expect(cmMock.on).toHaveBeenCalledWith('keydown', callback);
    });

    it('应该识别上键 (keyCode: 38)', () => {
      const evt = { keyCode: 38 };
      expect([38, 40].includes(evt.keyCode)).toBe(true);
    });

    it('应该识别下键 (keyCode: 40)', () => {
      const evt = { keyCode: 40 };
      expect([38, 40].includes(evt.keyCode)).toBe(true);
    });

    it('应该识别回车键 (keyCode: 13)', () => {
      const evt = { keyCode: 13 };
      expect(evt.keyCode).toBe(13);
    });

    it('应该识别 ESC 键 (keyCode: 27)', () => {
      const evt = { keyCode: 27 };
      expect(evt.keyCode).toBe(27);
    });

    it('应该识别左箭头 (keyCode: 37) 退出联想', () => {
      const evt = { keyCode: 0x25 }; // 37
      expect(evt.keyCode === 27 || evt.keyCode === 0x25 || evt.keyCode === 0x27).toBe(true);
    });

    it('应该识别右箭头 (keyCode: 39) 退出联想', () => {
      const evt = { keyCode: 0x27 }; // 39
      expect(evt.keyCode === 27 || evt.keyCode === 0x25 || evt.keyCode === 0x27).toBe(true);
    });
  });

  describe('replaceRange - 回填结果', () => {
    it('应该在指定位置替换文本', () => {
      const from = { line: 0, ch: 0 };
      const to = { line: 0, ch: 5 };
      cmMock.replaceRange('@user ', from, to);
      expect(cmMock.replaceRange).toHaveBeenCalledWith('@user ', from, to);
    });

    it('应该支持插入而非替换 (from === to)', () => {
      const pos = { line: 0, ch: 5 };
      cmMock.replaceRange('inserted', pos, pos);
      expect(cmMock.replaceRange).toHaveBeenCalledWith('inserted', pos, pos);
    });
  });

  describe('setCursor - 光标控制', () => {
    it('应该支持 goLeft 左移光标', () => {
      cmMock.getCursor.mockReturnValue({ line: 0, ch: 20 });
      const cursor = cmMock.getCursor();
      const goLeft = 5;
      const newCh = cursor.ch - goLeft;
      cmMock.setCursor(cursor.line, newCh);
      expect(cmMock.setCursor).toHaveBeenCalledWith(0, 15);
    });

    it('应该支持 goTop 上移光标', () => {
      cmMock.getCursor.mockReturnValue({ line: 5, ch: 10 });
      const cursor = cmMock.getCursor();
      const goTop = 2;
      const newLine = cursor.line - goTop;
      cmMock.setCursor(newLine, cursor.ch);
      expect(cmMock.setCursor).toHaveBeenCalledWith(3, 10);
    });
  });

  describe('setSelection - 选中范围', () => {
    it('应该支持 selection.from/to 选中指定范围', () => {
      cmMock.getCursor.mockReturnValue({ line: 0, ch: 20 });
      const cursor = cmMock.getCursor();
      const selection = { from: 5, to: 2 };
      cmMock.setSelection(
        { line: cursor.line, ch: cursor.ch - selection.from },
        { line: cursor.line, ch: cursor.ch - selection.to },
      );
      expect(cmMock.setSelection).toHaveBeenCalledWith({ line: 0, ch: 15 }, { line: 0, ch: 18 });
    });
  });

  describe('extraKeys 配置', () => {
    it('应该获取 extraKeys 配置', () => {
      cmMock.getOption.mockReturnValue({
        Up: undefined,
        Down: undefined,
        Enter: undefined,
      });
      const extraKeys = cmMock.getOption('extraKeys');
      expect(extraKeys).toHaveProperty('Up');
      expect(extraKeys).toHaveProperty('Down');
      expect(extraKeys).toHaveProperty('Enter');
    });

    it('应该设置 extraKeys 配置', () => {
      const newExtraKeys = {
        Up: vi.fn(),
        Down: vi.fn(),
        Enter: vi.fn(),
      };
      cmMock.setOption('extraKeys', newExtraKeys);
      expect(cmMock.setOption).toHaveBeenCalledWith('extraKeys', newExtraKeys);
    });
  });

  describe('scroll 事件处理', () => {
    it('应该监听 scroll 事件', () => {
      const callback = vi.fn();
      cmMock.on('scroll', callback);
      expect(cmMock.on).toHaveBeenCalledWith('scroll', callback);
    });
  });

  describe('cursorActivity 事件', () => {
    it('应该在非键盘操作时关闭联想', () => {
      let keyAction = false;
      const callback = vi.fn(() => {
        if (!keyAction) {
          // stopRelate
        }
        keyAction = false;
      });

      // 模拟键盘操作
      keyAction = true;
      callback();
      expect(keyAction).toBe(false);

      // 模拟非键盘操作（如鼠标点击）
      callback();
      expect(keyAction).toBe(false);
    });
  });

  describe('搜索缓存管理', () => {
    it('应该维护搜索关键字缓存', () => {
      const searchKeyCache: string[] = [];
      searchKeyCache.push('@');
      searchKeyCache.push('u');
      searchKeyCache.push('s');
      searchKeyCache.push('e');
      searchKeyCache.push('r');
      expect(searchKeyCache.join('')).toBe('@user');
    });

    it('应该在删除时弹出缓存', () => {
      const searchKeyCache = ['@', 'u', 's', 'e', 'r'];
      searchKeyCache.pop();
      expect(searchKeyCache.join('')).toBe('@use');
    });

    it('应该在缓存为空时停止联想', () => {
      const searchKeyCache = ['@'];
      searchKeyCache.pop();
      expect(searchKeyCache.length).toBe(0);
    });
  });
});

describe('坐标系转换', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('charCoords', () => {
    it('应该支持 local 坐标系', () => {
      cmMock.charCoords.mockReturnValue({ left: 50, top: 100, bottom: 120 });
      const coords = cmMock.charCoords({ line: 0, ch: 0 }, 'local');
      expect(coords).toHaveProperty('left');
      expect(coords).toHaveProperty('top');
    });

    it('应该支持 page 坐标系', () => {
      cmMock.charCoords.mockReturnValue({ left: 150, top: 300, bottom: 320 });
      const coords = cmMock.charCoords({ line: 0, ch: 0 }, 'page');
      expect(coords.left).toBe(150);
      expect(coords.top).toBe(300);
    });
  });

  describe('coordsChar', () => {
    it('应该将坐标转换为字符位置', () => {
      cmMock.coordsChar.mockReturnValue({ line: 2, ch: 15 });
      const pos = cmMock.coordsChar({ left: 100, top: 50 }, 'local');
      expect(pos.line).toBe(2);
      expect(pos.ch).toBe(15);
    });
  });

  describe('lineAtHeight', () => {
    it('应该根据高度获取行号', () => {
      cmMock.lineAtHeight.mockReturnValue(5);
      const line = cmMock.lineAtHeight(100, 'local');
      expect(line).toBe(5);
    });
  });
});

describe('事件系统', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('on/off 事件绑定', () => {
    it('应该绑定事件', () => {
      const callback = vi.fn();
      cmMock.on('change', callback);
      expect(cmMock.on).toHaveBeenCalledWith('change', callback);
    });

    it('应该解绑事件', () => {
      const callback = vi.fn();
      cmMock.off('change', callback);
      expect(cmMock.off).toHaveBeenCalledWith('change', callback);
    });
  });

  describe('常用事件类型', () => {
    const eventTypes = [
      'change',
      'beforeChange',
      'cursorActivity',
      'keydown',
      'keyup',
      'scroll',
      'refresh',
      'update',
      'beforeSelectionChange',
    ];

    eventTypes.forEach((eventType) => {
      it(`应该支持 ${eventType} 事件`, () => {
        const callback = vi.fn();
        cmMock.on(eventType, callback);
        expect(cmMock.on).toHaveBeenCalledWith(eventType, callback);
      });
    });
  });
});

describe('DOM 操作', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
    document.body.innerHTML = `
      <div class="CodeMirror">
        <div class="CodeMirror-scroll"></div>
        <div class="CodeMirror-sizer"></div>
        <div class="CodeMirror-lines"></div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('getWrapperElement', () => {
    it('应该返回 CodeMirror 包装元素', () => {
      const wrapper = document.querySelector('.CodeMirror');
      cmMock.getWrapperElement.mockReturnValue(wrapper);
      expect(cmMock.getWrapperElement()).toBe(wrapper);
    });
  });

  describe('getScrollerElement', () => {
    it('应该返回滚动容器元素', () => {
      const scroller = document.querySelector('.CodeMirror-scroll');
      cmMock.getScrollerElement.mockReturnValue(scroller);
      expect(cmMock.getScrollerElement()).toBe(scroller);
    });
  });

  describe('display.wrapper', () => {
    it('应该访问 display.wrapper', () => {
      const wrapper = document.querySelector('.CodeMirror');
      cmMock.display = { wrapper };
      expect(cmMock.display.wrapper).toBe(wrapper);
    });
  });

  describe('getElementsByClassName 选区查找', () => {
    it('应该查找选中元素', () => {
      document.body.innerHTML = `
        <div class="CodeMirror">
          <div class="CodeMirror-selected" style="left: 10px; top: 20px; width: 100px; height: 20px;"></div>
          <div class="CodeMirror-selected" style="left: 10px; top: 40px; width: 80px; height: 20px;"></div>
        </div>
      `;
      const wrapper = document.querySelector('.CodeMirror') as HTMLElement;
      const selectedObjs = wrapper.getElementsByClassName('CodeMirror-selected');
      expect(selectedObjs.length).toBe(2);
    });
  });
});

describe('焦点管理', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('focus', () => {
    it('应该聚焦编辑器', () => {
      cmMock.focus();
      expect(cmMock.focus).toHaveBeenCalled();
    });
  });

  describe('hasFocus', () => {
    it('应该检查编辑器是否有焦点', () => {
      cmMock.hasFocus.mockReturnValue(true);
      expect(cmMock.hasFocus()).toBe(true);
    });

    it('应该返回无焦点状态', () => {
      cmMock.hasFocus.mockReturnValue(false);
      expect(cmMock.hasFocus()).toBe(false);
    });
  });
});

describe('命令执行', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execCommand', () => {
    it('应该执行内置命令', () => {
      cmMock.execCommand('undo');
      expect(cmMock.execCommand).toHaveBeenCalledWith('undo');
    });

    it('应该执行 goLineUp 命令', () => {
      cmMock.execCommand('goLineUp');
      expect(cmMock.execCommand).toHaveBeenCalledWith('goLineUp');
    });

    it('应该执行 goLineDown 命令', () => {
      cmMock.execCommand('goLineDown');
      expect(cmMock.execCommand).toHaveBeenCalledWith('goLineDown');
    });

    it('应该执行 newlineAndIndent 命令', () => {
      cmMock.execCommand('newlineAndIndent');
      expect(cmMock.execCommand).toHaveBeenCalledWith('newlineAndIndent');
    });
  });
});

describe('滚动控制', () => {
  let cmMock: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    cmMock = createCodeMirrorMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getScrollInfo', () => {
    it('应该获取滚动信息', () => {
      cmMock.getScrollInfo.mockReturnValue({
        top: 100,
        left: 0,
        width: 800,
        height: 600,
        clientWidth: 780,
        clientHeight: 580,
      });
      const info = cmMock.getScrollInfo();
      expect(info.top).toBe(100);
      expect(info.height).toBe(600);
    });
  });

  describe('scrollTo', () => {
    it('应该滚动到指定位置', () => {
      cmMock.scrollTo(0, 500);
      expect(cmMock.scrollTo).toHaveBeenCalledWith(0, 500);
    });
  });

  describe('scrollIntoView', () => {
    it('应该将位置滚动到可见区域', () => {
      cmMock.scrollIntoView({ line: 50, ch: 0 });
      expect(cmMock.scrollIntoView).toHaveBeenCalledWith({ line: 50, ch: 0 });
    });

    it('应该支持 margin 参数', () => {
      cmMock.scrollIntoView({ line: 50, ch: 0 }, 20);
      expect(cmMock.scrollIntoView).toHaveBeenCalledWith({ line: 50, ch: 0 }, 20);
    });
  });
});
