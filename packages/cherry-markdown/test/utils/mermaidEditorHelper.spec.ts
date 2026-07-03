/**
 * mermaid 编辑器侧锚点逻辑测试
 */

import { describe, it, expect } from 'vitest';
import { Text } from '@codemirror/state';
import {
  buildMermaidEditContext,
  findMermaidBlockIndexByCodeBody,
  isMermaidLangLine,
  listMermaidBlocks,
  parseMermaidLayoutFromLangLine,
} from '@/utils/mermaidEditorHelper';

describe('mermaidEditorHelper', () => {
  it('应识别 mermaid 语言行', () => {
    expect(isMermaidLangLine('mermaid #400px #center')).toBe(true);
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
  });

  it('正文相同块应优先命中 anchorPreviewIndex', () => {
    const body = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${body}\n\`\`\`\n\n\`\`\`mermaid\n${body}\n\`\`\``;

    expect(findMermaidBlockIndexByCodeBody(md, body, 0)).toBe(0);
    expect(findMermaidBlockIndexByCodeBody(md, body, 1)).toBe(1);
    expect(findMermaidBlockIndexByCodeBody(md, body)).toBe(0);
  });

  it('应解析语言行上的尺寸与对齐扩展参数', () => {
    const layout = parseMermaidLayoutFromLangLine('```mermaid #400px #300px #center');
    expect(layout.size).toBe('#400px #300px');
    expect(layout.align).toBe('#center');
    expect(layout.hasExtend).toBe(true);
    expect(layout.extendLength).toBeGreaterThan(0);
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
});
