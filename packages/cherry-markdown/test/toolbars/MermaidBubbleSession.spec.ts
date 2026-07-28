/**
 * MermaidBubbleSession 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test';
import { Text } from '@codemirror/state';
import imgSizeHandler from '@/utils/imgSizeHandler';
import imgToolHandler from '@/utils/imgToolHandler';
import MermaidBubbleSession from '@/toolbars/MermaidBubbleSession';

const originalClearPreviewUpdateTimer = imgSizeHandler.$clearPreviewUpdateTimer;

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

function createSession(host: object) {
  return new MermaidBubbleSession(host as never);
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
    imgSizeHandler.onPositionUpdated = null;
    imgSizeHandler.$clearPreviewUpdateTimer = originalClearPreviewUpdateTimer;
    imgToolHandler.isMermaid = false;
    imgToolHandler.img = null;
    imgToolHandler.previewerDom = null;
    imgToolHandler.resolveTarget = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes editor anchors and exposes handler callbacks for a selected Mermaid figure', () => {
    const blockA = 'graph TD\n  A-->B';
    const blockB = 'graph TD\n  C-->D';
    const md = `\`\`\`mermaid #400px #center\n${blockA}\n\`\`\`\n\n\`\`\`mermaid\n${blockB}\n\`\`\``;
    const fig0 = createFigure();
    const fig1 = createFigure();
    previewerDom.append(fig0, fig1);
    const host = createHost(previewerDom, md);
    const session = createSession(host);
    const onInvalidTarget = vi.fn();

    expect(session.beginEdit(document.createElement('figure'))).toBe(false);
    expect(session.beginEdit(fig0)).toBe(true);
    expect(session.anchorBody).toBe(blockA);
    expect(session.previewIndex).toBe(0);
    expect(session.size).toBe('#400px');
    expect(session.align).toBe('#center');
    expect(session.hasExtend).toBe(true);
    expect(host.editor.editor.setSelection).toHaveBeenCalledWith(session.extendFrom, session.extendTo);

    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = fig0;
    const options = session.createHandlerOptions(onInvalidTarget);
    expect(options.validateTarget()).toBe(true);
    expect(options.resolveTarget()).toBe(fig0);
    expect(options.onInvalidTarget).toBe(onInvalidTarget);
  });

  it('rebounds handlers after preview updates and syncs toolbar positions', () => {
    const blockA = 'graph TD\n  A-->B';
    const blockB = 'graph TD\n  C-->D';
    const md = `\`\`\`mermaid\n${blockA}\n\`\`\`\n\n\`\`\`mermaid\n${blockB}\n\`\`\``;
    const fig0 = createFigure();
    const fig1 = createFigure();
    previewerDom.append(fig0, fig1);
    const host = createHost(previewerDom, md);
    const session = createSession(host);
    session.beginEdit(fig1);

    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = fig1;
    imgToolHandler.img = fig1;
    host.bubbleHandler.click = imgSizeHandler;
    host.bubbleHandler.imgTool = imgToolHandler;

    const sizeUpdate = vi.spyOn(imgSizeHandler, 'updatePosition').mockImplementation(() => {});
    const toolRefresh = vi.spyOn(imgToolHandler, 'refreshTarget').mockImplementation(() => {});
    const toolUpdate = vi.spyOn(imgToolHandler, 'updatePosition').mockImplementation(() => {});
    vi.spyOn(imgSizeHandler, '$isResizing').mockReturnValue(false);

    session.bindPositionFollow();
    imgSizeHandler.onPositionUpdated?.();
    expect(toolRefresh).toHaveBeenCalledOnce();
    expect(toolUpdate).toHaveBeenCalledOnce();

    session.schedulePositionSync();
    fig1.dispatchEvent(new Event('transitionend'));
    expect(sizeUpdate).toHaveBeenCalled();
    expect(toolRefresh).toHaveBeenCalledTimes(2);
    expect(toolUpdate).toHaveBeenCalledTimes(2);

    session.disposeHandlers();
    expect(imgSizeHandler.onPositionUpdated).toBeNull();
  });

  it('handles inactive, resizing, missing figure, and non-Mermaid handler branches', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);
    const sizeUpdate = vi.spyOn(imgSizeHandler, 'updatePosition').mockImplementation(() => {});
    const toolRefresh = vi.spyOn(imgToolHandler, 'refreshTarget').mockImplementation(() => {});
    const toolUpdate = vi.spyOn(imgToolHandler, 'updatePosition').mockImplementation(() => {});
    const clearPreviewUpdateTimer = vi.fn();
    imgSizeHandler.$clearPreviewUpdateTimer = clearPreviewUpdateTimer;

    expect(session.beginEdit(figure)).toBe(true);
    expect(session.beginEdit(figure)).toBe(true);
    expect(session.beginEdit(document.createElement('figure'))).toBe(false);

    host.bubbleHandler.imgTool = null;
    session.bindPositionFollow();
    imgSizeHandler.onPositionUpdated?.();
    expect(toolRefresh).not.toHaveBeenCalled();
    expect(toolUpdate).not.toHaveBeenCalled();

    imgSizeHandler.img = figure;
    imgSizeHandler.isMermaid = false;
    expect(session.resolveFigure()).toBe(figure);
    expect(session.isActive()).toBe(false);
    session.schedulePositionSync();
    expect(clearPreviewUpdateTimer).not.toHaveBeenCalled();

    imgSizeHandler.isMermaid = true;
    host.bubbleHandler.click = imgSizeHandler;
    vi.spyOn(imgSizeHandler, '$isResizing').mockReturnValue(true);
    expect(session.isValid()).toBe(true);
    session.applyHandlerPositions();
    expect(sizeUpdate).not.toHaveBeenCalled();
    session.schedulePositionSync();
    expect(clearPreviewUpdateTimer).not.toHaveBeenCalled();

    vi.mocked(imgSizeHandler.$isResizing).mockReturnValue(false);
    imgSizeHandler.img = null;
    const onInvalidTarget = vi.fn();
    session.schedulePositionSync(onInvalidTarget);
    expect(clearPreviewUpdateTimer).toHaveBeenCalledOnce();
    expect(onInvalidTarget).not.toHaveBeenCalled();
    expect(sizeUpdate).toHaveBeenCalledOnce();
  });

  it('clears stale timers and transition listeners during reset and disposal', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);
    const removeEventListener = vi.spyOn(figure, 'removeEventListener');

    expect(session.beginEdit(figure)).toBe(true);
    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = figure;
    host.bubbleHandler.click = imgSizeHandler;
    vi.spyOn(imgSizeHandler, '$isResizing').mockReturnValue(false);

    session.schedulePositionSync();
    expect(session.positionSyncTimer).not.toBeNull();
    expect(session.positionTransitionFigure).toBe(figure);

    session.scheduleAsyncValidityCheck();
    expect(session.asyncValidityTimer).not.toBeNull();

    session.reset();

    expect(session.positionSyncTimer).toBeNull();
    expect(session.asyncValidityTimer).toBeNull();
    expect(session.positionTransitionFigure).toBeNull();
    expect(session.positionTransitionHandler).toBeNull();
    const [eventName, handler] = removeEventListener.mock.calls[0] ?? [];
    expect(eventName).toBe('transitionend');
    expect(typeof handler).toBe('function');
  });

  it('returns invalid when editor anchors or preview targets disappear', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.getEditorIndex()).toBe(-1);
    expect(session.beginEdit(figure)).toBe(true);
    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = figure;

    figure.remove();
    expect(session.resolveFigure()).toBeNull();
    expect(session.isValid()).toBe(false);

    session.selfEditing = true;
    expect(session.isValid({ strict: false })).toBe(true);
    expect(session.isValid({ strict: true })).toBe(false);

    previewerDom.appendChild(figure);
    host.editor.editor.view.state.doc = Text.of(['```mermaid', 'graph TD', '  C-->D', '```']);
    expect(session.getEditorIndex()).toBe(-1);
    expect(session.resolveFigure()).toBeNull();
    expect(session.isValid()).toBe(false);
  });

  it('writes Mermaid size and alignment changes back to the language line', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(figure)).toBe(true);
    session.changeSize({ width: 123.4, height: 78.6 });
    expect(host.editor.editor.replaceSelection).toHaveBeenCalledWith(' #123px #79px', 'around');
    expect(session.hasExtend).toBe(true);
    expect(session.size).toBe('#123px #79px');

    session.changeAlign('float-right');
    expect(host.editor.editor.replaceSelection).toHaveBeenLastCalledWith('#123px #79px #float-right', 'around');
    expect(session.align).toBe('#float-right');

    session.changeAlign('clear-align');
    expect(host.editor.editor.replaceSelection).toHaveBeenLastCalledWith('#123px #79px', 'around');
    expect(session.align).toBe('');
    session.changeAlign('unsupported');
    expect(host.editor.editor.replaceSelection).toHaveBeenCalledTimes(3);
  });

  it('ignores layout writes when editor or values are unavailable', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(figure)).toBe(true);
    session.applyLayoutValue();
    expect(host.editor.editor.replaceSelection).not.toHaveBeenCalled();

    const hostWithoutEditor = { ...host, editor: null };
    const sessionWithoutEditor = createSession(hostWithoutEditor);
    sessionWithoutEditor.size = '#100px #80px';
    sessionWithoutEditor.applyLayoutValue();
    expect(sessionWithoutEditor.selfEditing).toBe(true);
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
    const session = createSession(host);

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
    const session = createSession(host);

    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = fig1;
    host.bubbleHandler.click = imgSizeHandler;

    session.beginEdit(fig1);
    vi.spyOn(session, 'isValid').mockReturnValue(false);

    session.onAsyncRenderDone();
    vi.advanceTimersByTime(500);

    expect(host.$checkAndRemoveInvalidImgHandlers).toHaveBeenCalledWith({ strict: true });
  });

  it('rejects edit startup when editor state or Mermaid source context is unavailable', () => {
    const figure = createFigure();
    previewerDom.appendChild(figure);

    const hostWithoutEditor = {
      ...createHost(previewerDom, '```mermaid\ngraph TD\n  A-->B\n```'),
      editor: null,
    };
    expect(createSession(hostWithoutEditor).beginEdit(figure)).toBe(false);

    const hostWithoutMermaidSource = createHost(previewerDom, 'plain text without Mermaid fences');
    expect(createSession(hostWithoutMermaidSource).beginEdit(figure)).toBe(false);
  });

  it('treats stale editor anchors and missing resolved figures as invalid targets', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(figure)).toBe(true);
    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = figure;

    vi.spyOn(session, 'getEditorIndex').mockReturnValue(-1);
    vi.spyOn(session, 'resolveFigure').mockReturnValue(figure);

    expect(session.isValid()).toBe(false);
  });

  it('handles preview index drift and null figure lookup during rebind', () => {
    const blockA = 'graph TD\n  A-->B';
    const blockB = 'graph TD\n  C-->D';
    const md = `\`\`\`mermaid\n${blockA}\n\`\`\`\n\n\`\`\`mermaid\n${blockB}\n\`\`\``;
    const fig0 = createFigure();
    const fig1 = createFigure();
    previewerDom.append(fig0, fig1);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(fig1)).toBe(true);
    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = fig1;

    fig1.remove();
    expect(session.resolveFigure()).toBeNull();

    previewerDom.appendChild(fig1);
    const driftingFigureList = new Proxy(document.querySelectorAll('figure[data-type="missing-mermaid"]'), {
      get(target, property, receiver) {
        if (property === 'length') {
          return 2;
        }
        return Reflect.get(target, property, receiver);
      },
    });
    const querySelectorAll = vi.spyOn(previewerDom, 'querySelectorAll');
    querySelectorAll.mockReturnValue(driftingFigureList);
    expect(session.resolveFigure()).toBeNull();
  });

  it('uses the default remover when delayed position sync finds an invalid target', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(figure)).toBe(true);
    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = figure;
    host.bubbleHandler.click = imgSizeHandler;
    vi.spyOn(imgSizeHandler, '$isResizing').mockReturnValue(false);
    vi.spyOn(session, 'isValid').mockReturnValue(false);

    session.schedulePositionSync();
    vi.advanceTimersByTime(120);

    expect(host.$removeImgPreviewerBubbles).toHaveBeenCalledOnce();
  });

  it('skips async validity work when the Mermaid session is inactive', () => {
    const host = createHost(previewerDom, '```mermaid\ngraph TD\n  A-->B\n```');
    const session = createSession(host);
    const resolveFigure = vi.spyOn(session, 'resolveFigure');
    const isValid = vi.spyOn(session, 'isValid');

    imgSizeHandler.isMermaid = false;
    session.scheduleAsyncValidityCheck();
    vi.advanceTimersByTime(0);

    expect(resolveFigure).not.toHaveBeenCalled();
    expect(isValid).not.toHaveBeenCalled();
    expect(host.$checkAndRemoveInvalidImgHandlers).not.toHaveBeenCalled();
  });

  it('keeps self-editing active until the rebound preview becomes visible', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const invisibleFigure = document.createElement('figure');
    invisibleFigure.setAttribute('data-type', 'mermaid');
    previewerDom.appendChild(invisibleFigure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(invisibleFigure)).toBe(true);
    imgSizeHandler.isMermaid = true;
    imgSizeHandler.img = invisibleFigure;
    host.bubbleHandler.click = imgSizeHandler;
    session.selfEditing = true;

    session.clearSelfEditingIfReady();
    expect(session.selfEditing).toBe(true);

    imgSizeHandler.isMermaid = false;
    session.clearSelfEditingIfReady();
    expect(session.selfEditing).toBe(false);

    session.selfEditing = false;
    imgSizeHandler.isMermaid = true;
    session.clearSelfEditingIfReady();
    expect(session.selfEditing).toBe(false);

    const visibleFigure = createFigure();
    previewerDom.replaceChildren(visibleFigure);
    imgSizeHandler.img = visibleFigure;
    session.selfEditing = true;
    session.clearSelfEditingIfReady();
    expect(session.selfEditing).toBe(false);
  });

  it('writes each supported alignment token and ignores unsupported alignment values', () => {
    const block = 'graph TD\n  A-->B';
    const md = `\`\`\`mermaid\n${block}\n\`\`\``;
    const figure = createFigure();
    previewerDom.appendChild(figure);
    const host = createHost(previewerDom, md);
    const session = createSession(host);

    expect(session.beginEdit(figure)).toBe(true);
    session.size = '#100px #80px';
    session.hasExtend = true;

    for (const align of ['left', 'right', 'center', 'float-left', 'float-right']) {
      session.changeAlign(align);
      expect(session.align).toBe(`#${align}`);
      expect(host.editor.editor.replaceSelection).toHaveBeenLastCalledWith(`#100px #80px #${align}`, 'around');
    }

    const writeCount = host.editor.editor.replaceSelection.mock.calls.length;
    session.changeAlign('unsupported');
    expect(host.editor.editor.replaceSelection).toHaveBeenCalledTimes(writeCount);
  });
});
