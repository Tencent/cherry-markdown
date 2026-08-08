/**
 * pasteHelper 单元测试
 *
 * 验证粘贴 HTML 后切换 TEXT/Markdown 时按粘贴区域替换，避免内容重复
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import pasteHelper from '../../src/utils/pasteHelper';

/**
 * 构造一个 CM6 适配器形态的 mock 编辑器：
 *  - dispatch / state / on / scrollDOM / view 全部挂在最外层，
 *    与 src/Editor.js 中的 CM6Adapter 保持一致；
 *  - dispatch 内部维护一份字符串文档，便于断言替换后的内容；
 *  - selection 跟随 dispatch 更新，避免后续读取拿到过期位置。
 */
const createMockEditorView = (content: string, cursor = content.length) => {
  let doc = content;
  let selection = { from: cursor, to: cursor, head: cursor, anchor: cursor };

  const editorView = {
    state: {
      get doc() {
        return {
          get length() {
            return doc.length;
          },
          toString() {
            return doc;
          },
        };
      },
      get selection() {
        return { main: { ...selection } };
      },
    },
    dispatch: vi.fn(
      (update: {
        changes?: { from: number; to: number; insert: string };
        selection?: { anchor: number; head?: number };
      }) => {
        if (update.changes) {
          const { from, to, insert } = update.changes;
          doc = doc.slice(0, from) + insert + doc.slice(to);
        }
        if (update.selection) {
          const { anchor } = update.selection;
          const head = update.selection.head ?? anchor;
          selection = { from: Math.min(anchor, head), to: Math.max(anchor, head), anchor, head };
        }
      },
    ),
    on: vi.fn(),
    off: vi.fn(),
    scrollDOM: Object.assign(document.createElement('div'), { scrollTop: 0 }),
    view: { dom: document.createElement('div') },
    getValue: () => doc,
  };

  return editorView;
};

