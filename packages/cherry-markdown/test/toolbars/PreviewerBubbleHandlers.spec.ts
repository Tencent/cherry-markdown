import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import imgSizeHandler from '../../src/utils/imgSizeHandler';
import imgToolHandler from '../../src/utils/imgToolHandler';
import { createRect } from '../helpers/previewer';
import { createPreviewerBubble } from '../helpers/previewerBubble';

vi.mock('../../src/utils/imgSizeHandler', () => ({
  default: {
    showBubble: vi.fn(),
    bindChange: vi.fn(),
    updatePosition: vi.fn(),
    remove: vi.fn(),
    $isResizing: vi.fn(() => false),
    img: null,
    isMermaid: false,
  },
}));

vi.mock('../../src/utils/imgToolHandler', () => ({
  default: {
    showBubble: vi.fn(),
    bindChange: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../src/utils/footnoteHoverHandler', () => ({
  default: class TestFootnoteHandler {
    showBubble = vi.fn();
    emit = vi.fn();
    aElement;

    constructor(_trigger, element) {
      this.aElement = element;
    }
  },
}));

vi.mock('../../src/utils/tableContentHandler', () => ({
  default: class TestTableHandler {
    showBubble = vi.fn();
    emit = vi.fn();
    tableElement;
    target;

    constructor(_trigger, target, _bubble, _previewer, _editor, tableElement) {
      this.target = target;
      this.tableElement = tableElement;
    }
  },
}));

vi.mock('../../src/utils/codeBlockContentHandler', () => ({
  default: class TestCodeHandler {
    showBubble = vi.fn();
    emit = vi.fn();
    target;

    constructor(_trigger, target) {
      this.target = target;
    }
  },
}));

vi.mock('../../src/utils/formulaUtilsHandler', () => ({
  default: class TestFormulaHandler {
    showBubble = vi.fn();
    emit = vi.fn();
  },
}));

vi.mock('../../src/utils/listContentHandler', () => ({
  default: class TestListHandler {
    emit = vi.fn();
  },
}));

vi.mock('../../src/toolbars/MermaidBubbleSession', () => ({
  default: class TestMermaidSession {
    previewIndex = 2;
    beginEdit = vi.fn(() => true);
    createHandlerOptions = vi.fn((onInvalidTarget) => ({ onInvalidTarget }));
    bindPositionFollow = vi.fn();
    changeSize = vi.fn();
    changeAlign = vi.fn();
    disposeHandlers = vi.fn();
    reset = vi.fn();
    isActive = vi.fn(() => false);
    isValid = vi.fn(() => true);
    onPreviewUpdate = vi.fn();
    onAsyncRenderDone = vi.fn();
    clearSelfEditingIfReady = vi.fn();
  },
}));

function enableHandlerContext() {
  const fixture = createPreviewerBubble();
  const editor = { editor: { view: {} } };
  Reflect.set(fixture.bubble, 'editor', editor);
  Reflect.set(fixture.previewer, 'editor', editor);
  Reflect.set(fixture.cherry, 'getLocales', () => ({ copy: 'Copy' }));
  return fixture;
}

describe('toolbars/PreviewerBubble handler integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Reflect.set(imgSizeHandler, 'remove', vi.fn());
    Reflect.set(imgSizeHandler, 'img', null);
    Reflect.set(imgSizeHandler, 'isMermaid', false);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('creates and reuses footnote and table handlers', () => {
    const { bubble, previewerDom } = enableHandlerContext();
    const anchor = document.createElement('a');
    const cell = document.createElement('td');
    const table = document.createElement('table');
    table.appendChild(cell);
    previewerDom.append(anchor, table);

    bubble.$showFootNoteBubbleCardPreviewerBubbles('hover', anchor, { appendClass: 'custom' });
    expect(bubble.bubble.hover.className).toContain('custom');
    expect(bubble.bubbleHandler.hover.showBubble).toHaveBeenCalledOnce();
    bubble.$showFootNoteBubbleCardPreviewerBubbles('hover', anchor, {});
    expect(bubble.bubbleHandler.hover.showBubble).toHaveBeenCalledTimes(2);
    bubble.$showFootNoteBubbleCardPreviewerBubbles('plain', document.createElement('a'), {});
    expect(bubble.bubble.plain.className).toContain('footnote-ref-hover-handler');

    bubble.$showTablePreviewerBubbles('click', cell, table);
    expect(bubble.bubble.click.className).toContain('table-content-handler');
    expect(bubble.bubbleHandler.click.showBubble).toHaveBeenCalledOnce();
    bubble.$showTablePreviewerBubbles('click', cell, table);
    expect(bubble.bubbleHandler.click.showBubble).toHaveBeenCalledTimes(2);
  });

  it('creates code, formula, and list handlers with the expected editability', () => {
    const { bubble, previewerDom } = enableHandlerContext();
    const code = document.createElement('div');
    const formula = document.createElement('span');
    const list = document.createElement('p');
    previewerDom.append(code, formula, list);

    bubble.showCodeBlockPreviewerBubbles('hover', code);
    expect(bubble.bubbleHandler.hover.showBubble).toHaveBeenCalledWith(true);
    bubble.showCodeBlockPreviewerBubbles('hover', code);
    expect(bubble.bubbleHandler.hover.showBubble).toHaveBeenCalledOnce();

    bubble.$showFormulaPreviewerBubbles('click', formula, { x: 12, y: 24 });
    expect(bubble.bubbleHandler.click.showBubble).toHaveBeenCalledWith(12, 24);
    bubble.$showFormulaPreviewerBubbles('formula', formula);
    expect(bubble.bubbleHandler.formula.showBubble).toHaveBeenCalledWith(0, 0);

    bubble.$showListPreviewerBubbles('list', list);
    expect(bubble.bubbleHandler.list).toBeDefined();

    Reflect.set(bubble, 'editor', null);
    bubble.showCodeBlockPreviewerBubbles('readonly', document.createElement('pre'));
    expect(bubble.bubbleHandler.readonly.showBubble).toHaveBeenCalledWith(false);
  });

  it('creates image handlers and wires validation, changes, and event cleanup', () => {
    const { bubble, previewerDom, wrapperDom, off } = enableHandlerContext();
    document.body.appendChild(wrapperDom);
    const image = document.createElement('img');
    image.src = 'photo.png';
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 120, 80));
    previewerDom.appendChild(image);
    vi.spyOn(bubble, 'beginChangeImgValue').mockReturnValue(true);
    const removeImageBubbles = vi.spyOn(bubble, '$removeImgPreviewerBubbles').mockImplementation(() => {});
    Reflect.set(imgSizeHandler, 'img', image);

    bubble.$showImgPreviewerBubbles(image, new MouseEvent('click'));

    expect(imgSizeHandler.showBubble).toHaveBeenCalled();
    expect(imgSizeHandler.bindChange).toHaveBeenCalled();
    expect(imgToolHandler.showBubble).toHaveBeenCalled();
    expect(imgToolHandler.bindChange).toHaveBeenCalled();
    expect(bubble.bubbleHandler.click).toBe(imgSizeHandler);
    expect(bubble.bubbleHandler.imgTool).toBe(imgToolHandler);

    const sizeOptions = vi.mocked(imgSizeHandler.showBubble).mock.calls[0][3];
    expect(sizeOptions.validateTarget()).toBe(true);
    sizeOptions.onInvalidTarget();
    expect(removeImageBubbles).toHaveBeenCalledOnce();

    imgSizeHandler.remove();
    expect(off).toHaveBeenCalledWith('editor.size.change', expect.any(Function));
  });

  it('returns a no-op handler when image Markdown selection fails', () => {
    const { bubble, previewerDom } = enableHandlerContext();
    const image = document.createElement('img');
    previewerDom.appendChild(image);
    vi.spyOn(bubble, 'beginChangeImgValue').mockReturnValue(false);

    const result = bubble.$showImgPreviewerBubbles(image, new MouseEvent('click'));

    expect(result?.emit()).toBeUndefined();
    expect(imgSizeHandler.showBubble).not.toHaveBeenCalled();
  });

  it('handles disabled, source-mode, rejected, and successful Mermaid sessions', () => {
    const { bubble, previewerDom, off } = enableHandlerContext();
    const figure = document.createElement('figure');
    figure.dataset.type = 'mermaid';
    previewerDom.appendChild(figure);
    const removeImageBubbles = vi.spyOn(bubble, '$removeImgPreviewerBubbles').mockImplementation(() => {});

    bubble.previewer.options.enablePreviewerBubble = false;
    bubble.$showMermaidPreviewerBubbles(figure, new MouseEvent('click'));
    expect(bubble.mermaidSession.beginEdit).not.toHaveBeenCalled();

    bubble.previewer.options.enablePreviewerBubble = true;
    figure.innerHTML = '<div class="cherry-mermaid-source-toolbar-panel active" data-mode="source"></div>';
    bubble.$showMermaidPreviewerBubbles(figure, new MouseEvent('click'));
    expect(bubble.mermaidSession.beginEdit).not.toHaveBeenCalled();

    figure.innerHTML = '';
    vi.spyOn(bubble.mermaidSession, 'beginEdit').mockReturnValueOnce(false);
    bubble.$showMermaidPreviewerBubbles(figure, new MouseEvent('click'));
    expect(imgSizeHandler.showBubble).not.toHaveBeenCalled();

    bubble.$showMermaidPreviewerBubbles(figure, new MouseEvent('click'));
    expect(imgSizeHandler.showBubble).toHaveBeenCalled();
    expect(imgToolHandler.showBubble).toHaveBeenCalled();
    expect(bubble.mermaidSession.bindPositionFollow).toHaveBeenCalledOnce();

    const handlerOptions = vi.mocked(imgSizeHandler.showBubble).mock.calls[0][3];
    handlerOptions.onInvalidTarget();
    expect(removeImageBubbles).toHaveBeenCalledOnce();

    const sizeChange = vi.mocked(imgSizeHandler.bindChange).mock.calls[0][0];
    sizeChange(figure, { width: 300, height: 200 });
    expect(bubble.mermaidSession.changeSize).toHaveBeenCalledWith({ width: 300, height: 200 });
    const alignChange = vi.mocked(imgToolHandler.bindChange).mock.calls[0][0];
    alignChange(figure, 'center');
    expect(bubble.mermaidSession.changeAlign).toHaveBeenCalledWith('center');

    imgSizeHandler.remove();
    expect(off).toHaveBeenCalledWith('editor.size.change', expect.any(Function));
    expect(bubble.mermaidSession.disposeHandlers).toHaveBeenCalledOnce();
  });

  it('recreates invalid table handlers and removes invalid image handlers', () => {
    const { bubble } = enableHandlerContext();
    const remove = vi.spyOn(bubble, '$removePreviewerBubble').mockImplementation(() => {});
    const invalidTable = Object.create(
      Object.getPrototypeOf(
        (() => {
          const fixture = document.createElement('table');
          bubble.$showTablePreviewerBubbles('hover', document.createElement('td'), fixture);
          return bubble.bubbleHandler.hover;
        })(),
      ),
    );
    invalidTable.target = null;
    invalidTable.emit = vi.fn();
    bubble.bubbleHandler.invalid = invalidTable;

    bubble.$checkAndRecreateTableHandlers();
    expect(remove).toHaveBeenCalledWith('invalid');

    bubble.bubbleHandler.click = imgSizeHandler;
    Reflect.set(imgSizeHandler, 'img', null);
    vi.spyOn(bubble, '$removeImgPreviewerBubbles').mockImplementation(() => {});
    bubble.$checkAndRemoveInvalidImgHandlers();
    expect(bubble.$removeImgPreviewerBubbles).toHaveBeenCalledOnce();
  });
});
