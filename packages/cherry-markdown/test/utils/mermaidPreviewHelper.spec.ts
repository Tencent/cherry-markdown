/**
 * mermaid 预览辅助逻辑单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  countMermaidFigures,
  getMermaidFigureByIndex,
  getMermaidPreviewRoot,
  hasMermaidRenderedContent,
  isMermaidPreviewVisible,
} from '@/utils/mermaidPreviewHelper';

describe('mermaidPreviewHelper', () => {
  let previewerDom: HTMLDivElement;

  beforeEach(() => {
    previewerDom = document.createElement('div');
    document.body.appendChild(previewerDom);
  });

  afterEach(() => {
    previewerDom.remove();
  });

  it('figure 内含 svg 时应判定预览可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'mermaid');
    figure.innerHTML = '<svg width="100" height="80"></svg>';
    previewerDom.appendChild(figure);

    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(true);
  });

  it('figure 内含 svg-img 时应判定预览可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'mermaid');
    figure.innerHTML = '<img class="svg-img" width="100" height="80" src="data:image/svg+xml," />';
    previewerDom.appendChild(figure);

    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(true);
  });

  it('渲染失败回退为 codeBlock 时应判定预览不可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'mermaid');
    figure.innerHTML = '<div data-type="codeBlock"><pre>graph TD\n  A-->B</pre></div>';
    previewerDom.appendChild(figure);

    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(false);
  });

  it('figure 被移出预览区时应判定不可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'mermaid');
    figure.innerHTML = '<svg width="100" height="80"></svg>';

    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(false);
  });

  it('工具栏切到源码模式时应判定不可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'mermaid');
    figure.innerHTML = `
      <div class="cherry-mermaid-source-toolbar-panel" data-mode="preview">
        <svg width="100" height="80"></svg>
      </div>
      <div class="cherry-mermaid-source-toolbar-panel active" data-mode="source">
        <div data-type="codeBlock"></div>
      </div>
    `;
    previewerDom.appendChild(figure);

    expect(getMermaidPreviewRoot(figure).getAttribute('data-mode')).toBe('preview');
    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(false);
  });

  it('工具栏 preview panel 内无 svg 时应判定不可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'mermaid');
    figure.innerHTML = `
      <div class="cherry-mermaid-source-toolbar-panel active" data-mode="preview">
        <div data-type="codeBlock"><pre>broken</pre></div>
      </div>
    `;
    previewerDom.appendChild(figure);

    expect(hasMermaidRenderedContent(getMermaidPreviewRoot(figure))).toBe(false);
    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(false);
  });
});

describe('getMermaidFigureByIndex', () => {
  let previewerDom: HTMLDivElement;

  beforeEach(() => {
    previewerDom = document.createElement('div');
    document.body.appendChild(previewerDom);
  });

  afterEach(() => {
    previewerDom.remove();
  });

  it('应按 index 找到 figure', () => {
    const fig1 = document.createElement('figure');
    fig1.setAttribute('data-type', 'mermaid');
    const fig2 = document.createElement('figure');
    fig2.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(fig1);
    previewerDom.appendChild(fig2);

    expect(getMermaidFigureByIndex(previewerDom, 0, 2)).toBe(fig1);
    expect(getMermaidFigureByIndex(previewerDom, 1, 2)).toBe(fig2);
  });

  it('删除选中块后 figure 数量变化应返回 null', () => {
    const fig1 = document.createElement('figure');
    fig1.setAttribute('data-type', 'mermaid');
    const fig2 = document.createElement('figure');
    fig2.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(fig1);
    previewerDom.appendChild(fig2);

    fig1.remove();

    expect(getMermaidFigureByIndex(previewerDom, 0, 2)).toBeNull();
    expect(countMermaidFigures(previewerDom)).toBe(1);
  });

  it('figure 数量不变时布局刷新后仍可按 index 命中', () => {
    const fig = document.createElement('figure');
    fig.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(fig);

    expect(getMermaidFigureByIndex(previewerDom, 0, 1)).toBe(fig);
  });

  it('传入 expectedFigureCount 且数量不一致时返回 null', () => {
    const fig = document.createElement('figure');
    fig.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(fig);

    const neighbor = document.createElement('figure');
    neighbor.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(neighbor);

    expect(getMermaidFigureByIndex(previewerDom, 0, 1)).toBeNull();
  });
});