describe('utils/pasteHelper', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    // 清理 pasteHelper 在模块单例上残留的状态，避免用例之间互相污染
    pasteHelper.bubbleDom = undefined;
    pasteHelper.switchText = undefined;
    pasteHelper.switchMd = undefined;
    pasteHelper.hasBindListener = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('切换 TEXT 时应替换粘贴区域而非在光标处追加', () => {
    const mdText = '| 运行开始时间 |\n| --- |';
    const htmlText = '运行开始时间\nSQL详情/备注';
    const prefix = '前缀内容';
    const editorView = createMockEditorView(prefix + mdText, prefix.length + mdText.length);

    pasteHelper.init(
      { locale: { pastePlain: '纯文本', pasteMarkdown: 'Markdown' } },
      prefix.length,
      editorView,
      htmlText,
      mdText,
    );
    pasteHelper.bubbleDom = document.createElement('div');
    pasteHelper.bubbleDom.setAttribute('data-type', 'md');
    pasteHelper.switchText = document.createElement('span');
    pasteHelper.switchMd = document.createElement('span');

    pasteHelper.switchTextClick();

    expect(editorView.dispatch).toHaveBeenCalledTimes(1);
    expect(editorView.dispatch).toHaveBeenCalledWith({
      changes: { from: prefix.length, to: prefix.length + mdText.length, insert: htmlText },
      selection: { anchor: prefix.length, head: prefix.length + htmlText.length },
    });
    expect(editorView.getValue()).toBe(prefix + htmlText);
    expect(pasteHelper.bubbleDom.getAttribute('data-type')).toBe('text');
  });

  it('已在 TEXT 模式时重复点击不应再次替换', () => {
    const mdText = '**标题**';
    const htmlText = '标题';
    const editorView = createMockEditorView(mdText);

    pasteHelper.init({ locale: {} }, 0, editorView, htmlText, mdText);
    pasteHelper.bubbleDom = document.createElement('div');
    pasteHelper.bubbleDom.setAttribute('data-type', 'text');
    pasteHelper.switchText = document.createElement('span');
    pasteHelper.switchMd = document.createElement('span');

    pasteHelper.switchTextClick();

    expect(editorView.dispatch).not.toHaveBeenCalled();
  });

  it('localStorage 记忆 TEXT 时应自动切换且不被 data-type 判断拦截', () => {
    localStorage.setItem('cherry-paste-type', 'text');

    const mdText = '**标题**';
    const htmlText = '标题';
    const editorView = createMockEditorView(mdText);

    pasteHelper.showSwitchBtnAfterPasteHtml(
      { locale: { pastePlain: '纯文本', pasteMarkdown: 'Markdown' } },
      0,
      editorView,
      htmlText,
      mdText,
    );

    expect(editorView.dispatch).toHaveBeenCalledWith({
      changes: { from: 0, to: mdText.length, insert: htmlText },
      selection: { anchor: 0, head: htmlText.length },
    });
    expect(editorView.getValue()).toBe(htmlText);
    expect(pasteHelper.bubbleDom?.getAttribute('data-type')).toBe('text');
    expect(pasteHelper.switchText?.classList.contains('active')).toBe(true);
    expect(pasteHelper.switchMd?.classList.contains('active')).toBe(false);
  });

  it('TEXT 与 Markdown 来回切换应保持单一粘贴区域', () => {
    const mdText = '## demo';
    const htmlText = 'demo';
    const editorView = createMockEditorView(mdText);

    pasteHelper.init({ locale: {} }, 0, editorView, htmlText, mdText);
    pasteHelper.bubbleDom = document.createElement('div');
    pasteHelper.bubbleDom.setAttribute('data-type', 'md');
    pasteHelper.switchText = document.createElement('span');
    pasteHelper.switchMd = document.createElement('span');

    pasteHelper.switchTextClick();
    expect(editorView.getValue()).toBe(htmlText);

    pasteHelper.switchMDClick();
    expect(editorView.getValue()).toBe(mdText);
    expect(editorView.dispatch).toHaveBeenLastCalledWith({
      changes: { from: 0, to: htmlText.length, insert: mdText },
      selection: { anchor: 0, head: mdText.length },
    });
  });

  it('covers early return, repeated listener binding, and bubble visibility toggles', () => {
    const editorView = createMockEditorView('same text');
    const result = pasteHelper.showSwitchBtnAfterPasteHtml(
      { locale: { pastePlain: '纯文本', pasteMarkdown: 'Markdown' } },
      0,
      editorView,
      'same text',
      'same text',
    );

    expect(result).toBeUndefined();
    expect(pasteHelper.bubbleDom).toBeUndefined();

    pasteHelper.codemirror = {
      on: vi.fn(),
      scrollDOM: Object.assign(document.createElement('div'), { scrollTop: 12 }),
      view: { dom: document.createElement('div') },
    };
    expect(pasteHelper.bindListener()).toBeUndefined();
    expect(pasteHelper.bindListener()).toBe(true);

    pasteHelper.bubbleDom = document.createElement('div');
    pasteHelper.bubbleDom.style.display = 'none';
    expect(pasteHelper.isHidden()).toBe(true);
    expect(pasteHelper.hideBubble()).toBeUndefined();
    pasteHelper.noHide = true;
    expect(pasteHelper.hideBubble()).toBe(true);
    pasteHelper.noHide = false;
    pasteHelper.toggleBubbleDisplay();
    expect(pasteHelper.bubbleDom.style.display).toBe('');
    pasteHelper.toggleBubbleDisplay();
    expect(pasteHelper.bubbleDom.style.display).toBe('none');
  });

  it('positions the paste bubble above or below the selection and updates scroll offset', () => {
    const editorView = createMockEditorView('markdown');
    Object.defineProperty(editorView.scrollDOM, 'scrollTop', { configurable: true, value: 12, writable: true });
    const selection = document.createElement('span');
    selection.className = 'cm-selectionBackground';
    Object.defineProperty(selection, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 10,
        top: 80,
        width: 20,
        height: 20,
        right: 30,
        bottom: 100,
        x: 10,
        y: 80,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(editorView.view.dom, 'clientHeight', { configurable: true, value: 120 });
    editorView.view.dom.appendChild(selection);

    pasteHelper.init(
      { locale: { pastePlain: '纯文本', pasteMarkdown: 'Markdown' } },
      0,
      editorView,
      '<p>markdown</p>',
      'markdown',
    );
    pasteHelper.bubbleDom = document.createElement('div');
    pasteHelper.bubbleDom.style.display = 'none';
    Object.defineProperty(pasteHelper.bubbleDom, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        width: 40,
        height: 10,
        right: 40,
        bottom: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    pasteHelper.showBubble();
    expect(pasteHelper.bubbleDom.style.bottom).toBe('15px');
    expect(pasteHelper.bubbleDom.style.top).toBe('');
    expect(pasteHelper.bubbleDom.dataset.scrollTop).toBe('12');

    Object.defineProperty(selection, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 10,
        top: 10,
        width: 20,
        height: 10,
        right: 30,
        bottom: 20,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      }),
    });
    pasteHelper.showBubble();
    expect(pasteHelper.bubbleDom.style.top).toBe('20px');
    expect(pasteHelper.bubbleDom.style.bottom).toBe('');

    pasteHelper.bubbleDom.dataset.scrollTop = '30';
    Object.defineProperty(editorView.scrollDOM, 'scrollTop', { configurable: true, value: 6, writable: true });
    pasteHelper.updatePositionWhenScroll();
    expect(pasteHelper.bubbleDom.style.marginTop).toBe('24px');
  });

  it('degrades without browser storage and reuses an existing paste bubble', () => {
    expect(pasteHelper.getTypeFromLocalStorage()).toBe('md');
    vi.stubGlobal('localStorage', undefined);
    expect(pasteHelper.getTypeFromLocalStorage()).toBe('md');
    expect(() => pasteHelper.setTypeToLocalStorage('text')).not.toThrow();

    const bubble = document.createElement('div');
    const switchText = document.createElement('span');
    const switchMd = document.createElement('span');
    switchText.classList.add('active');
    pasteHelper.bubbleDom = bubble;
    pasteHelper.switchText = switchText;
    pasteHelper.switchMd = switchMd;

    expect(pasteHelper.initBubble()).toBe(true);
    expect(bubble.getAttribute('data-type')).toBe('md');
    expect(switchMd.classList.contains('active')).toBe(true);
    expect(switchText.classList.contains('active')).toBe(false);
  });

  it('uses the scroll container fallback and ignores repeated Markdown selection', () => {
    const scrollParent = document.createElement('div');
    const scrollDOM = document.createElement('div');
    scrollParent.appendChild(scrollDOM);
    const editorView = { scrollDOM };
    pasteHelper.init({ locale: { pastePlain: 'Plain', pasteMarkdown: 'Markdown' } }, 0, editorView, 'plain', '**md**');

    pasteHelper.initBubble();
    expect(scrollParent.contains(pasteHelper.bubbleDom)).toBe(true);

    pasteHelper.switchMDClick();
    expect(pasteHelper.bubbleDom?.getAttribute('data-type')).toBe('md');
  });

  it('hides safely when selection or an editor container is unavailable', () => {
    const bubble = document.createElement('div');
    bubble.style.display = '';
    pasteHelper.bubbleDom = bubble;
    pasteHelper.codemirror = { scrollDOM: document.createElement('div') };

    expect(pasteHelper.getLastSelectedPosition()).toEqual({});
    expect(bubble.style.display).toBe('none');

    bubble.style.display = '';
    pasteHelper.codemirror = {
      scrollDOM: Object.assign(document.createElement('div'), { scrollTop: 4 }),
      view: {},
    };
    pasteHelper.showBubble();
    expect(bubble.style.display).toBe('');

    bubble.style.display = 'none';
    bubble.style.marginTop = '7px';
    pasteHelper.updatePositionWhenScroll();
    expect(bubble.style.marginTop).toBe('7px');
  });
});
