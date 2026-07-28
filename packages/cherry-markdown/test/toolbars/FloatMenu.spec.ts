import { EditorState } from '@codemirror/state';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  });
});
