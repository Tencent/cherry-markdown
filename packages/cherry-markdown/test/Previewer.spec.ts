import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Engine from '../src/Engine';
import CherryEngine from '../src/index.engine.core';
import { createPreviewer } from './helpers/previewer';

type EngineOptions = ConstructorParameters<typeof CherryEngine>[0];

function createEngine(options: EngineOptions = {}): Engine {
  // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
  return new CherryEngine(options);
}

describe('Previewer rendering pipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mounts final CherryEngine HTML into the real preview DOM', () => {
    const engine = createEngine();
    const { previewer, previewerDom, highlightLine } = createPreviewer();
    const afterUpdate = vi.fn();
    previewer.registerAfterUpdate(afterUpdate);

    previewer.update(engine.makeHtml('# Title\n\nParagraph with **strong** text.\n\n- first\n- second'));

    expect(previewerDom.querySelector('h1')?.textContent).toBe('Title');
    expect(previewerDom.querySelector('p strong')?.textContent).toBe('strong');
    expect([...previewerDom.querySelectorAll('li')].map((item) => item.textContent)).toEqual(['first', 'second']);
    expect(previewerDom.querySelectorAll(':scope > [data-sign]')).toHaveLength(3);
    expect(afterUpdate).toHaveBeenCalledOnce();
    expect(highlightLine).toHaveBeenCalledWith(0);
    expect(Reflect.get(previewer, 'applyingDomChanges')).toBe(true);

    vi.advanceTimersByTime(50);
    expect(Reflect.get(previewer, 'applyingDomChanges')).toBe(false);
  });

  it('incrementally inserts, updates, and deletes rendered blocks', () => {
    const engine = createEngine();
    const { previewer, previewerDom } = createPreviewer();

    previewer.update(engine.makeHtml('# Before\n\nOld paragraph'));
    expect(previewerDom.querySelectorAll(':scope > [data-sign]')).toHaveLength(2);

    previewer.update(engine.makeHtml('# After\n\n- replacement\n\n> quoted'));

    expect(previewerDom.querySelector('h1')?.textContent).toBe('After');
    expect(previewerDom.querySelector('p')?.textContent).not.toContain('Old paragraph');
    expect(previewerDom.querySelector('li')?.textContent).toBe('replacement');
    expect(previewerDom.querySelector('blockquote')?.textContent).toContain('quoted');
    expect(previewerDom.querySelectorAll(':scope > [data-sign]')).toHaveLength(3);
  });

  it('reuses unchanged block DOM while updating adjacent content', () => {
    const engine = createEngine();
    const { previewer, previewerDom } = createPreviewer();

    previewer.update(engine.makeHtml('# Stable\n\nFirst paragraph'));
    const originalHeading = previewerDom.querySelector('h1');
    const originalParagraph = previewerDom.querySelector('p');

    previewer.update(engine.makeHtml('# Stable\n\nSecond paragraph'));

    expect(previewerDom.querySelector('h1')).toBe(originalHeading);
    expect(previewerDom.querySelector('p')).toBe(originalParagraph);
    expect(previewerDom.querySelector('p')?.textContent).toBe('Second paragraph');
  });

  it('clears existing blocks when the editor is in select-all replacement mode', () => {
    const engine = createEngine();
    const { previewer, previewerDom } = createPreviewer();

    previewer.update(engine.makeHtml('# Existing'));
    Reflect.set(previewer, 'editor', { selectAll: true });
    previewer.update(engine.makeHtml('Replacement'));

    expect(previewerDom.querySelector('h1')).toBeNull();
    expect(previewerDom.textContent).toBe('Replacement');
    expect(previewerDom.children).toHaveLength(1);
  });

  it('caches hidden updates and restores original image sources when read', () => {
    const { previewer, previewerDom, lazyLoadImg } = createPreviewer();
    previewerDom.classList.add('cherry-previewer--hidden');

    previewer.update('<p data-sign="image"><img src="photo.png" alt="photo"></p>');

    expect(previewerDom.children).toHaveLength(0);
    expect(previewer.options.previewerCache.htmlChanged).toBe(true);
    expect(previewer.options.previewerCache.html).toContain('data-src="photo.png"');
    expect(previewer.getValue(false)).toContain('src="photo.png"');
    expect(lazyLoadImg.changeSrc2DataSrc).toHaveBeenCalledOnce();
    expect(lazyLoadImg.changeDataSrc2Src).toHaveBeenCalledOnce();
  });

  it('wraps visible output with the configured code themes', () => {
    const { previewer } = createPreviewer();
    previewer.refresh('<p>content</p>');

    expect(previewer.getValue()).toBe(
      '<div data-inline-code-theme="red" data-code-block-theme="dark"><p>content</p></div>',
    );
    expect(previewer.getValue(false)).toBe('<p>content</p>');
  });

  it('supports mobile preview containers and falls back when the wrapper is absent', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewer.refresh('<p>mobile content</p>');

    previewer.changePreviewToMobile(true);
    expect(previewer.getDomContainer().className).toBe('cherry-mobile-previewer-content');
    expect(previewer.getDomContainer().textContent).toBe('mobile content');

    previewerDom.querySelector('.cherry-mobile-previewer-content')?.remove();
    expect(previewer.getDomContainer()).toBe(previewerDom);
  });

  it('returns from destroyed updates without touching lazy loading or callbacks', () => {
    const { previewer, previewerDom, lazyLoadImg, highlightLine } = createPreviewer();
    Reflect.set(previewer, 'isDestroyed', true);

    previewer.update('<p data-sign="ignored">ignored</p>');
    previewer.afterUpdate();

    expect(previewerDom.children).toHaveLength(0);
    expect(lazyLoadImg.changeSrc2DataSrc).not.toHaveBeenCalled();
    expect(highlightLine).not.toHaveBeenCalled();
  });

  it('uses an element fallback when DOMParser is unavailable', () => {
    const { previewer, previewerDom } = createPreviewer();
    const originalParser = window.DOMParser;
    Reflect.set(window, 'DOMParser', undefined);

    try {
      previewer.update('<p data-sign="fallback" data-lines="1">fallback parser</p>');
      expect(previewerDom.textContent).toBe('fallback parser');
    } finally {
      Reflect.set(window, 'DOMParser', originalParser);
    }
  });

  it('exposes the root DOM and unwraps mobile preview mode', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewer.refresh('<p>desktop</p>');

    expect(previewer.getDom()).toBe(previewerDom);
    previewer.changePreviewToMobile();
    previewer.changePreviewToMobile(false);

    expect(previewer.getDomContainer()).toBe(previewerDom);
    expect(previewerDom.innerHTML).toBe('<p>desktop</p>');
  });
});

