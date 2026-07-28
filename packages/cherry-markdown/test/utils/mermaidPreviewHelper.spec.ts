/**
 * mermaid 预览辅助逻辑单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  countMermaidFigures,
  getMermaidFigureByIndex,
  getMermaidPreviewRoot,
  getMermaidVisualElement,
  hasMermaidRenderedContent,
  isMermaidPreviewVisible,
} from '@/utils/mermaidPreviewHelper';

function zeroRect(): DOMRect {
  return {
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

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

  it('优先使用 layout 尺寸判断 svg 可见性', () => {
    const root = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    Object.defineProperty(svg, 'offsetWidth', { configurable: true, value: 0 });
    Object.defineProperty(svg, 'offsetHeight', { configurable: true, value: 0 });
    const rect: DOMRect = {
      width: 160,
      height: 90,
      top: 0,
      right: 160,
      bottom: 90,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
    svg.getBoundingClientRect = () => rect;
    root.appendChild(svg);

    expect(getMermaidVisualElement(root)).toBe(svg);
    expect(hasMermaidRenderedContent(root)).toBe(true);
  });

  it('layout 与 attribute 缺失时应回退到 offset 尺寸', () => {
    const root = document.createElement('div');
    const image = document.createElement('img');
    image.className = 'svg-img';
    image.getBoundingClientRect = zeroRect;
    Object.defineProperty(image, 'offsetWidth', { configurable: true, value: 120 });
    Object.defineProperty(image, 'offsetHeight', { configurable: true, value: 64 });
    root.appendChild(image);

    expect(getMermaidVisualElement(root)).toBe(image);
    expect(hasMermaidRenderedContent(root)).toBe(true);
  });

  it('缺少有效高度时应判定为未渲染可见内容', () => {
    const root = document.createElement('div');
    const image = document.createElement('img');
    image.className = 'svg-img';
    image.setAttribute('width', '100');
    image.getBoundingClientRect = zeroRect;
    Object.defineProperty(image, 'offsetWidth', { configurable: true, value: 0 });
    Object.defineProperty(image, 'offsetHeight', { configurable: true, value: 0 });
    root.appendChild(image);

    expect(hasMermaidRenderedContent(root)).toBe(false);
  });

  it('缺少有效宽度时应判定为未渲染可见内容', () => {
    const root = document.createElement('div');
    const image = document.createElement('img');
    image.className = 'svg-img';
    image.setAttribute('height', '80');
    image.getBoundingClientRect = zeroRect;
    Object.defineProperty(image, 'offsetWidth', { configurable: true, value: 0 });
    Object.defineProperty(image, 'offsetHeight', { configurable: true, value: 0 });
    root.appendChild(image);

    expect(hasMermaidRenderedContent(root)).toBe(false);
  });

  it('缺少 figure、预览容器或 data-type 不匹配时不可见', () => {
    const figure = document.createElement('figure');
    figure.setAttribute('data-type', 'plantuml');
    figure.innerHTML = '<svg width="100" height="80"></svg>';
    previewerDom.appendChild(figure);

    expect(isMermaidPreviewVisible(null, previewerDom)).toBe(false);
    expect(isMermaidPreviewVisible(figure, null)).toBe(false);
    expect(isMermaidPreviewVisible(figure, previewerDom)).toBe(false);
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

  it('空预览区或负 index 不返回 figure', () => {
    const fig = document.createElement('figure');
    fig.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(fig);

    expect(countMermaidFigures(null)).toBe(0);
    expect(getMermaidFigureByIndex(null, 0)).toBeNull();
    expect(getMermaidFigureByIndex(previewerDom, -1)).toBeNull();
    expect(getMermaidFigureByIndex(previewerDom, 2)).toBeNull();
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
