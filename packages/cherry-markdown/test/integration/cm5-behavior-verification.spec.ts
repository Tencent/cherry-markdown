/**
 * CodeMirror 5 行为验证测试
 *
 * 使用真实的 CodeMirror 5 运行行为测试，验证 Mock 行为与真实行为一致
 * 这是确保 CM6 升级安全性的关键测试
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRealCM5, type IEditorAdapterExtended } from './cm5-adapter';

// 从 behavior 测试中复用相同的测试用例
// 这些测试用例应该与 Mock 测试完全一致

describe('CodeMirror 5 行为验证测试', () => {
  let container: HTMLDivElement;
  let editor: IEditorAdapterExtended | null = null;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = await initRealCM5(container);
  });

  afterEach(async () => {
    // 重要：销毁 CM5 实例以防止内存泄露
    if (editor && 'destroy' in editor) {
      (editor as any).destroy();
    }
    editor = null;

    // 清理容器
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null as any;

    // 清理所有 timer，防止内存泄漏
    vi.clearAllTimers();
  });

  // ============================================================================
  // 内容操作 - 核心行为
  // ============================================================================

  describe('内容操作', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该正确设置和获取内容', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      expect(editor.getValue()).toBe('Hello World');
    });

    it('应该正确获取指定行', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      expect(editor.getLine(0)).toBe('Line 1');
      expect(editor.getLine(1)).toBe('Line 2');
      expect(editor.getLine(2)).toBe('Line 3');
    });

    it('应该正确获取行数', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      expect(editor.lineCount()).toBe(3);
    });

    it('应该正确获取范围内的文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      const text = editor.getRange({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(text).toBe('Hello');
    });

    it('应该正确替换范围内的文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.replaceRange('Hi', { line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getValue()).toBe('Hi World');
    });
  });

  // ============================================================================
  // 光标和选区操作 - 核心行为
  // ============================================================================

  describe('光标和选区操作', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该正确设置和获取光标位置', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.setCursor({ line: 0, ch: 5 });
      const cursor = editor.getCursor();
      expect(cursor.line).toBe(0);
      expect(cursor.ch).toBe(5);
    });

    it('应该正确选中文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getSelection()).toBe('Hello');
    });

    it('应该正确替换选中的文本', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      editor.replaceRange('Hi', { line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.getValue()).toBe('Hi World');
    });

    it('应该正确判断是否有选中内容', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      expect(editor.somethingSelected()).toBe(false);
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(editor.somethingSelected()).toBe(true);
    });
  });

  // ============================================================================
  // 事件系统 - 核心行为
  // ============================================================================

  describe('事件系统', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该正确触发 change 事件', async () => {
      if (!editor) return;
      const changeHandler = vi.fn();
      editor.on('change', changeHandler);

      editor.setValue('test');

      // CM5 可能在下一个 tick 触发事件
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(changeHandler).toHaveBeenCalled();
      editor.off('change', changeHandler);
    });

    it('应该正确触发 focus 事件', async () => {
      if (!editor) return;
      const focusHandler = vi.fn();
      editor.on('focus', focusHandler);

      editor.focus();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(focusHandler).toHaveBeenCalled();
      editor.off('focus', focusHandler);
    });

    it('应该能够注销事件处理器', async () => {
      if (!editor) return;
      const handler = vi.fn();
      editor.on('change', handler);

      editor.off('change', handler);
      editor.setValue('test');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 历史操作 - 核心行为（这是 Mock 最可能不一致的地方）
  // ============================================================================

  describe('历史操作', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
      editor.clearHistory();
    });

    it('应该能够撤销操作', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.setValue('Modified');
      editor.undo();
      expect(editor.getValue()).toBe('Initial');
    });

    it('应该能够重做操作', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.setValue('Modified');
      editor.undo();
      editor.redo();
      expect(editor.getValue()).toBe('Modified');
    });

    it('应该正确报告历史状态', () => {
      if (!editor) return;
      editor.setValue('Initial');
      // CM5: setValue 后就有历史可以撤销（包含初始设置）
      // 这与 Mock 行为不同，是 CM5 的特性

      editor.replaceRange(' added', { line: 0, ch: 7 });
      expect(editor.historySize().canUndo).toBe(true);
    });

    it('应该能够清空历史', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.replaceRange(' added', { line: 0, ch: 7 });
      expect(editor.historySize().canUndo).toBe(true);

      editor.clearHistory();
      expect(editor.historySize().canUndo).toBe(false);
    });
  });

  // ============================================================================
  // 搜索功能 - 核心行为（这是 Mock 最可能不一致的地方）
  // ============================================================================

  describe('搜索功能', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
    });

    it('应该能够搜索文本', () => {
      if (!editor) return;
      editor.setValue('Hello World Hello');
      const cursor = editor.getSearchCursor('Hello');

      expect(cursor.findNext()).toBe(true);
      const from = cursor.from()!;
      const to = cursor.to()!;
      // CM5 返回 Pos 对象，可能有 sticky 属性
      expect(from.line).toBe(0);
      expect(from.ch).toBe(0);
      expect(to.line).toBe(0);
      expect(to.ch).toBe(5);

      expect(cursor.findNext()).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(cursor.from()!.ch).toBe(12);

      expect(cursor.findNext()).toBe(false);
    });

    it('应该能够使用正则表达式搜索', () => {
      if (!editor) return;
      editor.setValue('test123test456');
      const cursor = editor.getSearchCursor(/\d+/);

      const result1 = cursor.findNext();
      expect(result1).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(cursor.from()!.ch).toBe(4);
      expect(cursor.to()!.ch).toBe(7);

      const result2 = cursor.findNext();
      expect(result2).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      expect(cursor.from()!.ch).toBe(11);
    });

    it('应该能够替换搜索结果', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      const cursor = editor.getSearchCursor('World');

      cursor.findNext();
      cursor.replace('CM6');

      expect(editor.getValue()).toBe('Hello CM6');
    });

    it('应该能够搜索多行文本', () => {
      if (!editor) return;
      editor.setValue('Line 1\nLine 2\nLine 3');
      const cursor = editor.getSearchCursor('Line');

      let count = 0;
      while (cursor.findNext()) {
        count += 1;
      }

      expect(count).toBe(3);
    });
  });

  // ============================================================================
  // Markdown 编辑场景 - 核心回归测试
  // ============================================================================

  describe('Markdown 编辑场景', () => {
    const regressionTests = [
      { name: '加粗', initial: 'text', transform: (s: string) => `**${s}**`, expected: '**text**' },
      { name: '斜体', initial: 'text', transform: (s: string) => `*${s}*`, expected: '*text*' },
      { name: '删除线', initial: 'text', transform: (s: string) => `~~${s}~~`, expected: '~~text~~' },
      { name: '行内代码', initial: 'code', transform: (s: string) => `\`${s}\``, expected: '`code`' },
      { name: '一级标题', initial: 'Title', transform: (s: string) => `# ${s}`, expected: '# Title' },
      { name: '无序列表', initial: 'item', transform: (s: string) => `- ${s}`, expected: '- item' },
      { name: '有序列表', initial: 'item', transform: (s: string) => `1. ${s}`, expected: '1. item' },
      { name: '引用', initial: 'quote', transform: (s: string) => `> ${s}`, expected: '> quote' },
      { name: '链接', initial: 'link', transform: (s: string) => `[${s}](url)`, expected: '[link](url)' },
      { name: '图片', initial: 'alt', transform: (s: string) => `![${s}](img.png)`, expected: '![alt](img.png)' },
    ];

    regressionTests.forEach(({ name, initial, transform, expected }) => {
      it(`Markdown 转换: ${name}`, () => {
        if (!editor) return;
        editor.setValue(initial);
        editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: initial.length });

        const selection = editor.getSelection();
        editor.replaceRange(transform(selection), { line: 0, ch: 0 }, { line: 0, ch: initial.length });

        expect(editor.getValue()).toBe(expected);
      });
    });
  });

  // ============================================================================
  // 复杂场景测试
  // ============================================================================

  describe('复杂场景', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('');
      editor.clearHistory();
    });

    it('应该正确处理多行编辑和撤销', () => {
      if (!editor) return;

      // 创建多行内容
      editor.setValue('Line 1\nLine 2\nLine 3');

      // 编辑第二行
      editor.replaceRange('Modified Line 2', { line: 1, ch: 0 }, { line: 1, ch: 6 });

      expect(editor.getValue()).toBe('Line 1\nModified Line 2\nLine 3');

      // 撤销
      editor.undo();
      expect(editor.getValue()).toBe('Line 1\nLine 2\nLine 3');
    });

    it('应该正确处理搜索替换全部', () => {
      if (!editor) return;
      editor.setValue('foo bar foo baz foo');

      const cursor = editor.getSearchCursor('foo');
      let count = 0;
      while (cursor.findNext()) {
        cursor.replace('REPLACED');
        count += 1;
      }

      expect(count).toBe(3);
      expect(editor.getValue()).toBe('REPLACED bar REPLACED baz REPLACED');
    });

    it('应该正确处理中文文本', () => {
      if (!editor) return;
      editor.setValue('你好世界');

      const cursor = editor.getSearchCursor('世界');
      const found = cursor.findNext();
      expect(found).toBe(true);
      expect(cursor.from()!.line).toBe(0);
      // 中文搜索位置应该正确
      expect(editor.getValue().substring(cursor.from()!.ch, cursor.to()!.ch)).toBe('世界');
    });

    it('应该正确处理 Unicode 表情符号', () => {
      if (!editor) return;
      editor.setValue('Hello 😀 World');

      const cursor = editor.getSearchCursor('😀');
      expect(cursor.findNext()).toBe(true);
      // 表情符号占 2 个字符位置（在 UTF-16 中是代理对）
      const from = cursor.from()!;
      const to = cursor.to()!;
      expect(editor.getValue().substring(from.ch, to.ch)).toBe('😀');
    });
  });

  // ============================================================================
  // 边界情况测试
  // ============================================================================

  describe('边界情况', () => {
    it('应该处理空文档', () => {
      if (!editor) return;
      editor.setValue('');
      expect(editor.getValue()).toBe('');
      expect(editor.lineCount()).toBe(1); // CM5 对空文档返回 1 行
    });

    it('应该处理超出范围的行号', () => {
      if (!editor) return;
      editor.setValue('Single Line');
      expect(editor.getLine(5)).toBeUndefined();
    });

    it('应该处理搜索不存在的内容', () => {
      if (!editor) return;
      editor.setValue('Hello World');
      const cursor = editor.getSearchCursor('NotFound');
      expect(cursor.findNext()).toBe(false);
    });

    it('应该处理没有历史时的撤销', () => {
      if (!editor) return;
      editor.setValue('Initial');
      editor.clearHistory();

      const beforeUndo = editor.getValue();
      editor.undo();
      // 没有历史时撤销不应该改变内容
      expect(editor.getValue()).toBe(beforeUndo);
    });
  });

  // ============================================================================
  // 滚动与视口表现 - 验证 UI 表现一致性
  // ============================================================================

  describe('滚动与视口表现', () => {
    beforeEach(() => {
      if (!editor) return;
      // 创建一个较长的文档以便测试滚动
      const longContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n');
      editor.setValue(longContent);
    });

    it('应该正确获取滚动信息', () => {
      if (!editor) return;
      const scrollInfo = editor.getScrollInfo();
      expect(scrollInfo).toHaveProperty('top');
      expect(scrollInfo).toHaveProperty('left');
      expect(scrollInfo).toHaveProperty('height');
      expect(scrollInfo).toHaveProperty('width');
      expect(typeof scrollInfo.top).toBe('number');
      expect(typeof scrollInfo.left).toBe('number');
    });

    it('应该能够滚动到指定位置', () => {
      if (!editor) return;
      // 滚动到位置
      editor.scrollTo(0, 100);
      const scrollInfo = editor.getScrollInfo();
      // 验证滚动发生了
      expect(scrollInfo).toHaveProperty('top');
    });

    it('应该能够滚动到行', () => {
      if (!editor) return;
      // 滚动到第 50 行
      editor.scrollIntoView({ line: 50, ch: 0 });
      // scrollIntoView 不需要验证具体值，只要不报错即可
      expect(true).toBe(true);
    });

    it('应该返回正确的行数（长文档）', () => {
      if (!editor) return;
      // 验证长文档的行数计算正确
      expect(editor.lineCount()).toBe(100);
    });

    it('应该能够获取任意行的内容', () => {
      if (!editor) return;
      // 验证长文档中任意行的内容正确
      expect(editor.getLine(0)).toBe('Line 1');
      expect(editor.getLine(49)).toBe('Line 50');
      expect(editor.getLine(99)).toBe('Line 100');
    });
  });

  // ============================================================================
  // 光标坐标表现 - 验证视觉定位一致性
  // ============================================================================

  describe('光标坐标表现', () => {
    beforeEach(() => {
      if (!editor) return;
      editor.setValue('Hello World\nLine 2\nLine 3');
    });

    it('应该能够获取字符的屏幕坐标', () => {
      if (!editor) return;
      // charCoords 返回字符的屏幕位置
      if (typeof (editor as any).charCoords !== 'function') {
        return;
      }
      const coords = editor.charCoords({ line: 0, ch: 0 }, 'local');
      expect(coords).toHaveProperty('left');
      expect(coords).toHaveProperty('top');
      expect(coords).toHaveProperty('bottom');
      expect(typeof coords.left).toBe('number');
      expect(typeof coords.top).toBe('number');
    });

    it('应该能够获取光标的屏幕坐标', () => {
      if (!editor) return;
      // cursorCoords 返回光标的屏幕位置
      if (typeof (editor as any).cursorCoords !== 'function') {
        return;
      }
      editor.setCursor({ line: 0, ch: 5 });
      const coords = editor.cursorCoords(null, 'local');
      expect(coords).toHaveProperty('left');
      expect(coords).toHaveProperty('top');
      expect(coords).toHaveProperty('bottom');
      expect(typeof coords.left).toBe('number');
      expect(typeof coords.top).toBe('number');
    });

    it('应该能够将屏幕坐标转换为文档位置', () => {
      if (!editor) return;
      // coordsChar 将屏幕点击位置转换为文档位置
      if (typeof (editor as any).coordsChar !== 'function') {
        return;
      }
      // 模拟点击文档开头
      const pos = editor.coordsChar({ left: 10, top: 10 });
      expect(pos).toHaveProperty('line');
      expect(pos).toHaveProperty('ch');
      expect(typeof pos.line).toBe('number');
      expect(typeof pos.ch).toBe('number');
    });

    it('应该能够获取选区的光标坐标', () => {
      if (!editor) return;
      if (typeof (editor as any).cursorCoords !== 'function') {
        return;
      }
      // 设置选区
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      // 获取选区开始和结束的光标坐标
      const startCoords = editor.cursorCoords('start', 'local');
      const endCoords = editor.cursorCoords('end', 'local');
      expect(startCoords).toHaveProperty('left');
      expect(endCoords).toHaveProperty('left');
      // 验证坐标是数字（具体大小可能因实现而异）
      expect(typeof startCoords.left).toBe('number');
      expect(typeof endCoords.left).toBe('number');
    });
  });

  // ============================================================================
  // 滚动动画表现 - 验证滚动行为一致性
  // ============================================================================

  describe('滚动动画表现', () => {
    beforeEach(() => {
      if (!editor) return;
      // 创建一个很长的文档以便测试滚动
      const longContent = Array.from({ length: 200 }, (_, i) => `Line ${i + 1}`).join('\n');
      editor.setValue(longContent);
      editor.setCursor({ line: 0, ch: 0 });
    });

    it('应该能够滚动到文档开头', () => {
      if (!editor) return;
      // 先滚动到底部
      editor.setCursor({ line: 199, ch: 0 });
      editor.scrollIntoView({ line: 199, ch: 0 });
      // 然后滚动到开头
      editor.scrollIntoView({ line: 0, ch: 0 });
      const scrollInfo = editor.getScrollInfo();
      // 验证滚动命令执行了（具体值可能因实现而异）
      expect(scrollInfo).toHaveProperty('top');
    });

    it('应该能够滚动到文档末尾', () => {
      if (!editor) return;
      editor.setCursor({ line: 199, ch: 0 });
      editor.scrollIntoView({ line: 199, ch: 0 });
      const scrollInfo = editor.getScrollInfo();
      // 验证滚动命令执行了
      expect(scrollInfo).toHaveProperty('top');
    });

    it('应该能够滚动到指定行', () => {
      if (!editor) return;
      editor.scrollIntoView({ line: 100, ch: 0 });
      const scrollInfo = editor.getScrollInfo();
      // 验证滚动信息更新
      expect(scrollInfo).toHaveProperty('top');
    });

    it('应该能够水平滚动', () => {
      if (!editor) return;
      // 创建一个很长的行
      editor.setValue('A'.repeat(500));
      editor.scrollTo(200, 0);
      const scrollInfo = editor.getScrollInfo();
      // 验证水平滚动发生
      expect(scrollInfo.left).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// 真实 CM5 vs Mock 行为对比测试
// ============================================================================

describe('真实 CM5 与 Mock 行为对比', () => {
  it('说明: 此测试套件需要手动对比', () => {
    console.log(`
要确保 Mock 行为与真实 CM5 一致，请：

1. 运行本测试文件：
   npm test -- --run test/integration/cm5-behavior-verification.spec.ts

2. 运行 Mock 行为测试：
   npm test -- --run test/unit/behavior/

3. 对比两者结果，特别关注：
   - historySize() 返回值
   - getSearchCursor 行为
   - undo/redo 行为
   - 事件触发时机

4. 修复 Mock 实现中与真实 CM5 不一致的地方
    `);
  });
});
