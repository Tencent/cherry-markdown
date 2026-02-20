/**
 * 代码块内嵌编辑器行为测试
 *
 * 测试 codeBlockContentHandler.js 中使用的 CodeMirror API
 * 该文件自己创建了一个独立的 CM5 编辑器实例（codemirror.fromTextArea）
 * 升级时需要同步替换为 CM6
 *
 * 测试的核心行为（不依赖 CM5 实现）：
 * 1. 代码块定位：从主编辑器内容中找到代码块并定位
 * 2. 代码块选区：选中代码块内容/语言标记
 * 3. 语言切换：替换代码块语言标记
 * 4. 代码块编辑：内嵌编辑器同步回主编辑器
 * 5. 代码块编辑器生命周期：创建 → 编辑 → 销毁
 *
 * CM5 API → CM6 等价物：
 * - codemirror.fromTextArea → new EditorView({ parent, doc })
 * - getValue/setValue → EditorState.doc / dispatch
 * - setSelection → dispatch({ selection })
 * - replaceSelection → dispatch({ changes })
 * - getSelection → state.sliceDoc(sel.from, sel.to)
 * - on('change') → EditorView.updateListener
 * - getWrapperElement → EditorView.dom
 * - focus → EditorView.focus()
 * - refresh → (CM6 自动处理)
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createExtendedMockEditorAdapter,
  type IEditorAdapterExtended,
} from '../behavior/editor-adapter-extended.spec';

// 模拟代码块内容的正则（从 regexp.js 简化）
const codeBlockReg = /\n*(`{3,})([^\n]*)\n([\s\S]*?)\n*\1/g;

/**
 * 从编辑器内容中收集所有代码块信息
 * 模拟 codeBlockContentHandler.$collectCodeBlockCode
 */
function collectCodeBlocks(editorContent: string) {
  const blocks: Array<{ code: string; offset: number; lang: string }> = [];
  editorContent.replace(codeBlockReg, (whole, _ticks, lang, content, offset) => {
    const match = whole.replace(/^\n*/, '');
    const offsetBegin = offset + (whole.match(/^\n*/)?.[0]?.length ?? 0);
    blocks.push({
      code: match,
      offset: offsetBegin,
      lang: (lang || '').trim(),
    });
    return whole;
  });
  return blocks;
}

/**
 * 计算代码块内容的选区范围（行号）
 * 模拟 codeBlockContentHandler.$setBlockSelection
 */
function getBlockSelectionRange(editorContent: string, blockIndex: number) {
  const blocks = collectCodeBlocks(editorContent);
  if (blockIndex >= blocks.length) return null;

  const block = blocks[blockIndex];
  const beforeBlock = editorContent.slice(0, block.offset);
  const beginLine = (beforeBlock.match(/\n/g) || []).length;
  const codeLines = (block.code.match(/\n/g) || []).length;
  const endLine = beginLine + codeLines;
  // 计算 endCh: 从结尾的 ``` 之前的最后一行的长度
  const codeWithoutClosing = block.code.slice(0, -3); // 去掉结尾 ```
  const lastContentLine = codeWithoutClosing.match(/[^\n]+\n*$/)?.[0] || '';
  const endCh = lastContentLine.length;

  return {
    // 从下往上选中（与源码一致），避免触发滚动
    from: { line: endLine - 1, ch: endCh },
    to: { line: beginLine + 1, ch: 0 },
  };
}

/**
 * 计算代码块语言标记的选区范围
 * 模拟 codeBlockContentHandler.$setLangSelection
 */
