import { redo, undo } from '@codemirror/commands';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FullScreen from '../../../src/toolbars/hooks/FullScreen';
import MobilePreview from '../../../src/toolbars/hooks/MobilePreview';
import Redo from '../../../src/toolbars/hooks/Redo';
import SwitchModel from '../../../src/toolbars/hooks/SwitchModel';
import Toc from '../../../src/toolbars/hooks/Toc';
import TogglePreview from '../../../src/toolbars/hooks/TogglePreview';
import Undo from '../../../src/toolbars/hooks/Undo';
import CursorPosition from '../../../src/toolbars/hooks/CursorPosition';
import WordCount from '../../../src/toolbars/hooks/WordCount';
import { createMenuContext } from '../../helpers/menu';

vi.mock('@codemirror/commands', () => ({
  undo: vi.fn(),
  redo: vi.fn(),
}));

describe('toolbars/hooks view controls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('delegates undo and redo to CodeMirror', () => {
    const context = createMenuContext();

    new Undo(context.cherry as never).onClick();
    new Redo(context.cherry as never).onClick();

    expect(undo).toHaveBeenCalledWith(context.view);
    expect(redo).toHaveBeenCalledWith(context.view);
  });

  it('inserts a table of contents marker', () => {
    const context = createMenuContext();
    const toc = new Toc(context.cherry as never);

    expect(toc.name).toBe('toc');
    expect(toc.onClick('before')).toBe('before\n\n[[toc]]\n');
  });

  it('switches mobile preview without losing scroll bindings', () => {
    const context = createMenuContext();
    const previewer = {
      isMobilePreview: false,
      removeScroll: vi.fn(),
      changePreviewToMobile: vi.fn(),
      bindScroll: vi.fn(),
    };
    Object.assign(context.cherry, { previewer });
    const mobilePreview = new MobilePreview(context.cherry as never);

    mobilePreview.onClick();

    expect(previewer.removeScroll).toHaveBeenCalledOnce();
    expect(previewer.changePreviewToMobile).toHaveBeenCalledWith(true);
    expect(previewer.bindScroll).toHaveBeenCalledOnce();
  });

  it('toggles normal preview visibility and keeps its icon synchronized', () => {
    const context = createMenuContext();
    const previewer = {
      isPreviewerNeedFloat: vi.fn(() => false),
      isPreviewerHidden: vi.fn(() => false),
      editOnly: vi.fn(),
      recoverPreviewer: vi.fn(),
    };
    Object.assign(context.editor.previewer, previewer);
    const toggle = new TogglePreview(context.cherry as never);
    const button = toggle.createBtn();

    toggle.onClick();
    expect(previewer.editOnly).toHaveBeenCalledWith(true);
    expect(toggle.isHidden).toBe(true);
    expect(button.querySelector('i')?.classList.contains('ch-icon-preview')).toBe(true);
    expect(context.$event.emit).toHaveBeenCalledWith('togglePreviewHidden', true);

    previewer.isPreviewerHidden.mockReturnValue(true);
    toggle.onClick();
    expect(previewer.recoverPreviewer).toHaveBeenCalledWith(true);
    expect(toggle.isHidden).toBe(false);
    expect(button.querySelector('i')?.classList.contains('ch-icon-previewClose')).toBe(true);
  });

  it('toggles floating previews and responds to preview lifecycle events', () => {
    const context = createMenuContext();
    const previewer = {
      isPreviewerNeedFloat: vi.fn(() => true),
      isPreviewerFloat: vi.fn(() => false),
      floatPreviewer: vi.fn(),
      recoverFloatPreviewer: vi.fn(),
    };
    Object.assign(context.editor.previewer, previewer);
    const toggle = new TogglePreview(context.cherry as never);
    toggle.createBtn();

    toggle.onClick();
    expect(previewer.floatPreviewer).toHaveBeenCalledOnce();
    expect(toggle.isHidden).toBe(true);

    previewer.isPreviewerFloat.mockReturnValue(true);
    toggle.onClick();
    expect(previewer.recoverFloatPreviewer).toHaveBeenCalledWith(true);
    expect(toggle.isHidden).toBe(false);

    context.$event.emit('previewerClose');
    expect(toggle.isHidden).toBe(true);
    context.$event.emit('previewerOpen');
    expect(toggle.isHidden).toBe(false);
    context.$event.emit('previewerOpen');
    expect(toggle.isHidden).toBe(false);
  });

  it('enters and exits fullscreen while refreshing the editor layout', () => {
    const context = createMenuContext();
    const wrapper = document.createElement('div');
    const editorDom = document.createElement('div');
    const toolbarButton = document.createElement('button');
    toolbarButton.className = 'cherry-toolbar-fullscreen';
    toolbarButton.append('old content');
    wrapper.append(editorDom, toolbarButton);
    document.body.append(wrapper);
    const requestMeasure = vi.fn();
    Object.assign(context.editor, { options: { editorDom } });
    Object.assign(context.editor.editor, { requestMeasure });
    const fullscreen = new FullScreen(context.cherry as never);

    fullscreen.onClick();
    expect(wrapper.classList.contains('fullscreen')).toBe(true);
    expect(toolbarButton.querySelector('.ch-icon-minscreen')).not.toBeNull();

    fullscreen.onClick();
    expect(wrapper.classList.contains('fullscreen')).toBe(false);
    expect(toolbarButton.querySelector('.ch-icon-fullscreen')).not.toBeNull();
    expect(requestMeasure).toHaveBeenCalledTimes(2);
  });

  it('switches between preview-only and edit-only toolbar states', () => {
    const context = createMenuContext();
    const previewer = {
      isPreviewerHidden: vi.fn(() => true),
      previewOnly: vi.fn(),
      editOnly: vi.fn(),
    };
    Object.assign(context.editor.previewer, previewer);
    const switchModel = new SwitchModel(context.cherry as never);
    const toolbar = document.createElement('div');
    const item = document.createElement('div');
    const button = switchModel.createBtn();
    item.append(button);
    toolbar.append(item);

    switchModel.onClick();
    expect(previewer.previewOnly).toHaveBeenCalledOnce();
    expect(toolbar.classList.contains('preview-only')).toBe(true);
    expect(button.textContent).toBe('switchEdit');

    previewer.isPreviewerHidden.mockReturnValue(false);
    switchModel.onClick();
    expect(previewer.editOnly).toHaveBeenCalledWith(true);
    expect(toolbar.classList.contains('preview-only')).toBe(false);
    expect(button.textContent).toBe('switchPreview');

    context.$event.emit('toolbarHide');
    expect(button.textContent).toBe('switchEdit');
    context.$event.emit('toolbarShow');
    expect(button.textContent).toBe('switchPreview');
  });

  it('renders cursor position and selected character count', () => {
    const context = createMenuContext('first\nsecond', [{ anchor: 8 }]);
    const cursor = new CursorPosition(context.cherry as never);
    const button = cursor.createBtn();
    cursor.afterInit(button);

    expect(button.textContent).toBe('Ln 1, Col 2');

    context.view.dispatch({ selection: { anchor: 6, head: 12 } });
    context.$event.emit('beforeSelectionChange');
    expect(button.textContent).toBe('Ln 1, Col 6 (6 selected)');
  });

  it('falls back to the first position when no editor view exists', () => {
    const context = createMenuContext();
    Object.assign(context.cherry, { editor: {} });
    const cursor = new CursorPosition(context.cherry as never);
    const button = cursor.createBtn();
    cursor.afterInit(button);

    expect(button.textContent).toBe('Ln 0, Col 0');
  });

  it('cycles through all word count views and persists the state', () => {
    vi.useFakeTimers();
    const context = createMenuContext();
    const wordCount = vi.fn((mode: number) => {
      if (mode === 1) return { characters: 12, words: 3, lines: 2 };
      if (mode === 2) return { paragraphs: 2, images: 1, codeblocks: 4 };
      return { chineseWords: 5, englishWords: 6, numbers: 7, symbols: 8 };
    });
    Object.assign(context.editor, { wordCount });
    const counter = new WordCount(context.cherry as never);
    const button = counter.createBtn();
    counter.afterInit(button);
    vi.advanceTimersByTime(10);
    expect(button.textContent).toBe('wordCount');

    expect(counter.onClick('text')).toBe('text');
    expect(button.textContent).toContain('wordCountC 12');
    counter.onClick('text');
    expect(button.textContent).toContain('wordCountP 2');
    counter.onClick('text');
    expect(button.textContent).toContain('wordCountChinese 5');
    counter.onClick('text');
    expect(button.textContent).toBe('wordCount');
    expect(localStorage.getItem('cherry-wordCountState')).toBe('0');
    expect(wordCount).toHaveBeenCalledTimes(3);
  });

  it('debounces word count updates after editor changes', () => {
    vi.useFakeTimers();
    localStorage.setItem('cherry-wordCountState', '1');
    const context = createMenuContext();
    const wordCount = vi.fn(() => ({ characters: 1, words: 1, lines: 1 }));
    Object.assign(context.editor, { wordCount });
    const counter = new WordCount(context.cherry as never);
    const button = counter.createBtn();
    counter.afterInit(button);
    vi.advanceTimersByTime(10);

    context.$event.emit('afterChange');
    context.$event.emit('afterChange');
    vi.advanceTimersByTime(499);
    expect(wordCount).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1);
    expect(wordCount).toHaveBeenCalledTimes(2);
  });
});
