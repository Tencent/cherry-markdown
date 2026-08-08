import { EditorState } from '@codemirror/state';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import FloatMenu from '../../src/toolbars/FloatMenu';

vi.mock('../../src/toolbars/Toolbar', () => ({
  default: class Toolbar {},
}));

const createFloatMenu = (doc = '') => {
  const editorDom = document.createElement('div');
  const scroller = document.createElement('div');
  const content = document.createElement('div');
  const menuDom = document.createElement('div');
  scroller.className = 'cm-scroller';
  content.className = 'cm-content';
  content.style.paddingLeft = '12px';
  content.style.lineHeight = '20px';
  scroller.appendChild(content);
  editorDom.appendChild(scroller);
  document.body.appendChild(editorDom);

  const state = EditorState.create({ doc });
  const view = {
    state,
    coordsAtPos: vi.fn(() => ({ top: 20, bottom: 40 })),
    lineBlockAt: vi.fn(() => ({ top: 20 })),
    scrollDOM: scroller,
  };
  Object.defineProperty(scroller, 'getBoundingClientRect', {
    value: () => ({ top: 0 }),
  });

  const event = {
    on: vi.fn(),
    off: vi.fn(),
  };
  const editor = {
    editor: { view },
    getEditorDom: () => editorDom,
  };
  const menu = Object.create(FloatMenu.prototype);
  menu.options = { dom: menuDom };
  menu.shortcutKeyMap = { 'Control-KeyB': 'bold' };
  menu.$cherry = {
    $event: event,
    toolbar: { shortcutKeyMap: {} },
    editor,
  };
  menu.editor = editor;

  return { menu, menuDom, editorDom, scroller, state, view, event };
};

