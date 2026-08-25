import { EditorState, type TransactionSpec } from '@codemirror/state';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createPreviewerBubble } from '../helpers/previewerBubble';

function attachEditor(bubble: ReturnType<typeof createPreviewerBubble>['bubble'], markdown: string) {
  let state = EditorState.create({ doc: markdown });
  const dispatch = vi.fn((spec: TransactionSpec) => {
    state = state.update(spec).state;
  });
  const view = {
    get state() {
      return state;
    },
    dispatch,
  };
  const editor = {
    editor: { view },
    dealSpecialWords: vi.fn(),
  };
  Reflect.set(bubble, 'editor', editor);
  Reflect.set(bubble.previewer, 'editor', editor);
  return { editor, view, dispatch, getMarkdown: () => state.doc.toString() };
}

describe('toolbars/PreviewerBubble checkbox editing', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('toggles the matching unchecked checkbox through real CodeMirror state', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const editor = attachEditor(bubble, '- [ ] first\n- [x] second');
    previewerDom.innerHTML = [
      '<ul>',
      '<li><i class="ch-icon ch-icon-square"></i></li>',
      '<li><i class="ch-icon ch-icon-check"></i></li>',
      '</ul>',
    ].join('');
    const checkbox = previewerDom.querySelector('.ch-icon-square');

    bubble.$dealCheckboxClick({ target: checkbox });

    expect(editor.getMarkdown()).toBe('- [x] first\n- [x] second');
    expect(editor.dispatch).toHaveBeenCalledTimes(2);
  });

  it('toggles the matching checked checkbox off and ignores unmatched DOM checkboxes', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const editor = attachEditor(bubble, '- [ ] first\n- [x] second');
    previewerDom.innerHTML = [
      '<ul>',
      '<li><i class="ch-icon ch-icon-square"></i></li>',
      '<li><i class="ch-icon ch-icon-check"></i></li>',
      '</ul>',
      '<p><i class="ch-icon ch-icon-square"></i></p>',
    ].join('');
    const listIcons = previewerDom.querySelectorAll('li .ch-icon-square, li .ch-icon-check');

    bubble.$dealCheckboxClick({ target: listIcons[1] });
    expect(editor.getMarkdown()).toBe('- [ ] first\n- [ ] second');

    editor.dispatch.mockClear();
    bubble.$dealCheckboxClick({ target: previewerDom.querySelector('p .ch-icon-square') });
    expect(editor.dispatch).not.toHaveBeenCalled();
  });

  it('ignores inline prose checkbox icons when mapping click index to markdown', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const editor = attachEditor(
      bubble,
      '说明：本单使用可勾选复选框（- [ ]）记录\n- [ ] first\n- [ ] second',
    );
    previewerDom.innerHTML = [
      '<p>说明：本单使用可勾选复选框（- <i class="ch-icon ch-icon-square"></i> ）记录</p>',
      '<ul>',
      '<li class="check-list-item"><i class="ch-icon ch-icon-square"></i> first</li>',
      '<li class="check-list-item"><i class="ch-icon ch-icon-square"></i> second</li>',
      '</ul>',
    ].join('');
    const firstListCheckbox = previewerDom.querySelector('li .ch-icon-square');

    bubble.$dealCheckboxClick({ target: firstListCheckbox });

    expect(editor.getMarkdown()).toBe(
      '说明：本单使用可勾选复选框（- [ ]）记录\n- [x] first\n- [ ] second',
    );
  });
});

