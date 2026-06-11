/**
 * MermaidBubbleSession 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Text } from '@codemirror/state';
import imgSizeHandler from '@/utils/imgSizeHandler';
import imgToolHandler from '@/utils/imgToolHandler';
import MermaidBubbleSession from '@/toolbars/MermaidBubbleSession';

function createFigure(svgSize = { width: 100, height: 80 }) {
  const figure = document.createElement('figure');
  figure.setAttribute('data-type', 'mermaid');
  const svg = document.createElement('svg');
  svg.setAttribute('width', String(svgSize.width));
  svg.setAttribute('height', String(svgSize.height));
  Object.defineProperty(svg, 'getBoundingClientRect', {
    value: () => ({
      width: svgSize.width,
      height: svgSize.height,
      top: 0,
      left: 0,
      right: svgSize.width,
      bottom: svgSize.height,
      x: 0,
      y: 0,
    }),
  });
  figure.appendChild(svg);
  return figure;
}

function createHost(previewerDom: HTMLDivElement, md: string) {
  const doc = Text.of(md.split('\n'));
  return {
    previewerDom,
    editor: {
      editor: {
        view: { state: { doc } },
        setSelection: vi.fn(),
        replaceSelection: vi.fn(),
      },
    },
    bubbleHandler: { click: imgSizeHandler, imgTool: imgToolHandler },
    $removeImgPreviewerBubbles: vi.fn(),
    $checkAndRemoveInvalidImgHandlers: vi.fn(),
  };
}

describe('MermaidBubbleSession', () => {
  let previewerDom: HTMLDivElement;

  beforeEach(() => {
    previewerDom = document.createElement('div');
    document.body.appendChild(previewerDom);
    vi.useFakeTimers();
  });

  afterEach(() => {
    previewerDom.remove();
    imgSizeHandler.isMermaid = false;
    imgSizeHandler.img = null;
    imgSizeHandler.onInvalidTarget = null;
    imgSizeHandler.validateTarget = null;
    imgSizeHandler.resolveTarget = null;
    vi.useRealTimers();
  });

  it('邻居异步恢复后应延迟校验，避免上方布局重排误关选中框', () => {
    const blockA = 'graph TD\n  A-->B';
    const blockB = 'graph TD\n  C-->D';
    const md = `\`\`\`mermaid\n${blockA}\n\`\`\`\n\n\`\`\`mermaid\n${blockB}\n\`\`\``;

    const fig0 = createFigure();
    const fig1 = createFigure();
    previewerDom.appendChild(fig0);
    previewerDom.appendChild(fig1);

    const host = createHost(previewerDom, md);
    const session = new MermaidBubbleSession(host as any);

    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = fig1;
    host.bubbleHandler.click = imgSizeHandler;

    session.beginEdit(fig1);

    let strictVisible = true;
    const isValidSpy = vi.spyOn(session, 'isValid').mockImplementation((options = {}) => {
      if (options.strict) {
        return strictVisible;
      }
      return true;
    });

    session.onAsyncRenderDone();

    expect(host.$checkAndRemoveInvalidImgHandlers).not.toHaveBeenCalled();

    strictVisible = true;
    vi.advanceTimersByTime(200);

    expect(isValidSpy).toHaveBeenCalled();
    expect(host.$checkAndRemoveInvalidImgHandlers).not.toHaveBeenCalled();
  });

  it('延迟校验仍失败时应移除操作框', () => {
    const blockB = 'graph TD\n  C-->D';
    const md = `\`\`\`mermaid\ngraph TD\n  A-->B\n\`\`\`\n\n\`\`\`mermaid\n${blockB}\n\`\`\``;

    const fig0 = createFigure();
    const fig1 = createFigure();
    previewerDom.appendChild(fig0);
    previewerDom.appendChild(fig1);

    const host = createHost(previewerDom, md);
    const session = new MermaidBubbleSession(host as any);

    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = fig1;
    host.bubbleHandler.click = imgSizeHandler;

    session.beginEdit(fig1);
    vi.spyOn(session, 'isValid').mockReturnValue(false);

    session.onAsyncRenderDone();
    vi.advanceTimersByTime(500);

    expect(host.$checkAndRemoveInvalidImgHandlers).toHaveBeenCalledWith({ strict: true });
  });
});