describe('toolbars/FloatMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts into the CodeMirror scroller and unregisters its listeners on destroy', () => {
    const { menu, menuDom, scroller, event } = createFloatMenu();

    menu.init();

    expect(scroller.contains(menuDom)).toBe(true);
    expect(event.on).toHaveBeenCalledTimes(3);
    expect(menu.$cherry.toolbar.shortcutKeyMap).toMatchObject({ 'Control-KeyB': 'bold' });

    menu.destroy();

    expect(event.off).toHaveBeenCalledWith('selectionChange', menu.boundHandleSelectionChange);
    expect(event.off).toHaveBeenCalledWith('afterChange', menu.boundHandleContentChange);
    expect(event.off).toHaveBeenCalledWith('beforeSelectionChange', menu.boundHandleBeforeSelectionChange);
  });

  it('falls back to the editor root when the CodeMirror scroller is unavailable', () => {
    const { menu, menuDom, editorDom, scroller } = createFloatMenu();
    scroller.remove();

    menu.init();

    expect(editorDom.contains(menuDom)).toBe(true);
  });

  it('appends menu fragments and hides the menu explicitly', () => {
    const { menu, menuDom } = createFloatMenu();
    const item = document.createElement('button');

    menu.appendMenusToDom(item);
    expect(menuDom.contains(item)).toBe(true);

    menu.hideFloatMenu();
    expect(menuDom.style.display).toBe('none');

    menu.options.dom = null;
    expect(() => menu.hideFloatMenu()).not.toThrow();
  });

  it('refreshes the menu from each editor event only while an editor is attached', () => {
    const { menu } = createFloatMenu();
    menu.cursorActivity = vi.fn();

    menu.handleSelectionChange({});
    menu.handleContentChange();
    menu.handleBeforeSelectionChange();
    expect(menu.cursorActivity).toHaveBeenCalledTimes(3);

    menu.editor = null;
    menu.handleSelectionChange({});
    menu.handleContentChange();
    menu.handleBeforeSelectionChange();
    expect(menu.cursorActivity).toHaveBeenCalledTimes(3);
  });

  it('provides the CodeMirror compatibility methods and their fallbacks', () => {
    const { menu, view } = createFloatMenu('first\nsecond');
    const compat = menu.createCompatCodeMirror();

    expect(compat.getCursor()).toEqual({ line: 0 });
    expect(compat.getLine(1)).toBe('second');
    expect(compat.getLine(10)).toBe('');
    expect(compat.getSelection()).toBe('');
    expect(compat.getSelections()).toEqual(['']);
    expect(compat.coordsAtPos(0)).toEqual({ top: 20, bottom: 40 });

    const heights: number[] = [];
    compat.getDoc().eachLine(0, 2, ({ height }: { height: number }) => heights.push(height));
    expect(heights).toEqual([20, 20]);

    view.coordsAtPos.mockImplementation(() => {
      throw new Error('not measurable');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(compat.coordsAtPos(0)).toBeNull();
    compat.getDoc().eachLine(0, 1, ({ height }: { height: number }) => heights.push(height));
    expect(heights[heights.length - 1]).toBe(20);
    expect(warn).toHaveBeenCalled();

    menu.editor = null;
    expect(menu.createCompatCodeMirror()).toBeNull();
  });

  it('shows on an empty line and hides when the line has content', () => {
    const empty = createFloatMenu('');
    const emptyCodeMirror = empty.menu.createCompatCodeMirror();
    empty.menu.editorDom = empty.editorDom;

    empty.menu.cursorActivity(null, emptyCodeMirror);

    expect(empty.menuDom.style.display).toBe('inline-block');
    expect(empty.menuDom.style.left).toBe('12px');
    expect(empty.menuDom.style.top).toMatch(/px$/);

    const populated = createFloatMenu('content');
    const populatedCodeMirror = populated.menu.createCompatCodeMirror();
    populated.menu.editorDom = populated.editorDom;
    populated.menu.cursorActivity(null, populatedCodeMirror);

    expect(populated.menuDom.style.display).toBe('none');
  });

  it('updates visibility without recalculating menu position', () => {
    const empty = createFloatMenu('');
    const emptyCodeMirror = empty.menu.createCompatCodeMirror();
    expect(empty.menu.update(null, emptyCodeMirror)).toBeUndefined();
    expect(empty.menuDom.style.display).toBe('inline-block');

    const populated = createFloatMenu('content');
    const populatedCodeMirror = populated.menu.createCompatCodeMirror();
    expect(populated.menu.update(null, populatedCodeMirror)).toBe(false);
    expect(populated.menuDom.style.display).toBe('none');
  });

  it('uses line position fallbacks when coordinates are unavailable', () => {
    const { menu, view } = createFloatMenu('first\nsecond');

    expect(menu.getLineHeight(1, menu.createCompatCodeMirror())).toBe(30);

    view.coordsAtPos.mockReturnValue(null);
    expect(menu.getLineHeight(1, menu.createCompatCodeMirror())).toBe(20);

    view.lineBlockAt.mockReturnValue(null);
    expect(menu.getLineHeight(1, menu.createCompatCodeMirror())).toBe(20);

    menu.editor.editor = null;
    expect(menu.getLineHeight(2, null)).toBe(40);
  });

  it('stops cursor positioning when the editor content element is missing', () => {
    const { menu, editorDom } = createFloatMenu('');
    menu.editorDom = editorDom;
    editorDom.querySelector('.cm-content')?.remove();

    expect(menu.cursorActivity(null, menu.createCompatCodeMirror())).toBe(false);
  });

  it('hides when there are multiple selections or selected text', () => {
    const { menu } = createFloatMenu('content');
    const state = EditorState.create({
      doc: 'content',
      selection: { anchor: 0, head: 3 },
    });
    const selectedCodeMirror = {
      state,
      getSelections: () => ['con'],
    };
    const multipleCodeMirror = {
      state,
      getSelections: () => ['', ''],
    };

    expect(menu.isHidden(0, selectedCodeMirror)).toBe(true);
    expect(menu.isHidden(0, multipleCodeMirror)).toBe(true);
    expect(menu.isHidden(-1, { ...selectedCodeMirror, getSelections: () => [''], state: EditorState.create() })).toBe(
      false,
    );
  });
});
