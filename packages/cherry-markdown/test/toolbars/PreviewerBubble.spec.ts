import { afterEach, describe, expect, it, vi } from 'vitest';
import imgSizeHandler from '../../src/utils/imgSizeHandler';
import { createRect } from '../helpers/previewer';
import { createPreviewerBubble } from '../helpers/previewerBubble';

describe('toolbars/PreviewerBubble production behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('identifies editable code blocks, tables, and editor availability', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    previewerDom.innerHTML = [
      '<div data-type="codeBlock"><code id="code">source</code></div>',
      '<blockquote><div data-type="codeBlock"><code id="quoted">quoted</code></div></blockquote>',
      '<div><table><tbody><tr><td id="cell">cell</td></tr></tbody></table></div>',
      '<div class="simple-table"><table><tr><td id="simple">simple</td></tr></table></div>',
    ].join('');

    expect(bubble.isCherryCodeBlock(previewerDom.querySelector('#code'))).toHaveProperty('dataset.type', 'codeBlock');
    expect(bubble.isCherryCodeBlock(previewerDom.querySelector('#quoted'))).toBe(false);
    expect(bubble.isCherryCodeBlock(previewerDom)).toBe(false);
    const table = bubble.isCherryTable(previewerDom.querySelector('#cell'));
    expect(table).toBeInstanceOf(HTMLElement);
    expect((table as HTMLElement).tagName).toBe('TABLE');
    expect(bubble.isCherryTable(previewerDom.querySelector('#simple'))).toBe(false);
    expect(bubble.isCherryTable(previewerDom)).toBe(false);
    expect(bubble.$hasEditor()).toBe(true);
    expect(bubble.$isEnableBubbleAndEditorShow()).toBe(true);

    bubble.previewer.options.enablePreviewerBubble = false;
    expect(bubble.$isEnableBubbleAndEditorShow()).toBe(false);
    bubble.previewer.options.enablePreviewerBubble = true;
    Reflect.set(bubble, 'editor', null);
    expect(bubble.$hasEditor()).toBe(false);
    expect(bubble.$isEnableBubbleAndEditorShow()).toBe(false);
    Reflect.set(bubble, 'editor', { editor: {} });
    Reflect.set(cherry, 'getStatus', () => ({ editor: 'hide', previewer: 'show' }));
    expect(bubble.$isEnableBubbleAndEditorShow()).toBe(false);
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

  it('toggles image size, decoration, and alignment state through production methods', () => {
    const { bubble } = createPreviewerBubble();
    const changeValue = vi.spyOn(bubble, 'changeImgValue').mockImplementation(() => {});
    const image = document.createElement('img');

    bubble.changeImgSize(image, { width: 120.4, height: 80.6 });
    expect(bubble.imgSize).toBe('#120px #81px');
    bubble.changeImgStyle(image, 'border');
    expect(bubble.imgDeco).toBe('#B');
    bubble.changeImgStyle(image, 'border');
    expect(bubble.imgDeco).toBe('');
    bubble.changeImgStyle(image, 'center');
    expect(bubble.imgAlign).toBe('#center');
    bubble.changeImgStyle(image, 'left');
    expect(bubble.imgAlign).toBe('#left');
    bubble.changeImgStyle(image, 'right');
    expect(bubble.imgAlign).toBe('#right');
    bubble.changeImgAlignmentStyle(image, 'clear-align');
    expect(bubble.imgAlign).toBe('');
    expect(changeValue).toHaveBeenCalledTimes(7);
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

  it('handles expand buttons, TOC links, and footnote callbacks', () => {
    const { bubble, previewerDom, cherry, previewer } = createPreviewerBubble();
    const onUnExpandCode = vi.fn();
    const scrollToHeadByIndex = vi.spyOn(previewer, 'scrollToHeadByIndex');
    const scrollToId = vi.spyOn(previewer, 'scrollToId').mockReturnValue(true);
    Reflect.set(cherry.options, 'callback', { onExpandCode: true, onUnExpandCode });
    const code = document.createElement('div');
    code.className = 'cherry-code-unExpand';
    code.innerHTML = '<div><div><button class="expand-btn ">Expand</button></div></div>';
    const expandButton = code.querySelector('button');
    if (expandButton) expandButton.className = 'expand-btn ';
    previewerDom.appendChild(code);
    expandButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(code.classList.contains('cherry-code-expand')).toBe(true);
    expect(onUnExpandCode).toHaveBeenCalledOnce();

    const unExpandDom = document.createElement('div');
    unExpandDom.className = 'hidden';
    bubble.bubbleHandler.hover = { emit: vi.fn(), unExpandDom };
    const secondCode = document.createElement('div');
    secondCode.className = 'cherry-code-unExpand';
    secondCode.innerHTML = '<div><div><button class="ch-icon ch-icon-expand">Expand</button></div></div>';
    previewerDom.appendChild(secondCode);
    secondCode.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(unExpandDom.classList.contains('hidden')).toBe(false);

    Reflect.set(cherry.options, 'callback', {});
    Reflect.set(cherry.options, 'toolbars', { toc: { updateLocationHash: false } });
    const list = document.createElement('ul');
    list.innerHTML = '<li><a class="level-1" href="#heading">Heading</a></li><li><a class="level-2">Two</a></li>';
    previewerDom.appendChild(list);
    list.querySelector('.level-1')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(scrollToHeadByIndex).toHaveBeenCalledWith(-1);

    const footnote = document.createElement('a');
    footnote.className = 'footnote';
    footnote.dataset.index = '1';
    footnote.dataset.key = 'note';
    footnote.href = '#note-1';
    const note = document.createElement('div');
    note.className = 'one-footnote';
    note.dataset.index = '1';
    note.textContent = 'note content';
    previewerDom.append(footnote, note);
    const clickReference = vi.fn(() => false);
    const footnoteOptions = { refNumber: { clickRefNumberCallback: clickReference } };
    Reflect.set(cherry.options.engine, 'syntax', { footnote: footnoteOptions });
    footnote.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(clickReference).toHaveBeenCalledWith(expect.any(MouseEvent), '1', 'note', 'note content');

    const missingFootnote = document.createElement('a');
    missingFootnote.className = 'footnote';
    missingFootnote.dataset.index = '2';
    missingFootnote.dataset.key = 'missing';
    previewerDom.appendChild(missingFootnote);
    missingFootnote.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(clickReference).toHaveBeenCalledWith(expect.any(MouseEvent), '2', 'missing', '');

    Reflect.set(footnoteOptions.refNumber, 'clickRefNumberCallback', undefined);
    footnote.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(scrollToId).toHaveBeenCalledWith('#note-1');
  });

  it('dispatches read-only and editor interactions by target element type', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    const showFormula = vi.spyOn(bubble, '$showFormulaPreviewerBubbles').mockImplementation(() => {});
    const showImage = vi.spyOn(bubble, '$showImgPreviewerBubbles').mockImplementation(() => ({ emit: vi.fn() }));
    const showTable = vi.spyOn(bubble, '$showTablePreviewerBubbles').mockImplementation(() => {});
    const showList = vi.spyOn(bubble, '$showListPreviewerBubbles').mockImplementation(() => {});
    const showMermaid = vi.spyOn(bubble, '$showMermaidPreviewerBubbles').mockImplementation(() => {});
    const dealCheckbox = vi.spyOn(bubble, '$dealCheckboxClick').mockImplementation(() => {});
    vi.spyOn(bubble, 'isCherryTable').mockReturnValue(document.createElement('table'));
    Reflect.set(cherry, 'status', { editor: 'show', previewer: 'show' });

    const tab = document.createElement('button');
    tab.className = 'cherry-mermaid-source-toolbar-tab';
    previewerDom.appendChild(tab);
    const mermaidTab = vi.spyOn(bubble, '$handleMermaidSourceToolbarClick').mockImplementation(() => {});
    tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mermaidTab).toHaveBeenCalledWith(tab);

    const math = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const mathContainer = document.createElement('mjx-container');
    mathContainer.appendChild(math);
    previewerDom.appendChild(mathContainer);
    math.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(showFormula).toHaveBeenCalled();

    const image = document.createElement('img');
    const tableCell = document.createElement('td');
    const listParagraph = document.createElement('p');
    const listItem = document.createElement('li');
    listItem.appendChild(listParagraph);
    previewerDom.append(image, tableCell, listItem);
    image.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    tableCell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    listParagraph.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(showImage).toHaveBeenCalledWith(image, expect.any(MouseEvent));
    expect(showTable).toHaveBeenCalled();
    expect(showList).toHaveBeenCalled();

    const checkbox = document.createElement('i');
    checkbox.className = 'ch-icon ch-icon-square';
    previewerDom.appendChild(checkbox);
    checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dealCheckbox).toHaveBeenCalled();

    const figure = document.createElement('figure');
    figure.dataset.type = 'mermaid';
    const mermaidChild = document.createElement('span');
    figure.appendChild(mermaidChild);
    previewerDom.appendChild(figure);
    vi.spyOn(bubble, '$getMermaidFigure').mockReturnValue(figure);
    mermaidChild.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(showMermaid).toHaveBeenCalledWith(figure, expect.any(MouseEvent));
  });

  it('covers click callback cancellation, disabled editing, invalid tables, rich lists, and KaTeX', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    const cell = document.createElement('td');
    const button = document.createElement('button');
    previewerDom.append(cell, button);
    const showTable = vi.spyOn(bubble, '$showTablePreviewerBubbles').mockImplementation(() => {});
    const showList = vi.spyOn(bubble, '$showListPreviewerBubbles').mockImplementation(() => {});
    const showFormula = vi.spyOn(bubble, '$showFormulaPreviewerBubbles').mockImplementation(() => {});
    Reflect.set(cherry.options, 'callback', { onClickPreview: vi.fn(() => false) });
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(showTable).not.toHaveBeenCalled();

    Reflect.set(cherry.options, 'callback', {});
    bubble.previewer.options.enablePreviewerBubble = false;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    bubble.previewer.options.enablePreviewerBubble = true;
    vi.spyOn(bubble, 'isCherryTable').mockReturnValue(false);
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(showTable).not.toHaveBeenCalled();

    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<strong>rich</strong>';
    const item = document.createElement('li');
    item.appendChild(paragraph);
    previewerDom.appendChild(item);
    paragraph.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(showList).toHaveBeenCalledWith('click', paragraph);

    const katex = document.createElement('span');
    katex.className = 'katex';
    previewerDom.appendChild(katex);
    katex.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(showFormula).toHaveBeenCalledWith('click', katex, expect.any(Object));
  });

  it('uses the closest polyfill path when native closest is unavailable', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const code = document.createElement('div');
    code.dataset.type = 'codeBlock';
    const child = document.createElement('span');
    code.appendChild(child);
    previewerDom.appendChild(code);
    const nativeClosest = Element.prototype.closest;
    Reflect.set(Element.prototype, 'closest', undefined);

    try {
      expect(bubble.isCherryCodeBlock(child)).toBe(code);
      expect(bubble.isCherryCodeBlock(document.createElement('span'))).toBe(false);
    } finally {
      Reflect.set(Element.prototype, 'closest', nativeClosest);
    }
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
