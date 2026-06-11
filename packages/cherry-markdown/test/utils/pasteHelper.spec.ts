/**
 * pasteHelper 单元测试
 *
 * 验证粘贴 HTML 后切换 TEXT/Markdown 时按粘贴区域替换，避免内容重复
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import pasteHelper from '../../src/utils/pasteHelper';

const createMockEditorView = (content: string, cursor = content.length) => {
  let doc = content;

  const view = {
    state: {
      get doc() {
        return {
          get length() {
            return doc.length;
          },
        };
      },
      selection: {
        main: { from: cursor, to: cursor, head: cursor },
      },
    },
    dispatch: vi.fn((update: { changes?: { from: number; to: number; insert: string }; selection?: unknown }) => {
      if (update.changes) {
        const { from, to, insert } = update.changes;
        doc = doc.slice(0, from) + insert + doc.slice(to);
      }
    }),
    dom: document.createElement('div'),
  };

  return {
    view,
    getValue: () => doc,
    replaceRange: vi.fn((text: string, from: number, to: number) => {
      view.dispatch({ changes: { from, to, insert: text } });
    }),
    setSelection: vi.fn(),
    on: vi.fn(),
    scrollDOM: { scrollTop: 0, parentElement: document.createElement('div') },
  };
};

describe('utils/pasteHelper', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
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

    expect(editorView.replaceRange).toHaveBeenCalledWith(htmlText, prefix.length, prefix.length + mdText.length);
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

    expect(editorView.replaceRange).not.toHaveBeenCalled();
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

    expect(editorView.replaceRange).toHaveBeenCalledWith(htmlText, 0, mdText.length);
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
    expect(editorView.replaceRange).toHaveBeenLastCalledWith(mdText, 0, htmlText.length);
  });
});
