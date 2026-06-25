/**
 * pasteHelper 单元测试
 *
 * 验证粘贴 HTML 后切换 TEXT/Markdown 时按粘贴区域替换，避免内容重复
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