function getLangSelectionRange(editorContent: string, blockIndex: number) {
  const blocks = collectCodeBlocks(editorContent);
  if (blockIndex >= blocks.length) return null;

  const block = blocks[blockIndex];
  const beforeBlock = editorContent.slice(0, block.offset);
  const beginLine = (beforeBlock.match(/\n/g) || []).length;
  const firstLineMatch = block.code.match(/```\s*([^\n]*)/);
  const langText = firstLineMatch?.[1] || '';

  return {
    from: { line: beginLine, ch: 3 },
    to: { line: beginLine, ch: 3 + langText.length },
  };
}

describe('代码块内嵌编辑器行为测试', () => {
  let mainEditor: IEditorAdapterExtended;

  const sampleContent = [
    '# 标题',
    '',
    '一些正文内容',
    '',
    '```javascript',
    'const x = 1;',
    'const y = 2;',
    'console.log(x + y);',
    '```',
    '',
    '更多文本',
    '',
    '```python',
    'def hello():',
    '    print("world")',
    '```',
    '',
    '结尾文本',
  ].join('\n');

  beforeEach(() => {
    mainEditor = createExtendedMockEditorAdapter(sampleContent);
  });

  // ============================================================================
  // 代码块定位
  // ============================================================================
  describe('代码块定位', () => {
    it('应该找到所有代码块', () => {
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks.length).toBe(2);
    });

    it('第一个代码块应该是 javascript', () => {
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks[0].lang).toBe('javascript');
    });

    it('第二个代码块应该是 python', () => {
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks[1].lang).toBe('python');
    });

    it('没有代码块时应该返回空数组', () => {
      mainEditor.setValue('# 纯文本\n没有代码块');
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks.length).toBe(0);
    });

    it('应该忽略 mermaid 代码块（如源码逻辑）', () => {
      mainEditor.setValue('```mermaid\ngraph TD\nA-->B\n```\n\n```js\ncode\n```');
      const content = mainEditor.getValue();
      const blocks: Array<{ code: string }> = [];
      content.replace(codeBlockReg, (whole, _ticks, _lang, _content, offset) => {
        const match = whole.replace(/^\n*/, '');
        if (!match.startsWith('```mermaid')) {
          blocks.push({ code: match });
        }
        return whole;
      });
      expect(blocks.length).toBe(1);
    });
  });

  // ============================================================================
  // 代码块选区定位
  // ============================================================================
  describe('代码块选区定位', () => {
    it('$setBlockSelection: 选中第一个代码块内容', () => {
      const range = getBlockSelectionRange(mainEditor.getValue(), 0);
      expect(range).not.toBeNull();

      mainEditor.setSelection(range!.to, range!.from);
      const selection = mainEditor.getSelection();

      // 应该包含代码内容（不含 ``` 行）
      expect(selection).toContain('const x = 1;');
      expect(selection).toContain('console.log(x + y);');
    });

    it('$setLangSelection: 选中第一个代码块的语言标记', () => {
      const range = getLangSelectionRange(mainEditor.getValue(), 0);
      expect(range).not.toBeNull();

      mainEditor.setSelection(range!.from, range!.to);
      const selection = mainEditor.getSelection();
      expect(selection).toBe('javascript');
    });

    it('$setLangSelection: 选中第二个代码块的语言标记', () => {
      const range = getLangSelectionRange(mainEditor.getValue(), 1);
      expect(range).not.toBeNull();

      mainEditor.setSelection(range!.from, range!.to);
      const selection = mainEditor.getSelection();
      expect(selection).toBe('python');
    });
  });

  // ============================================================================
  // 语言切换
  // ============================================================================
  describe('语言切换（$changeLang 行为）', () => {
    it('应该能替换代码块语言', () => {
      // 1. 定位语言标记
      const range = getLangSelectionRange(mainEditor.getValue(), 0);
      expect(range).not.toBeNull();

      // 2. 选中语言标记
      mainEditor.setSelection(range!.from, range!.to);
      expect(mainEditor.getSelection()).toBe('javascript');

      // 3. 替换为新语言（模拟 $changeLang → replaceSelection(lang, 'around')）
      mainEditor.replaceSelection('typescript');

      // 4. 验证结果
      const newBlocks = collectCodeBlocks(mainEditor.getValue());
      expect(newBlocks[0].lang).toBe('typescript');
    });

    it('应该能将语言切换为空', () => {
      const range = getLangSelectionRange(mainEditor.getValue(), 0);
      mainEditor.setSelection(range!.from, range!.to);
      mainEditor.replaceSelection('');

      const content = mainEditor.getValue();
      // 第一个代码块应该没有语言标记了
      expect(content).toContain('```\nconst x = 1;');
    });

    it('切换语言不影响代码内容', () => {
      const beforeBlocks = collectCodeBlocks(mainEditor.getValue());
      const beforeCode = beforeBlocks[0].code;

      const range = getLangSelectionRange(mainEditor.getValue(), 0);
      mainEditor.setSelection(range!.from, range!.to);
      mainEditor.replaceSelection('rust');

      // 验证代码内容没有改变（只是语言变了）
      const afterBlocks = collectCodeBlocks(mainEditor.getValue());
      expect(afterBlocks[0].code).toContain('const x = 1;');
    });
  });

  // ============================================================================
  // 代码块编辑同步
  // ============================================================================
  describe('代码块编辑同步（内嵌编辑器 → 主编辑器）', () => {
    /**
     * 模拟 $drawEditor 中的行为：
     * 1. 选中主编辑器中的代码块内容
     * 2. 创建内嵌编辑器，设值为选中内容
     * 3. 内嵌编辑器 change 时，replaceSelection 回主编辑器
     */
    it('编辑代码块应该同步回主编辑器', () => {
      // 1. 选中代码块内容
      const range = getBlockSelectionRange(mainEditor.getValue(), 0);
      mainEditor.setSelection(range!.to, range!.from);
      const originalCode = mainEditor.getSelection();

      // 2. 创建内嵌编辑器（用 Mock 代替真实 CM）
      const codeBlockEditor = createExtendedMockEditorAdapter('');
      codeBlockEditor.setValue(originalCode);

      // 3. 模拟用户编辑代码
      codeBlockEditor.setValue(originalCode + '\nconst z = 3;');

      // 4. 同步回主编辑器（模拟 change 回调中的 replaceSelection）
      mainEditor.replaceSelection(codeBlockEditor.getValue());

      // 5. 验证主编辑器内容已更新
      expect(mainEditor.getValue()).toContain('const z = 3;');
    });

    it('编辑代码块不应影响其他代码块', () => {
      // 选中第一个代码块
      const range = getBlockSelectionRange(mainEditor.getValue(), 0);
      mainEditor.setSelection(range!.to, range!.from);

      // 替换内容
      mainEditor.replaceSelection('const newCode = true;');

      // 第二个代码块应该不受影响
      const blocks = collectCodeBlocks(mainEditor.getValue());
      // 至少应该还有 python 代码块
      const pythonBlock = blocks.find((b) => b.lang === 'python');
      expect(pythonBlock).toBeDefined();
      expect(pythonBlock!.code).toContain('def hello()');
    });
  });

  // ============================================================================
  // 代码块编辑器生命周期
  // ============================================================================
  describe('代码块编辑器生命周期', () => {
    it('创建编辑器：getValue/setValue/getSelection 基础操作', () => {
      const blockEditor = createExtendedMockEditorAdapter('');

      // setValue 初始化内容
      blockEditor.setValue('const x = 1;\nconst y = 2;');
      expect(blockEditor.getValue()).toBe('const x = 1;\nconst y = 2;');

      // getSelection（无选区时返回空）
      expect(blockEditor.getSelection()).toBe('');
    });

    it('编辑器 focus 和事件监听', () => {
      const blockEditor = createExtendedMockEditorAdapter('code here');

      // focus
      blockEditor.focus();
      expect(blockEditor.hasFocus()).toBe(true);

      // 监听 change 事件
      const changeHandler = vi.fn();
      blockEditor.on('change', changeHandler);
      blockEditor.setValue('new code');
      expect(changeHandler).toHaveBeenCalled();
    });

    it('编辑器 getWrapperElement 应返回 DOM 元素', () => {
      const blockEditor = createExtendedMockEditorAdapter('code');
      const wrapper = blockEditor.getWrapperElement();
      expect(wrapper).toBeInstanceOf(HTMLElement);
    });
  });

  // ============================================================================
  // 边界情况
  // ============================================================================
  describe('边界情况', () => {
    it('空代码块', () => {
      mainEditor.setValue('```\n\n```');
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks.length).toBe(1);
    });

    it('多个连续代码块', () => {
      mainEditor.setValue('```js\na\n```\n```py\nb\n```\n```go\nc\n```');
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks.length).toBe(3);
    });

    it('嵌套反引号（4个反引号包裹3个反引号）', () => {
      const content = '````\n```\ninner\n```\n````';
      mainEditor.setValue(content);
      // 外层4个反引号应该被匹配
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks.length).toBeGreaterThanOrEqual(1);
    });

    it('代码块中包含中文', () => {
      mainEditor.setValue('```\n你好世界\nconsole.log("中文");\n```');
      const blocks = collectCodeBlocks(mainEditor.getValue());
      expect(blocks.length).toBe(1);
      expect(blocks[0].code).toContain('你好世界');
    });
  });
});
