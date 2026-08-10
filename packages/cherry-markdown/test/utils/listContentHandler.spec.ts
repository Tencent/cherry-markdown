import { EditorState } from '@codemirror/state';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import ListHandler from '../../src/utils/listContentHandler';
import { LIST_CONTENT } from '../../src/utils/regexp';

const createEditor = (doc: string, cursor = 0) => {
  let state = EditorState.create({ doc, selection: { anchor: cursor } });
  const dispatch = vi.fn((spec) => {
    state = state.update(spec).state;
  });
  const focus = vi.fn();
  const makeMarkdown = vi.fn((html: string) => html);

  return {
    editor: {
      editor: {
        view: {
          get state() {
            return state;
          },
          dispatch,
          focus,
        },
      },
      $cherry: { engine: { makeMarkdown } },
    },
    dispatch,
    focus,
    makeMarkdown,
    getState: () => state,
  };
};

const createPreview = (items: string[]) => {
  const preview = document.createElement('div');
  const targets = items.map((content) => {
    const li = document.createElement('li');
    li.className = 'cherry-list-item';
    const paragraph = document.createElement('p');
    paragraph.innerHTML = content;
    li.appendChild(paragraph);
    preview.appendChild(li);
    return paragraph;
  });
  return { preview, targets };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utils/listContentHandler', () => {
  it('degrades safely when an editor is unavailable', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const target = document.createElement('p');
    target.contentEditable = 'true';

    const handler = new ListHandler(
      'click',
      target,
      document.createElement('div'),
      document.createElement('div'),
      null,
    );
    handler.remove();

    expect(warning).toHaveBeenCalledWith('ListHandler: editor is not available, list editing is disabled');
    expect(target.hasAttribute('contenteditable')).toBe(false);
  });

  it('maps the selected preview list item to its Markdown content', () => {
    const context = createEditor('- first\n- second');
    const { preview, targets } = createPreview(['first', 'second']);

    const handler = new ListHandler(
      'click',
      targets[1],
      document.createElement('div'),
      preview,
      context.editor as never,
    );

    expect(handler.range).toEqual([10, 16]);
    expect(context.getState().selection.main.from).toBe(10);
    expect(context.getState().selection.main.to).toBe(16);
    expect(handler.position).toBe(16);
  });

  it('does not dispatch a selection when the preview item cannot be mapped', () => {
    const context = createEditor('ordinary text');
    const { preview, targets } = createPreview(['not a list']);

    const handler = new ListHandler(
      'click',
      targets[0],
      document.createElement('div'),
      preview,
      context.editor as never,
    );

    expect(handler.range).toEqual([]);
    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it('removes listeners, editability, and bubble state', () => {
    const context = createEditor('- item');
    const { preview, targets } = createPreview(['item']);
    const removeListener = vi.spyOn(targets[0], 'removeEventListener');
    targets[0].contentEditable = 'true';
    const handler = new ListHandler(
      'click',
      targets[0],
      document.createElement('div'),
      preview,
      context.editor as never,
    );
    const bubble = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.value = 'temporary';
    bubble.appendChild(textarea);
    handler.bubbleContainer = bubble;

    handler.remove();

    expect(bubble.style.display).toBe('none');
    expect(textarea.value).toBe('');
    expect(targets[0].hasAttribute('contenteditable')).toBe(false);
    expect(removeListener).toHaveBeenCalledTimes(2);
  });

  it('routes remove events and ignores unknown event types', () => {
    const handler = Object.create(ListHandler.prototype) as ListHandler;
    const remove = vi.spyOn(handler, 'remove').mockImplementation(() => {});

    expect(handler.emit('unknown', new Event('unknown'))).toBeUndefined();
    handler.emit('remove', new Event('remove'));

    expect(remove).toHaveBeenCalledOnce();
  });

  it('marks paragraph and line-break input without propagating it', () => {
    const handler = Object.create(ListHandler.prototype) as ListHandler & { insertLineBreak: boolean };
    handler.input = false;
    handler.insertLineBreak = false;
    const insertLineBreak = vi.spyOn(handler, 'handleInsertLineBreak').mockImplementation(() => {});
    const target = document.createElement('p');
    const event = {
      target,
      inputType: 'insertParagraph',
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    };

    handler.handleEditablesInput(event as never);

    expect(handler.input).toBe(true);
    expect(handler.insertLineBreak).toBe(true);
    expect(insertLineBreak).toHaveBeenCalledWith(event);
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('converts edited checkbox HTML back to Markdown on focusout', () => {
    const context = createEditor('- [x] old');
    context.makeMarkdown.mockReturnValue('- [x] updated');
    const handler = Object.create(ListHandler.prototype) as ListHandler & {
      insertLineBreak: boolean;
    };
    handler.editor = context.editor as never;
    handler.range = [0, 9];
    handler.input = true;
    handler.insertLineBreak = false;
    handler.isCheckbox = true;
    const remove = vi.spyOn(handler, 'remove').mockImplementation(() => {});
    const target = document.createElement('p');
    target.innerHTML = '<span class="ch-icon ch-icon-check"></span>updated';
    const event = {
      target,
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    };

    handler.handleEditablesUnfocus(event as never);

    expect(context.makeMarkdown).toHaveBeenCalledWith('updated');
    expect(context.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ changes: { from: 0, to: 9, insert: '- [x] updated' } }),
    );
    expect(handler.input).toBe(false);
    expect(handler.isCheckbox).toBe(false);
    expect(remove).toHaveBeenCalledOnce();
  });

  it('writes ordinary edited list content back through the bound focusout listener', () => {
    const context = createEditor('- old');
    context.makeMarkdown.mockReturnValue('**updated**');
    const { preview, targets } = createPreview(['old']);
    const handler = new ListHandler(
      'click',
      targets[0],
      document.createElement('div'),
      preview,
      context.editor as never,
    );
    const remove = vi.spyOn(handler, 'remove').mockImplementation(() => {});
    targets[0].innerHTML = '<strong>updated</strong>';

    targets[0].dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText' }));
    targets[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, cancelable: true }));

    expect(context.makeMarkdown).toHaveBeenCalledWith('<strong>updated</strong>');
    expect(context.getState().doc.toString()).toBe('- **updated**');
    expect(remove).toHaveBeenCalledOnce();
  });

  it('splits an edited list item and returns focus to the editor', () => {
    const context = createEditor('- item', 6);
    const handler = Object.create(ListHandler.prototype) as ListHandler;
    handler.editor = context.editor as never;
    handler.regList = LIST_CONTENT;
    const remove = vi.spyOn(handler, 'remove').mockImplementation(() => {});
    const target = document.createElement('p');
    Object.defineProperty(target, 'innerText', { configurable: true, value: 'before\nafter' });

    const event = { target };
    handler.handleInsertLineBreak(event as never);

    expect(context.getState().doc.toString()).toBe('- before\n- after');
    expect(context.getState().selection.main.head).toBe(16);
    expect(context.focus).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });
});