describe('toolbars/PreviewerBubble image Markdown selection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('finds image extension syntax and records its exact editor range', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const editor = attachEditor(bubble, 'before\n![alt #100px #border #center](photo.png)\nafter');
    previewerDom.innerHTML = '<img src="photo.png" alt="alt">';
    const image = previewerDom.querySelector('img');
    bubble.totalImgs = 1;
    bubble.imgIndex = 0;

    expect(bubble.beginChangeImgValue(image)).toBe(true);

    expect(bubble.imgSize.trim()).toBe('#100px');
    expect(bubble.imgDeco).toBe('#border');
    expect(bubble.imgAlign).toBe('#center');
    expect(bubble.imgHasExtend).toBe(true);
    expect(bubble.imgLeadingSpacePos).toBe(bubble.imgExtendFrom - 1);
    expect(editor.view.state.selection.main.from).toBe(bubble.imgExtendFrom);
    expect(editor.view.state.selection.main.to).toBe(bubble.imgExtendTo);
  });

  it('records an empty extension range and rejects a mismatched image', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    attachEditor(bubble, '![alt](photo.png)');
    previewerDom.innerHTML = '<img src="photo.png"><img src="other.png">';
    bubble.totalImgs = 1;
    bubble.imgIndex = 0;

    expect(bubble.beginChangeImgValue(previewerDom.querySelector('img'))).toBe(true);
    expect(bubble.imgHasExtend).toBe(false);
    expect(bubble.imgLeadingSpacePos).toBe(-1);

    bubble.totalImgs = 2;
    expect(bubble.beginChangeImgValue(previewerDom.querySelectorAll('img')[1])).toBe(false);
  });

  it('skips earlier image syntax while selecting a later image', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    const editor = attachEditor(bubble, '![first](one.png)\n![second #80px](two.png)');
    previewerDom.innerHTML = '<img src="one.png"><img src="two.png">';
    bubble.totalImgs = 2;
    bubble.imgIndex = 1;

    expect(bubble.beginChangeImgValue(previewerDom.querySelectorAll('img')[1])).toBe(true);
    expect(bubble.imgSize.trim()).toBe('#80px');
    expect(editor.view.state.selection.main.to).toBeGreaterThan(editor.view.state.selection.main.from);
  });

  it('selects draw.io payloads and requests special-word refresh', () => {
    const markdown = [
      'prefix',
      '![diagram](data:image/png;base64,AAAA){data-type=drawio data-xml=%3CmxGraphModel%3E}',
    ].join('\n');
    const { bubble, previewerDom } = createPreviewerBubble();
    const editor = attachEditor(bubble, markdown);
    previewerDom.innerHTML = '<img data-type="drawio" src="data:image/png;base64,AAAA" data-xml="%3CmxGraphModel%3E">';

    expect(bubble.beginChangeDrawioImg(previewerDom.querySelector('img'))).toBe(true);
    expect(editor.editor.dealSpecialWords).toHaveBeenCalledOnce();
    expect(editor.view.state.selection.main.from).toBeGreaterThan(markdown.indexOf('!['));
    expect(editor.view.state.selection.main.to).toBeGreaterThan(editor.view.state.selection.main.from);
  });

  it('returns false when a draw.io preview has no matching Markdown payload', () => {
    const { bubble, previewerDom } = createPreviewerBubble();
    attachEditor(bubble, '![diagram](data:image/png;base64,AAAA){data-type=drawio data-xml=one}');
    previewerDom.innerHTML = [
      '<img data-type="drawio" src="different">',
      '<img data-type="drawio" src="another">',
    ].join('');

    expect(bubble.beginChangeDrawioImg(previewerDom.querySelector('img'))).toBe(false);
  });
});

describe('toolbars/PreviewerBubble image Markdown updates', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('replaces and then clears an existing extension selection', () => {
    const { bubble } = createPreviewerBubble();
    const editor = attachEditor(bubble, '![alt #border](photo.png)');
    bubble.imgExtendFrom = 6;
    bubble.imgExtendTo = 13;
    bubble.imgLeadingSpacePos = 5;
    bubble.imgHasExtend = true;
    bubble.imgChangeBaseState = editor.view.state;
    bubble.imgSize = '#120px';
    bubble.imgAlign = '#center';

    bubble.changeImgValue();
    expect(editor.getMarkdown()).toBe('![alt #120px #center](photo.png)');
    expect(bubble.imgExtendTo - bubble.imgExtendFrom).toBe('#120px #center'.length);

    bubble.imgSize = '';
    bubble.imgAlign = '';
    bubble.changeImgValue();
    expect(editor.getMarkdown()).toBe('![alt](photo.png)');
    expect(bubble.imgHasExtend).toBe(false);
  });

  it('inserts extension syntax when the image has no existing extension', () => {
    const { bubble } = createPreviewerBubble();
    const editor = attachEditor(bubble, '![alt](photo.png)');
    bubble.imgExtendFrom = 5;
    bubble.imgExtendTo = 5;
    bubble.imgHasExtend = false;
    bubble.imgSize = '#80px';
    bubble.imgDeco = '#R';

    bubble.changeImgValue();

    expect(editor.getMarkdown()).toBe('![alt #80px #R](photo.png)');
    expect(bubble.imgLeadingSpacePos).toBe(5);
    expect(bubble.imgHasExtend).toBe(true);
  });

  it('clears an extension using its range when no leading-space position is recorded', () => {
    const { bubble } = createPreviewerBubble();
    const editor = attachEditor(bubble, '![alt #B](photo.png)');
    bubble.imgExtendFrom = 6;
    bubble.imgExtendTo = 8;
    bubble.imgLeadingSpacePos = -1;
    bubble.imgHasExtend = true;

    bubble.changeImgValue();

    expect(editor.getMarkdown()).toBe('![alt ](photo.png)');
    expect(bubble.imgExtendFrom).toBe(6);
  });
});