describe('Previewer virtual DOM helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('converts HTML attributes and atomic nodes for virtual-dom', () => {
    const { previewer } = createPreviewer();
    const source = document.createElement('section');
    source.className = 'panel';
    source.id = 'panel-id';
    source.setAttribute('contenteditable', 'false');
    source.setAttribute('open', '');
    source.setAttribute('width', 'calc(100% - 2px)');
    source.setAttribute('height', '20');
    source.setAttribute('style', 'color: red');
    source.setAttribute('rowspan', '2');
    source.setAttribute('colspan', '3');
    source.setAttribute('data-sign', 'stable');
    source.setAttribute('aria-label', 'Panel');
    source.innerHTML = '<strong>child</strong>';

    const converted = previewer.$html2H(source);
    expect(converted.tagName).toBe('SECTION');
    expect(converted.properties.className).toBe('panel');
    expect(converted.properties.contentEditable).toBe('false');
    expect(converted.properties.open).toBe(true);
    expect(converted.properties.style.cssText).toContain('width:calc(100% - 2px)');
    expect(converted.properties.style.cssText).toContain('color: red');
    expect(converted.properties.height).toBe('20');
    expect(converted.properties.dataset).toMatchObject({ sign: 'stable', rowSpan: '2', colSpan: '3' });
    expect(converted.children).toHaveLength(1);

    source.setAttribute('data-cm-atomic', 'true');
    expect(previewer.$html2H(source).children).toHaveLength(0);
    expect(previewer.$html2H(source.firstChild?.firstChild)).toBe('child');
    expect(previewer.$html2H(undefined).tagName).toBe('SPAN');
    expect(previewer.$getAttrsForH(null)).toEqual({});
  });

  it('creates a style collection when style is the first styled attribute', () => {
    const { previewer } = createPreviewer();
    const source = document.createElement('div');
    source.setAttribute('style', 'display: block');

    expect(previewer.$getAttrsForH(source.attributes).style).toEqual({ cssText: 'display: block' });
  });

  it('patches text, classes, datasets, and child elements in place', () => {
    const { previewer } = createPreviewer();
    const oldDom = document.createElement('div');
    oldDom.className = 'before';
    oldDom.dataset.sign = 'before';
    oldDom.innerHTML = '<span>old</span>';
    const newDom = document.createElement('div');
    newDom.className = 'after';
    newDom.dataset.sign = 'after';
    newDom.innerHTML = '<strong>new</strong>';

    const patched = previewer.$updateDom(newDom, oldDom);

    expect(patched).toBe(oldDom);
    expect(oldDom.className).toBe('after');
    expect(oldDom.dataset.sign).toBe('after');
    expect(oldDom.querySelector('strong')?.textContent).toBe('new');
    expect(oldDom.querySelector('span')).toBeNull();
  });

  it('collects top-level signs and resolves later matching hashes', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = [
      '<p data-sign="abcdefghijkl-one">one</p>',
      '<div>unsigned</div>',
      '<p data-sign="abcdefghijkl-two">two</p>',
    ].join('');

    const signData = previewer.$getSignData(previewerDom.children);

    expect(signData.list.map((item) => item.sign)).toEqual(['abcdefghijkl-one', 'abcdefghijkl-two']);
    expect(signData.signs['abcdefghijkl-one']).toEqual([0]);
    expect(previewer.hasNewSign(signData.list, 'abcdefghijkl-current', 0)).toEqual({
      index: 1,
      sign: 'abcdefghijkl-current',
    });
    expect(previewer.hasNewSign([], 'missing', 0)).toBe(false);
    expect(previewer.hasNewSign(signData.list, 'different', 0)).toBeUndefined();
  });

  it('detects signed nesting and bounded indexes', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = '<section data-sign="outer"><span id="nested"></span></section><p id="top"></p>';
    const nested = previewerDom.querySelector('#nested');
    const top = previewerDom.querySelector('#top');
    const detached = document.createElement('span');

    expect(previewer.$testChild(nested)).toBe(false);
    expect(previewer.$testChild(top)).toBe(true);
    expect(previewer.$testChild(detached)).toBe(true);
    expect(previewer.testMaxIndex(2, [1, 3])).toBe(true);
    expect(previewer.testMaxIndex(4, [1, 3])).toBe(false);
    expect(previewer.testMaxIndex(0, null)).toBe(false);
  });

  it('recurses through unsigned wrappers when checking signed ownership', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = '<div><section><span id="deep"></span></section></div>';

    expect(previewer.$testChild(previewerDom.querySelector('#deep'))).toBe(true);
  });

  it('inserts a new block before an existing block and deletes all blocks', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = '<p data-sign="old" data-lines="1">old</p>';
    const oldDom = previewerDom.firstElementChild;
    const newDom = document.createElement('h2');
    newDom.dataset.sign = 'new';
    newDom.textContent = 'new';

    previewer.$dealWithMyersDiffResult(
      [{ type: 'insert', oldIndex: 0, newIndex: 0 }],
      [{ sign: 'old', dom: oldDom }],
      [{ sign: 'new', dom: newDom }],
      previewerDom,
    );
    expect([...previewerDom.children].map((item) => item.textContent)).toEqual(['new', 'old']);

    const oldHtmlList = previewer.$getSignData(previewerDom.children);
    previewer.$dealUpdate(previewerDom, oldHtmlList, { list: [], signs: {} });
    expect(previewerDom.children).toHaveLength(0);
  });

  it('updates table chart metadata while preserving the chart wrapper instance', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = [
      '<div class="cherry-table-wrapper" data-sign="old" data-lines="2">',
      '<div class="cherry-table-figure"><div id="old-chart" class="cherry-echarts-wrapper" data-table-data="old" data-chart-type="bar" data-chart-options="old"></div></div>',
      '<table class="cherry-table"><tbody><tr><td>old cell</td></tr></tbody></table>',
      '</div>',
    ].join('');
    const oldDom = previewerDom.firstElementChild;
    const oldChart = oldDom?.querySelector('.cherry-echarts-wrapper');
    const holder = document.createElement('div');
    holder.innerHTML = [
      '<div class="cherry-table-wrapper" data-sign="new" data-lines="3">',
      '<div class="cherry-table-figure"><div id="new-chart" class="cherry-echarts-wrapper" data-table-data="new" data-chart-type="line" data-chart-options="updated"></div></div>',
      '<table class="cherry-table"><tbody><tr><td>new cell</td></tr></tbody></table>',
      '</div>',
    ].join('');
    const newDom = holder.firstElementChild;

    previewer.$dealWithMyersDiffResult(
      [{ type: 'update', oldIndex: 0, newIndex: 0 }],
      [{ sign: 'old', dom: oldDom }],
      [{ sign: 'new', dom: newDom }],
      previewerDom,
    );

    expect(previewerDom.firstElementChild).toBe(oldDom);
    expect(oldDom?.querySelector('.cherry-echarts-wrapper')).toBe(oldChart);
    expect(oldChart?.id).toBe('new-chart');
    expect(oldChart?.getAttribute('data-table-data')).toBe('new');
    expect(oldChart?.getAttribute('data-chart-type')).toBe('line');
    expect(oldChart?.getAttribute('data-chart-options')).toBe('updated');
    expect(oldDom?.getAttribute('data-sign')).toBe('new');
    expect(oldDom?.querySelector('.cherry-table')?.textContent).toBe('new cell');
  });

  it('updates code chart metadata without replacing the rendered chart', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML =
      '<figure data-type="echarts" data-sign="old" data-lines="2"><div class="cherry-echarts-codeblock-wrapper">rendered chart</div></figure>';
    const oldDom = previewerDom.firstElementChild;
    const holder = document.createElement('div');
    holder.innerHTML =
      '<figure data-type="echarts" data-sign="new" data-lines="4"><div class="cherry-echarts-codeblock-wrapper">new placeholder</div></figure>';
    const newDom = holder.firstElementChild;

    previewer.$dealWithMyersDiffResult(
      [{ type: 'update', oldIndex: 0, newIndex: 0 }],
      [{ sign: 'old', dom: oldDom }],
      [{ sign: 'new', dom: newDom }],
      previewerDom,
    );

    expect(previewerDom.firstElementChild).toBe(oldDom);
    expect(oldDom?.getAttribute('data-sign')).toBe('new');
    expect(oldDom?.getAttribute('data-lines')).toBe('4');
    expect(oldDom?.textContent).toBe('rendered chart');
  });

  it('replaces SVG blocks instead of virtual-dom patching them', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = '<div data-sign="old"><span>old</span></div>';
    const oldDom = previewerDom.firstElementChild;
    const holder = document.createElement('div');
    holder.innerHTML = '<div data-sign="new"><svg><text>new diagram</text></svg></div>';
    const newDom = holder.firstElementChild;

    previewer.$dealWithMyersDiffResult(
      [{ type: 'update', oldIndex: 0, newIndex: 0 }],
      [{ sign: 'old', dom: oldDom }],
      [{ sign: 'new', dom: newDom }],
      previewerDom,
    );

    expect(previewerDom.firstElementChild).toBe(newDom);
    expect(previewerDom.querySelector('svg text')?.textContent).toBe('new diagram');
  });
});
