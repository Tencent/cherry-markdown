/**
 * mermaid 编辑器侧锚点逻辑测试
 */

import { describe, it, expect } from 'vite-plus/test';
import { Text } from '@codemirror/state';
import {
  buildMermaidEditContext,
  findMermaidBlockIndexByCodeBody,
  getMermaidBlockAtPreviewIndex,
  getMermaidLangLineNumber,
  isMermaidLangLine,
  listMermaidBlocks,
  parseMermaidLayoutFromLangLine,
} from '@/utils/mermaidEditorHelper';

describe('mermaidEditorHelper', () => {
  it('应识别 mermaid 语言行', () => {
    expect(isMermaidLangLine('mermaid #400px #center')).toBe(true);
    expect(isMermaidLangLine('FLOW TD #auto #float-left')).toBe(true);
    expect(isMermaidLangLine('flow lr')).toBe(true);
    expect(isMermaidLangLine('seq #right')).toBe(true);
    expect(isMermaidLangLine('javascript')).toBe(false);
  });

  it('应按顺序列出 mermaid 块', () => {
    const md = `\`\`\`mermaid
graph TD
  A-->B
\`\`\`

\`\`\`mermaid #center
graph TD
  C-->D
\`\`\``;

    const blocks = listMermaidBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].codeBody).toContain('A-->B');
    expect(blocks[1].codeBody).toContain('C-->D');
  });

  it('应跳过空内容和非 mermaid 代码块', () => {
    const md = `\`\`\`js
console.log('skip');
\`\`\`

\`\`\`flow lr #auto
A-->B
\`\`\`

\`\`\`seq #left
A->B: hi
\`\`\``;

    expect(listMermaidBlocks('')).toHaveLength(0);
    const blocks = listMermaidBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      index: 0,
      langLine: 'flow lr #auto',
      fence: '```',
    });
    expect(blocks[1].langLine).toBe('seq #left');
  });

  it('应支持缩进与加长 fence 的 mermaid 代码块', () => {
    const md = '   ````mermaid #center\ngraph TD\n  A-->B\n   ````';

    const [block] = listMermaidBlocks(md);
    expect(block.leadingContent).toBe('   ');
    expect(block.fence).toBe('````');
    expect(block.codeBody).toContain('A-->B');
    expect(getMermaidLangLineNumber(md, block)).toBe(0);
  });

  it('删上方邻居后应按源码锚点找到新 index', () => {
    const blockA = 'graph TD\n  A-->B';
    const blockB = 'graph TD\n  C-->D';
    const mdWithTwo = `\`\`\`mermaid\n${blockA}\n\`\`\`\n\n\`\`\`mermaid\n${blockB}\n\`\`\``;
    const mdWithOne = `\`\`\`mermaid\n${blockB}\n\`\`\``;

    expect(findMermaidBlockIndexByCodeBody(mdWithTwo, blockB)).toBe(1);
    expect(findMermaidBlockIndexByCodeBody(mdWithOne, blockB)).toBe(0);
  });

  it('删除选中块后应找不到锚点', () => {
    const blockB = 'graph TD\n  C-->D';
    const md = '```mermaid\ngraph TD\n  A-->B\n```';

    expect(findMermaidBlockIndexByCodeBody(md, blockB)).toBe(-1);
    expect(findMermaidBlockIndexByCodeBody(md, '')).toBe(-1);
  });

  it('正文相同块应优先命中 anchorPreviewIndex', () => {
    const body = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${body}\n\`\`\`\n\n\`\`\`mermaid\n${body}\n\`\`\``;

    expect(findMermaidBlockIndexByCodeBody(md, body, 0)).toBe(0);
    expect(findMermaidBlockIndexByCodeBody(md, body, 1)).toBe(1);
    expect(findMermaidBlockIndexByCodeBody(md, body, 3)).toBe(0);
    expect(findMermaidBlockIndexByCodeBody(md, body)).toBe(0);
  });

  it('应解析语言行上的尺寸与对齐扩展参数', () => {
    const layout = parseMermaidLayoutFromLangLine('```mermaid #400px #300px #center');
    expect(layout.size).toBe('#400px #300px');
    expect(layout.align).toBe('#center');
    expect(layout.hasExtend).toBe(true);
    expect(layout.extendLength).toBeGreaterThan(0);
  });

  it('应解析只有对齐没有尺寸的扩展参数', () => {
    const layout = parseMermaidLayoutFromLangLine('```mermaid #center');
    expect(layout.size).toBe('');
    expect(layout.align).toBe('#center');
    expect(layout.hasExtend).toBe(true);
  });

  it('无布局扩展时应返回语言行末尾作为插入位置', () => {
    const layout = parseMermaidLayoutFromLangLine('```mermaid');
    expect(layout.size).toBe('');
    expect(layout.align).toBe('');
    expect(layout.hasExtend).toBe(false);
    expect(layout.extendStartInLine).toBe('```mermaid'.length);
    expect(layout.extendLength).toBe(0);
  });

  it('布局片段不在语言行末尾时不作为可编辑扩展区', () => {
    const layout = parseMermaidLayoutFromLangLine('```mermaid #400px #right note');
    expect(layout.size).toBe('#400px');
    expect(layout.align).toBe('#right');
    expect(layout.hasExtend).toBe(false);
    expect(layout.extendStartInLine).toBe('```mermaid #400px #right note'.length);
  });

  it('应按预览 index 读取对应代码块并处理越界', () => {
    const md = `\`\`\`mermaid
graph TD
  A-->B
\`\`\``;

    expect(getMermaidBlockAtPreviewIndex(md, -1)).toBeNull();
    expect(getMermaidBlockAtPreviewIndex(md, 1)).toBeNull();
    expect(getMermaidBlockAtPreviewIndex(md, 0)?.codeBody).toContain('A-->B');
  });

  it('应构建 mermaid 布局编辑上下文', () => {
    const md = `\`\`\`mermaid #400px #center
graph TD
  A-->B
\`\`\``;
    const doc = Text.of(md.split('\n'));
    const ctx = buildMermaidEditContext(md, 0, doc);

    expect(ctx).not.toBeNull();
    expect(ctx?.anchorBody).toContain('A-->B');
    expect(ctx?.size).toBe('#400px');
    expect(ctx?.align).toBe('#center');
    expect(ctx?.hasExtend).toBe(true);
    expect(ctx?.extendFrom).toBeLessThan(ctx?.extendTo ?? 0);
  });

  it('构建无扩展参数的上下文时选区应落在语言行末尾', () => {
    const md = `\`\`\`mermaid
graph TD
  A-->B
\`\`\``;
    const doc = Text.of(md.split('\n'));
    const ctx = buildMermaidEditContext(md, 0, doc);

    expect(ctx).not.toBeNull();
    expect(ctx?.size).toBe('');
    expect(ctx?.align).toBe('');
    expect(ctx?.hasExtend).toBe(false);
    expect(ctx?.extendFrom).toBe(ctx?.extendTo);
  });

  it('缺少代码块或文档时不构建编辑上下文', () => {
    const md = '```js\nconsole.log(1)\n```';
    const doc = Text.of(md.split('\n'));

    expect(buildMermaidEditContext(md, 0, doc)).toBeNull();
    expect(buildMermaidEditContext('```mermaid\ngraph TD\n```', 0, null)).toBeNull();
  });
});
