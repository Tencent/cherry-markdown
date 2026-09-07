import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import imgSizeHandler from '../../src/utils/imgSizeHandler';
import { createRect } from '../helpers/previewer';
import { createPreviewerBubble } from '../helpers/previewerBubble';

describe('toolbars/PreviewerBubble production behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('finds closest nodes and applies trigger-specific removal rules', () => {
    const { bubble, wrapperDom, previewerDom } = createPreviewerBubble();
    document.body.appendChild(wrapperDom);
    previewerDom.innerHTML = '<section><span id="nested">nested</span></section>';
    const nested = previewerDom.querySelector('#nested');

    expect(bubble.$getClosestNode(nested, 'SECTION')?.tagName).toBe('SECTION');
    expect(bubble.$getClosestNode(nested, 'TABLE')).toBe(false);
    expect(bubble.$getClosestNode(null, 'TABLE')).toBe(false);
    expect(bubble.$shouldRemoveBubbleKey('hover', '')).toBe(true);
    expect(bubble.$shouldRemoveBubbleKey('click', 'click')).toBe(true);
    expect(bubble.$shouldRemoveBubbleKey('imgTool', 'click')).toBe(true);
    expect(bubble.$shouldRemoveBubbleKey('hover', 'click')).toBe(false);
    expect(bubble.$shouldRemoveBubbleKey('hover', 'hover')).toBe(true);
  });

  it('creates and removes paired bubble containers and handlers', () => {
    const { bubble, wrapperDom } = createPreviewerBubble();
    wrapperDom.style.overflow = 'auto';
    const clickEmit = vi.fn();
    const toolEmit = vi.fn();
    const hoverEmit = vi.fn();
    bubble.$createPreviewerBubbles('click', 'image-handler');
    bubble.$createPreviewerBubbles('hover', 'hover-handler');
    bubble.bubbleHandler.click = { emit: clickEmit };
    bubble.bubbleHandler.imgTool = { emit: toolEmit };
    bubble.bubbleHandler.hover = { emit: hoverEmit };

    bubble.$removeImgPreviewerBubbles();

    expect(clickEmit).toHaveBeenCalledWith('remove');
    expect(toolEmit).toHaveBeenCalledWith('remove');
    expect(hoverEmit).not.toHaveBeenCalled();
    expect(bubble.bubble.hover).toBeDefined();

    bubble.$removePreviewerBubble('hover');
    expect(hoverEmit).toHaveBeenCalledWith('remove');
    expect(wrapperDom.style.overflow).toBe('');
  });

  it('validates image and table handler targets without loose mocks', () => {
    const { bubble, previewerDom, wrapperDom } = createPreviewerBubble();
    document.body.appendChild(wrapperDom);
    expect(bubble.$isImgHandlerValid()).toBe(true);
    expect(() => bubble.$checkAndRemoveInvalidImgHandlers({ strict: true })).not.toThrow();

    const table = document.createElement('table');
    const cell = document.createElement('td');
    cell.textContent = 'value';
    table.appendChild(cell);
    previewerDom.appendChild(table);
    const closestTable = vi.fn((): HTMLTableElement | false => table);
    const handler = { target: cell, $getClosestNode: closestTable };
    expect(bubble.$isTableHandlerValid(handler as never)).toBe(true);

    handler.target = document.createElement('td');
    expect(bubble.$isTableHandlerValid(handler as never)).toBe(false);
    handler.target = cell;
    closestTable.mockReturnValue(false);
    expect(bubble.$isTableHandlerValid(handler as never)).toBe(false);
    closestTable.mockReturnValue(table);
    cell.textContent = '';
    expect(bubble.$isTableHandlerValid(handler as never)).toBe(false);
    const outsideTable = document.createElement('table');
    const outsideCell = document.createElement('td');
    outsideCell.textContent = 'outside';
    outsideTable.appendChild(outsideCell);
    document.body.appendChild(outsideTable);
    handler.target = outsideCell;
    closestTable.mockReturnValue(outsideTable);
    expect(bubble.$isTableHandlerValid(handler as never)).toBe(false);
  });

  it('finds Mermaid figures and switches source toolbar panels', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    previewerDom.innerHTML = [
      '<figure data-type="mermaid">',
      '<div class="switch"><i class="cherry-mermaid-source-toolbar-slider"></i>',
      '<button class="cherry-mermaid-source-toolbar-tab active" data-mode="preview">Preview</button>',
      '<button id="source-tab" class="cherry-mermaid-source-toolbar-tab" data-mode="source">Source</button></div>',
      '<div class="cherry-mermaid-source-toolbar-panel active" data-mode="preview">diagram</div>',
      '<div class="cherry-mermaid-source-toolbar-panel" data-mode="source"><span id="source-child">code</span></div>',
      '</figure>',
    ].join('');
    const tab = previewerDom.querySelector('#source-tab');
    const child = previewerDom.querySelector('#source-child');
    vi.spyOn(bubble, '$removeAllPreviewerBubbles').mockImplementation(() => {});

    expect(bubble.$getMermaidFigure(child)).toBe(previewerDom.querySelector('figure'));
    expect(bubble.$getMermaidFigure(previewerDom)).toBe(false);
    bubble.$handleMermaidSourceToolbarClick(tab);

    expect(tab?.classList.contains('active')).toBe(true);
    expect(previewerDom.querySelector('[data-mode="preview"]')?.classList.contains('active')).toBe(false);
    expect(
      previewerDom
        .querySelector('.cherry-mermaid-source-toolbar-panel[data-mode="source"]')
        ?.classList.contains('active'),
    ).toBe(true);
    expect(previewerDom.querySelector<HTMLElement>('.cherry-mermaid-source-toolbar-slider')?.style.left).toBe('65px');
  });

  it('runs no-op change and placeholder methods and destroys listeners once', () => {
    const { bubble, off } = createPreviewerBubble();
    const reset = vi.spyOn(bubble.mermaidSession, 'reset');

    expect(bubble.$onChange(new Event('change'))).toBeUndefined();
    expect(bubble.$showBorderBubbles()).toBeUndefined();
    expect(bubble.$showBtnBubbles()).toBeUndefined();
    bubble.$removeAllPreviewerBubbles();
    expect(reset).toHaveBeenCalled();

    bubble.destroy();
    bubble.destroy();
    expect(off).toHaveBeenCalled();
    expect(Reflect.get(bubble, 'previewer')).toBeNull();
    expect(Reflect.get(bubble, 'previewerDom')).toBeNull();
  });

  it('uses measured image dimensions in validity-related DOM fixtures', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const image = document.createElement('img');
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 120, 80));
    previewerDom.appendChild(image);

    expect(image.getBoundingClientRect().width).toBe(120);
    expect(bubble.previewerDom.contains(image)).toBe(true);
  });

  it('covers image validity states for Mermaid, resizing, wrong targets, and zero dimensions', () => {
    const { bubble, previewerDom, wrapperDom } = createPreviewerBubble();
    document.body.appendChild(wrapperDom);
    const image = document.createElement('img');
    previewerDom.appendChild(image);
    Reflect.set(imgSizeHandler, 'img', image);
    bubble.bubbleHandler.click = imgSizeHandler;
    vi.spyOn(bubble.mermaidSession, 'isActive').mockReturnValue(true);
    vi.spyOn(bubble.mermaidSession, 'isValid').mockReturnValue(true);
    Reflect.set(imgSizeHandler, 'isMermaid', true);
    expect(bubble.$isImgHandlerValid({ strict: true })).toBe(true);

    Reflect.set(imgSizeHandler, 'isMermaid', false);
    vi.spyOn(imgSizeHandler, '$isResizing').mockReturnValue(true);
    expect(bubble.$isImgHandlerValid()).toBe(true);

    vi.spyOn(imgSizeHandler, '$isResizing').mockReturnValue(false);
    const div = document.createElement('div');
    previewerDom.appendChild(div);
    Reflect.set(imgSizeHandler, 'img', div);
    expect(bubble.$isImgHandlerValid()).toBe(false);
    Reflect.set(imgSizeHandler, 'img', image);
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 0, 0));
    expect(bubble.$isImgHandlerValid()).toBe(false);
  });

  it('forwards bound browser and Cherry events to active handlers', () => {
    const { bubble, previewer, emit } = createPreviewerBubble();
    const handlerEmit = vi.fn();
    bubble.bubbleHandler.click = { emit: handlerEmit };
    const removeAll = vi.spyOn(bubble, '$removeAllPreviewerBubbles').mockImplementation(() => {});
    const checkImages = vi.spyOn(bubble, '$checkAndRemoveInvalidImgHandlers').mockImplementation(() => {});
    vi.spyOn(previewer, 'isPreviewerHidden').mockReturnValue(true);
    vi.spyOn(bubble.mermaidSession, 'isActive').mockReturnValue(false);
    const event = new Event('test');

    Reflect.get(bubble, '$bindedOnMouseDown')(event);
    Reflect.get(bubble, '$bindedOnMouseUp')(event);
    Reflect.get(bubble, '$bindedOnMouseMove')(event);
    Reflect.get(bubble, '$bindedOnKeyUp')(event);
    Reflect.get(bubble, '$bindedOnScroll')(event);
    Reflect.get(bubble, '$bindedOnEditorSizeChange')();
    Reflect.get(bubble, '$bindedOnLayoutChange')();
    Reflect.get(bubble, '$bindedOnAfterChange')();
    Reflect.get(bubble, '$bindedOnAfterAsyncRender')();

    expect(handlerEmit).toHaveBeenCalledWith('mousedown', event);
    expect(handlerEmit).toHaveBeenCalledWith('mousemove', event);
    expect(handlerEmit).toHaveBeenCalledWith('keyup', event);
    expect(handlerEmit).toHaveBeenCalledWith('scroll', event);
    expect(handlerEmit).toHaveBeenCalledWith('resize', {});
    expect(removeAll).toHaveBeenCalled();
    expect(checkImages).toHaveBeenCalledWith({ strict: true });
    expect(emit).not.toHaveBeenCalled();
  });

  it('handles defensive early exits without creating editing handlers', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const sameTarget = document.createElement('a');
    const showBubble = vi.fn();
    bubble.bubbleHandler.hover = { emit: vi.fn(), aElement: sameTarget, showBubble };
    const codeTarget = document.createElement('div');
    bubble.bubbleHandler.code = { emit: vi.fn(), target: codeTarget };

    expect(bubble.$onMouseOver(new Event('mouseover'))).toBeUndefined();
    expect(bubble.$onMouseOut()).toBeUndefined();
    Reflect.set(bubble, 'editor', null);
    expect(bubble.$dealCheckboxClick(new Event('click'))).toBeUndefined();
    expect(bubble.$onClick(new MouseEvent('click'))).toBeUndefined();
    expect(bubble.$checkAndRecreateTableHandlers()).toBeUndefined();
    bubble.$showFootNoteBubbleCardPreviewerBubbles('hover', sameTarget, {});
    expect(showBubble).toHaveBeenCalledOnce();
    expect(bubble.$showTablePreviewerBubbles('click', previewerDom, document.createElement('table'))).toBeUndefined();
    expect(bubble.showCodeBlockPreviewerBubbles('code', codeTarget)).toBeUndefined();
    expect(bubble.$showImgPreviewerBubbles(document.createElement('img'), new Event('click'))).toBeUndefined();
    expect(bubble.$showListPreviewerBubbles('click', document.createElement('p'))).toBeUndefined();
    bubble.previewer.options.enablePreviewerBubble = false;
    expect(bubble.$showMermaidPreviewerBubbles(document.createElement('figure'), new Event('click'))).toBeUndefined();
  });

  it('runs registered preview update callbacks through the real Previewer lifecycle', () => {
    const { bubble, previewer, emit } = createPreviewerBubble();
    const handlerEmit = vi.fn();
    bubble.bubbleHandler.hover = { emit: handlerEmit };
    const checkTables = vi.spyOn(bubble, '$checkAndRecreateTableHandlers');
    const checkImages = vi.spyOn(bubble, '$checkAndRemoveInvalidImgHandlers');

    previewer.options.afterUpdateCallBack.forEach((callback) => callback());

    expect(checkTables).toHaveBeenCalledOnce();
    expect(handlerEmit).toHaveBeenCalledWith('previewUpdate', expect.any(Function));
    expect(checkImages).toHaveBeenCalledOnce();
    expect(emit).not.toHaveBeenCalled();

    vi.spyOn(bubble.mermaidSession, 'isActive').mockReturnValue(true);
    const onPreviewUpdate = vi.spyOn(bubble.mermaidSession, 'onPreviewUpdate');
    const onAsyncRenderDone = vi.spyOn(bubble.mermaidSession, 'onAsyncRenderDone');
    previewer.options.afterUpdateCallBack.forEach((callback) => callback());
    expect(onPreviewUpdate).toHaveBeenCalledOnce();
    Reflect.get(bubble, '$bindedOnAfterAsyncRender')();
    expect(onAsyncRenderDone).toHaveBeenCalledOnce();
  });

  it('shows hover bubbles for tables, code blocks, and footnote links', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    const table = document.createElement('table');
    const cell = document.createElement('td');
    table.appendChild(cell);
    const code = document.createElement('div');
    code.dataset.type = 'codeBlock';
    const footnote = document.createElement('a');
    footnote.className = 'cherry-show-bubble-card';
    previewerDom.append(table, code, footnote);
    const showTable = vi.spyOn(bubble, '$showTablePreviewerBubbles').mockImplementation(() => {});
    const showCode = vi.spyOn(bubble, 'showCodeBlockPreviewerBubbles').mockImplementation(() => {});
    const showFootnote = vi.spyOn(bubble, '$showFootNoteBubbleCardPreviewerBubbles').mockImplementation(() => {});
    const tableDetection = vi.spyOn(bubble, 'isCherryTable').mockReturnValue(table);
    vi.spyOn(bubble, 'isCherryCodeBlock').mockReturnValue(code);
    Reflect.set(cherry.options.engine, 'syntax', { footnote: { bubbleCard: { appendClass: 'card' } } });

    cell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    code.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    footnote.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(showTable).toHaveBeenCalledWith('hover', cell, table);
    expect(showCode).toHaveBeenCalledWith('hover', code);
    expect(showFootnote).toHaveBeenCalledWith('hover', footnote, { appendClass: 'card' });

    tableDetection.mockReturnValue(false);
    cell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(showTable).toHaveBeenCalledOnce();
  });

  it('handles basic hover early exits and schedules normal bubble cleanup', () => {
    vi.useFakeTimers();
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    const cleanup = vi.spyOn(bubble, '$removeAllPreviewerBubbles');
    const div = document.createElement('section');
    previewerDom.appendChild(div);

    Reflect.set(cherry, 'getStatus', () => ({ editor: 'hide', previewer: 'show' }));
    bubble.$onMouseOut();
    div.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(cleanup).not.toHaveBeenCalledWith('hover');

    Reflect.set(cherry, 'getStatus', () => ({ editor: 'show', previewer: 'show' }));
    div.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(400);
    expect(cleanup).toHaveBeenCalledWith('hover');
    vi.useRealTimers();
  });

  it('covers hover branches when editing is disabled or the target is not editable', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    const cell = document.createElement('td');
    const code = document.createElement('div');
    const anchor = document.createElement('a');
    previewerDom.append(cell, code, anchor);
    const showTable = vi.spyOn(bubble, '$showTablePreviewerBubbles').mockImplementation(() => {});
    const showCode = vi.spyOn(bubble, 'showCodeBlockPreviewerBubbles').mockImplementation(() => {});
    Reflect.set(cherry.options, 'enablePreviewerBubble', false);
    bubble.previewer.options.enablePreviewerBubble = false;
    cell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(showTable).not.toHaveBeenCalled();

    bubble.previewer.options.enablePreviewerBubble = true;
    vi.spyOn(bubble, 'isCherryCodeBlock').mockReturnValue(false);
    code.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(showCode).not.toHaveBeenCalled();
    anchor.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    bubble.previewer.options.enablePreviewerBubble = false;
    bubble.$onMouseOut();
  });

  it('ignores incomplete Mermaid source toolbar controls', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const detachedTab = document.createElement('button');
    expect(bubble.$handleMermaidSourceToolbarClick(detachedTab)).toBeUndefined();

    previewerDom.innerHTML = [
      '<figure data-type="mermaid">',
      '<div><button id="tab" class="cherry-mermaid-source-toolbar-tab" data-mode="source">Source</button></div>',
      '<div class="cherry-mermaid-source-toolbar-panel" data-mode="source">code</div>',
      '</figure>',
    ].join('');
    expect(bubble.$handleMermaidSourceToolbarClick(previewerDom.querySelector('#tab'))).toBeUndefined();
  });
});
