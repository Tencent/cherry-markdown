import { describe, expect, it, vi } from 'vite-plus/test';
import { copyToClip } from '@/utils/copy';
import CodeBlockHandler from '../../src/utils/codeBlockContentHandler';

vi.mock('@/utils/copy', () => ({
  copyToClip: vi.fn(),
}));

const createDoc = (content: string) => ({
  toString: () => content,
  line: (lineNumber: number) => {
    const lines = content.split('\n');
    let from = 0;
    for (let i = 0; i < lineNumber - 1; i += 1) {
      from += lines[i].length + 1;
    }
    return {
      from,
      to: from + lines[lineNumber - 1].length,
      text: lines[lineNumber - 1],
    };
  },
});

const createHandler = (content = '') => {
  const handler = Object.create(CodeBlockHandler.prototype) as CodeBlockHandler & {
    codeBlockEditor: {
      info: Record<string, object | number | string | undefined>;
      codeBlockCodes?: Array<{ code: string; offset: number }>;
      editorDom: {
        inputDom?: {
          destroy: () => void;
          dom?: HTMLElement;
          dispatch?: (spec: { changes: { from: number; to?: number; insert: string } }) => void;
        };
        inputDiv?: HTMLElement;
      };
    };
    codeMirror: {
      view: { state: { doc: ReturnType<typeof createDoc> } };
      state?: {
        doc: { sliceString: (from: number, to: number) => string };
        selection: { main: { from: number; to: number } };
      };
      dispatch?: ReturnType<typeof vi.fn>;
      setSelection: ReturnType<typeof vi.fn>;
      replaceSelection: ReturnType<typeof vi.fn>;
    };
    editing?: boolean;
    target: HTMLElement;
    container: HTMLElement;
    previewerDom: HTMLElement;
    parent: {
      $removeAllPreviewerBubbles: ReturnType<typeof vi.fn>;
      showCodeBlockPreviewerBubbles: ReturnType<typeof vi.fn>;
    };
    $cherry: {
      options: {
        engine: { syntax: { codeBlock: object } };
        callback: {
          onCopyCode: ReturnType<typeof vi.fn>;
          onExpandCode: ReturnType<typeof vi.fn>;
          onUnExpandCode: ReturnType<typeof vi.fn>;
        };
      };
    };
  };

  handler.codeBlockEditor = {
    info: {},
    editorDom: {},
  };
  handler.codeMirror = {
    view: {
      state: {
        doc: createDoc(content),
      },
    },
    setSelection: vi.fn(),
    replaceSelection: vi.fn(),
  };
  handler.container = document.createElement('div');
  handler.previewerDom = document.createElement('div');
  const previewerParent = document.createElement('div');
  previewerParent.appendChild(handler.previewerDom);
  handler.target = document.createElement('div');
  handler.parent = {
    $removeAllPreviewerBubbles: vi.fn(),
    showCodeBlockPreviewerBubbles: vi.fn(),
  };
  handler.$cherry = {
    options: {
      engine: { syntax: { codeBlock: {} } },
      callback: {
        onCopyCode: vi.fn((_event: Event | undefined, code: string) => code),
        onExpandCode: vi.fn(),
        onUnExpandCode: vi.fn(),
      },
    },
  };
  handler.$initReg();

  return handler;
};

const mockedCopyToClip = vi.mocked(copyToClip);

const setInnerText = (element: HTMLElement, value: string) => {
  Object.defineProperty(element, 'innerText', {
    configurable: true,
    value,
  });
};

const createRect = (rect: Partial<DOMRect>): DOMRect => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
  ...rect,
});

const setupCodeBlockTarget = (handler: ReturnType<typeof createHandler>, code = 'console.log(1);') => {
  Object.assign(handler.target.dataset, {
    changeLang: 'true',
    editCode: 'true',
    copyCode: 'true',
    expandCode: 'true',
    lang: 'js',
    type: 'codeBlock',
  });
  const pre = document.createElement('pre');
  setInnerText(pre, code);
  handler.target.appendChild(pre);
  handler.previewerDom.appendChild(handler.target);
  return pre;
};

describe('utils/codeBlockContentHandler', () => {
  it('initializes from constructor arguments and caches the code block regexp', () => {
    const target = document.createElement('div');
    const container = document.createElement('div');
    const previewerDom = document.createElement('div');
    const codeMirror = {
      view: { state: { doc: createDoc('```js\ncode\n```') } },
      setSelection: vi.fn(),
      replaceSelection: vi.fn(),
    };
    const cherry = {
      options: {
        engine: { syntax: { codeBlock: {} } },
        callback: {
          onCopyCode: vi.fn(),
          onExpandCode: vi.fn(),
          onUnExpandCode: vi.fn(),
        },
      },
    };
    const parent = {
      previewer: { $cherry: cherry },
    };

    const handler = new CodeBlockHandler('hover', target, container, previewerDom, codeMirror, parent);
    const cachedReg = handler.codeBlockReg;
    handler.$initReg();

    expect(handler.trigger).toBe('hover');
    expect(handler.target).toBe(target);
    expect(handler.container).toBe(container);
    expect(handler.previewerDom).toBe(previewerDom);
    expect(handler.codeMirror).toBe(codeMirror);
    expect(handler.$cherry).toBe(cherry);
    expect(handler.codeBlockEditor).toEqual({ info: {}, editorDom: {} });
    expect(handler.codeBlockReg).toBe(cachedReg);
  });

  describe('emit', () => {
    it('dispatches simple event types to their handlers', () => {
      const handler = createHandler();
      handler.$remove = vi.fn();
      handler.$updateContainerPosition = vi.fn();
      handler.$tryRemoveMe = vi.fn();
      const event = { target: document.createElement('div') };
      const callback = vi.fn();

      handler.emit('remove');
      handler.emit('scroll');
      handler.emit('previewUpdate');
      handler.emit('resize');
      handler.emit('mouseup', event, callback);

      expect(handler.$remove).toHaveBeenCalledTimes(1);
      expect(handler.$updateContainerPosition).toHaveBeenCalledTimes(3);
      expect(handler.$tryRemoveMe).toHaveBeenCalledWith(event, callback);
    });

    it('updates input offset during preview updates while editing', () => {
      const handler = createHandler();
      handler.editing = true;
      handler.$updateContainerPosition = vi.fn();
      handler.$setInputOffset = vi.fn();

      handler.emit('previewUpdate');

      expect(handler.$updateContainerPosition).toHaveBeenCalledTimes(1);
      expect(handler.$setInputOffset).toHaveBeenCalledTimes(1);
    });

    it('uses the default mouseup callback when removing from an outside click', () => {
      const handler = createHandler();
      handler.editing = true;
      handler.codeBlockEditor.editorDom.inputDiv = document.createElement('div');
      handler.$remove = vi.fn();

      handler.emit('mouseup', { target: document.createElement('button') });

      expect(handler.editing).toBe(false);
      expect(handler.$remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('$collectCodeBlockDom', () => {
    it('records the clicked code block index from the preview DOM', () => {
      const handler = createHandler();
      const first = document.createElement('div');
      const second = document.createElement('div');
      first.dataset.type = 'codeBlock';
      second.dataset.type = 'codeBlock';
      handler.previewerDom.append(first, second);
      handler.target = second;

      handler.$collectCodeBlockDom();

      expect(handler.codeBlockEditor.info).toMatchObject({
        codeBlockNode: second,
        codeBlockIndex: 1,
      });
    });
  });

  describe('$collectCodeBlockCode', () => {
    it('collects fenced code blocks and skips mermaid source blocks', () => {
      const content = [
        'before',
        '```js',
        'console.log(1)',
        '```',
        '',
        '```mermaid',
        'graph TD;',
        '```',
        '',
        '```',
        'plain',
        '```',
      ].join('\n');
      const handler = createHandler(content);

      handler.$collectCodeBlockCode();

      expect(handler.codeBlockEditor.codeBlockCodes).toHaveLength(2);
      expect(handler.codeBlockEditor.codeBlockCodes?.[0]).toMatchObject({
        code: '```js\nconsole.log(1)\n```',
        offset: content.indexOf('```js'),
      });
      expect(handler.codeBlockEditor.codeBlockCodes?.[1].code).toBe('```\nplain\n```');
    });
  });

  describe('selection helpers', () => {
    it('selects the editable body of a fenced block from bottom to top', () => {
      const content = ['intro', '```js', 'const a = 1;', 'const b = 2;', '```'].join('\n');
      const handler = createHandler(content);
      handler.codeBlockEditor.codeBlockCodes = [
        {
          code: '```js\nconst a = 1;\nconst b = 2;\n```',
          offset: content.indexOf('```js'),
        },
      ];

      handler.$setBlockSelection(0);

      expect(handler.codeBlockEditor.info.selection).toEqual([
        { line: 3, ch: 13 },
        { line: 2, ch: 0 },
      ]);
      expect(handler.codeMirror.setSelection).toHaveBeenCalledWith(38, 12);
    });

    it('selects the language portion of a fenced block', () => {
      const content = ['intro', '```ts', 'const a = 1;', '```'].join('\n');
      const handler = createHandler(content);
      handler.codeBlockEditor.codeBlockCodes = [
        {
          code: '```ts\nconst a = 1;\n```',
          offset: content.indexOf('```ts'),
        },
      ];

      handler.$setLangSelection(0);

      expect(handler.codeBlockEditor.info.selection).toEqual([
        { line: 1, ch: 3 },
        { line: 1, ch: 5 },
      ]);
      expect(handler.codeMirror.setSelection).toHaveBeenCalledWith(9, 11);
    });

    it('finds the clicked preview block and switches between body and language selection', () => {
      const content = ['```js', 'console.log(1)', '```'].join('\n');
      const handler = createHandler(content);
      const first = document.createElement('div');
      const second = document.createElement('div');
      first.dataset.type = 'codeBlock';
      second.dataset.type = 'codeBlock';
      handler.previewerDom.append(first, second);
      handler.target = first;
      const blockSelectionSpy = vi.spyOn(handler, '$setBlockSelection');
      const langSelectionSpy = vi.spyOn(handler, '$setLangSelection');

      handler.$findCodeInEditor();
      handler.$findCodeInEditor(true);

      expect(handler.codeBlockEditor.info.codeBlockIndex).toBe(0);
      expect(blockSelectionSpy).toHaveBeenCalledWith(0);
      expect(langSelectionSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('lifecycle helpers', () => {
    it('shows hover buttons, handles wheel scrolling, and routes edit clicks into click-mode editor', () => {
      const handler = createHandler('```js\nconsole.log(1)\n```');
      setupCodeBlockTarget(handler);
      handler.trigger = 'hover';
      handler.$updateContainerPosition = vi.fn();
      handler.$expandCodeBlock = vi.fn();
      handler.$hideAllBtn = vi.fn();

      handler.showBubble();
      handler.container.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 }));
      const editButton = handler.container.querySelector('.cherry-edit-code-block') as HTMLElement;
      editButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler.$updateContainerPosition).toHaveBeenCalledTimes(1);
      expect(handler.container.querySelector('#code-preview-lang-select')).toBeTruthy();
      expect(handler.container.querySelector('.cherry-copy-code-block')).toBeTruthy();
      expect(handler.container.querySelector('.cherry-unExpand-code-block')).toBeTruthy();
      expect(handler.previewerDom.scrollTop).toBe(10);
      expect(handler.$expandCodeBlock).toHaveBeenCalled();
      expect(handler.$hideAllBtn).toHaveBeenCalled();
      expect(handler.parent.$removeAllPreviewerBubbles).toHaveBeenCalledWith('click');
      expect(handler.parent.showCodeBlockPreviewerBubbles).toHaveBeenCalledWith('click', handler.target);
    });

    it('shows the click editor entry path without constructing CodeMirror in the test', () => {
      const handler = createHandler();
      handler.trigger = 'click';
      handler.$updateContainerPosition = vi.fn();
      handler.$showContentEditor = vi.fn();

      handler.showBubble(false);

      expect(handler.$updateContainerPosition).toHaveBeenCalledTimes(1);
      expect(handler.$showContentEditor).toHaveBeenCalledTimes(1);
    });

    it('sets editing state before drawing the content editor', () => {
      const handler = createHandler();
      handler.$findCodeInEditor = vi.fn();
      handler.$drawEditor = vi.fn();

      handler.$showContentEditor();

      expect(handler.editing).toBe(true);
      expect(handler.$findCodeInEditor).toHaveBeenCalledTimes(1);
      expect(handler.$drawEditor).toHaveBeenCalledTimes(1);
    });

    it('changes language by selecting the fence info string', () => {
      const handler = createHandler();
      handler.$findCodeInEditor = vi.fn();

      handler.$changeLang('typescript');

      expect(handler.$findCodeInEditor).toHaveBeenCalledWith(true);
      expect(handler.codeMirror.replaceSelection).toHaveBeenCalledWith('typescript', 'around');
    });

    it('hides only buttons that are currently displayed', () => {
      const handler = createHandler();
      const changeLangDom = document.createElement('select');
      const editDom = document.createElement('div');
      const copyDom = document.createElement('div');
      const unExpandDom = document.createElement('div');
      changeLangDom.style.display = 'block';
      editDom.style.display = 'inline-block';
      copyDom.style.display = 'flex';
      unExpandDom.style.display = 'grid';
      handler.changeLangDom = changeLangDom;
      handler.editDom = editDom;
      handler.copyDom = copyDom;
      handler.unExpandDom = unExpandDom;

      handler.$hideAllBtn();

      expect(changeLangDom.style.display).toBe('none');
      expect(editDom.style.display).toBe('none');
      expect(copyDom.style.display).toBe('none');
      expect(unExpandDom.style.display).toBe('none');
    });

    it('destroys the nested editor view when removing the handler', () => {
      const handler = createHandler();
      const destroy = vi.fn();
      handler.codeBlockEditor.editorDom.inputDom = { destroy };

      handler.$remove();

      expect(destroy).toHaveBeenCalledTimes(1);
      expect(handler.codeBlockEditor).toEqual({ info: {}, codeBlockCodes: [], editorDom: {} });
    });

    it('logs destroy failures and still clears handler state', () => {
      const handler = createHandler();
      const error = new Error('destroy failed');
      handler.codeBlockEditor.editorDom.inputDom = {
        destroy: () => {
          throw error;
        },
      };

      handler.$remove();
      expect(handler.codeBlockEditor).toEqual({ info: {}, codeBlockCodes: [], editorDom: {} });
    });

    it('does not remove while clicking inside the active editor', () => {
      const handler = createHandler();
      const inputDiv = document.createElement('div');
      const target = document.createElement('button');
      inputDiv.appendChild(target);
      handler.codeBlockEditor.editorDom.inputDiv = inputDiv;
      handler.editing = true;
      handler.$remove = vi.fn();
      const callback = vi.fn();

      handler.$tryRemoveMe({ target }, callback);

      expect(handler.$remove).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    it('removes and calls back when clicking outside the active editor', () => {
      const handler = createHandler();
      handler.codeBlockEditor.editorDom.inputDiv = document.createElement('div');
      handler.editing = true;
      handler.$remove = vi.fn();
      const callback = vi.fn();

      handler.$tryRemoveMe({ target: document.createElement('button') }, callback);

      expect(handler.editing).toBe(false);
      expect(handler.$remove).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('copies code through the configured callback and restores the copy icon', () => {
      vi.useFakeTimers();
      mockedCopyToClip.mockClear();
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'const copied = true;');
      const copyDom = document.createElement('div');
      copyDom.innerHTML = '<i class="ch-icon ch-icon-copy"></i>';
      handler.copyDom = copyDom;
      handler.$cherry.options.callback.onCopyCode.mockReturnValue('final code');

      handler.$copyCodeBlock();

      const icon = copyDom.querySelector('i') as HTMLElement;
      expect(handler.$cherry.options.callback.onCopyCode).toHaveBeenCalledWith(
        { target: handler.target },
        'const copied = true;',
      );
      expect(icon.className).toContain('ch-icon-ok');
      expect(mockedCopyToClip).toHaveBeenCalledWith('final code');

      vi.advanceTimersByTime(1000);
      expect(icon.className).toContain('ch-icon-copy');
      vi.useRealTimers();
    });

    it('does not copy when the configured copy callback returns false', () => {
      mockedCopyToClip.mockClear();
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'blocked();');
      handler.copyDom = document.createElement('div');
      handler.$cherry.options.callback.onCopyCode.mockReturnValue(false);

      expect(handler.$copyCodeBlock()).toBe(false);
      expect(mockedCopyToClip).not.toHaveBeenCalled();
    });

    it('copies callback output even when the copy icon is absent', () => {
      mockedCopyToClip.mockClear();
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'copy without icon');
      handler.copyDom = document.createElement('div');
      handler.$cherry.options.callback.onCopyCode.mockReturnValue('no icon result');

      handler.$copyCodeBlock();

      expect(mockedCopyToClip).toHaveBeenCalledWith('no icon result');
    });

    it('expands and collapses code blocks through configured callbacks', () => {
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'expandable();');
      const unExpandDom = document.createElement('div');
      unExpandDom.className = 'hidden';
      handler.unExpandDom = unExpandDom;
      const event = new MouseEvent('click');

      handler.$expandCodeBlock(true, event);
      expect(handler.target.classList.contains('cherry-code-expand')).toBe(true);
      expect(unExpandDom.classList.contains('hidden')).toBe(false);
      expect(handler.$cherry.options.callback.onUnExpandCode).toHaveBeenCalledWith(event, 'expandable();');

      handler.$expandCodeBlock(false, event);
      expect(handler.target.classList.contains('cherry-code-unExpand')).toBe(true);
      expect(unExpandDom.classList.contains('hidden')).toBe(true);
      expect(handler.$cherry.options.callback.onExpandCode).toHaveBeenCalledWith(event, 'expandable();');
    });

    it('skips expand handling until the collapse button exists', () => {
      const handler = createHandler();
      setupCodeBlockTarget(handler);

      handler.$expandCodeBlock(true, new MouseEvent('click'));

      expect(handler.target.classList.contains('cherry-code-expand')).toBe(false);
      expect(handler.$cherry.options.callback.onUnExpandCode).not.toHaveBeenCalled();
    });
  });

  describe('position helpers', () => {
    it('renders custom buttons and language changes from hover toolbar', () => {
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'custom();');
      const onClick = vi.fn();
      handler.$cherry.options.engine.syntax.codeBlock = {
        customBtns: [{ html: '<span class="custom">C</span>', onClick }],
      };
      handler.$changeLang = vi.fn();

      handler.$showBtn(true);
      const select = handler.container.querySelector('#code-preview-lang-select') as HTMLSelectElement;
      const customButton = handler.container.querySelector('.cherry-code-block-custom-btn') as HTMLElement;
      select.value = 'go';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      customButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler.$changeLang).toHaveBeenCalledWith('go');
      expect(handler.parent.$removeAllPreviewerBubbles).toHaveBeenCalledWith('click');
      expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent), 'custom();', 'js', handler.target);
    });

    it('uses an empty custom button language when the target has no lang dataset', () => {
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'custom();');
      delete handler.target.dataset.lang;
      const onClick = vi.fn();
      handler.$cherry.options.engine.syntax.codeBlock = {
        customBtns: [{ html: '<span class="custom">C</span>', onClick }],
      };

      handler.$showBtn(false);
      const customButton = handler.container.querySelector('.cherry-code-block-custom-btn') as HTMLElement;
      customButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent), 'custom();', '', handler.target);
      expect(handler.container.querySelector('#code-preview-lang-select')).toBeNull();
      expect(handler.container.querySelector('.cherry-edit-code-block')).toBeNull();
    });

    it('routes copy and collapse button clicks through their toolbar handlers', () => {
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'toolbar();');
      handler.target.classList.add('cherry-code-expand');
      const mask = document.createElement('div');
      mask.className = 'cherry-mask-code-block';
      handler.target.appendChild(mask);
      handler.$copyCodeBlock = vi.fn();
      handler.$expandCodeBlock = vi.fn();

      handler.$showBtn(true);
      const copyButton = handler.container.querySelector('.cherry-copy-code-block') as HTMLElement;
      const collapseButton = handler.container.querySelector('.cherry-unExpand-code-block') as HTMLElement;
      copyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      collapseButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler.parent.$removeAllPreviewerBubbles).toHaveBeenCalledWith('click');
      expect(handler.$copyCodeBlock).toHaveBeenCalledTimes(1);
      expect(handler.$expandCodeBlock).toHaveBeenCalledWith(false, expect.any(MouseEvent));
      expect(collapseButton.classList.contains('hidden')).toBe(false);
    });

    it('draws a nested editor and dispatches content edits back to the source editor', () => {
      const handler = createHandler();
      const source = 'before selected after';
      const dispatch = vi.fn();
      handler.codeMirror.state = {
        doc: {
          sliceString: (from: number, to: number) => source.slice(from, to),
        },
        selection: { main: { from: 7, to: 15 } },
      };
      handler.codeMirror.dispatch = dispatch;
      handler.codeBlockEditor.info.codeBlockNode = handler.target;
      handler.target.getBoundingClientRect = vi.fn(() => createRect({ top: 20, left: 30, width: 140, height: 40 }));
      const parent = handler.previewerDom.parentNode as HTMLElement;
      parent.getBoundingClientRect = vi.fn(() => createRect({ top: 10, left: 10, height: 300 }));

      handler.$drawEditor();
      handler.codeBlockEditor.editorDom.inputDom?.dispatch?.({ changes: { from: 0, to: 8, insert: 'changed' } });

      expect(handler.codeBlockEditor.editorDom.inputDiv?.className).toBe(
        'cherry-previewer-codeBlock-content-handler__input',
      );
      expect(handler.container.contains(handler.codeBlockEditor.editorDom.inputDiv as Node)).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        changes: { from: 7, to: 15, insert: 'changed' },
      });
    });

    it('suppresses editor controls for mermaid source toolbar panels', () => {
      const handler = createHandler();
      setupCodeBlockTarget(handler, 'graph TD;');
      const panel = document.createElement('div');
      panel.className = 'cherry-mermaid-source-toolbar-panel';
      panel.appendChild(handler.target);
      handler.previewerDom.appendChild(panel);

      handler.$showBtn(true);

      expect(handler.container.querySelector('#code-preview-lang-select')).toBeNull();
      expect(handler.container.querySelector('.cherry-edit-code-block')).toBeNull();
      expect(handler.container.querySelector('.cherry-copy-code-block')).toBeTruthy();
    });

    it('updates container and nested editor dimensions from measured positions', () => {
      const handler = createHandler();
      const parent = handler.previewerDom.parentNode as HTMLElement;
      handler.codeBlockEditor.info.codeBlockNode = handler.target;
      const inputDiv = document.createElement('div');
      const editorWrapper = document.createElement('div');
      handler.codeBlockEditor.editorDom.inputDiv = inputDiv;
      handler.codeBlockEditor.editorDom.inputDom = { dom: editorWrapper, destroy: vi.fn() };
      handler.target.style.fontSize = '18px';
      handler.target.style.fontFamily = 'monospace';
      handler.target.getBoundingClientRect = vi.fn(() => createRect({ top: 50, left: 70, width: 180, height: 60 }));
      parent.getBoundingClientRect = vi.fn(() => createRect({ top: 10, left: 20, height: 300 }));

      handler.$updateContainerPosition();
      handler.$updateEditorPosition();

      expect(handler.container.style.width).toBe('180px');
      expect(handler.container.style.top).toBe('40px');
      expect(handler.container.style.left).toBe('50px');
      expect(inputDiv.style.width).toBe('180px');
      expect(inputDiv.style.height).toBe('70px');
      expect(editorWrapper.style.fontSize).toBe('18px');
      expect(editorWrapper.style.lineHeight).toBe('1.8em');
      expect(editorWrapper.style.zIndex).toBe('1');
    });

    it('sets style only when the measured value differs', () => {
      const handler = createHandler();
      const element = document.createElement('div');
      const rect = { width: 20 };
      element.getBoundingClientRect = vi.fn(() => rect as DOMRect);

      handler.setStyle(element, 'width', '40px');

      expect(element.style.width).toBe('40px');
    });

    it('calculates code block position relative to the preview parent', () => {
      const handler = createHandler();
      const parent = handler.previewerDom.parentNode as HTMLElement;
      handler.codeBlockEditor.info.codeBlockNode = handler.target;
      const targetRect = { top: 30, left: 50, width: 120, height: 40 };
      const parentRect = { top: 10, left: 20, height: 300 };
      handler.target.getBoundingClientRect = vi.fn(() => targetRect as DOMRect);
      parent.getBoundingClientRect = vi.fn(() => parentRect as DOMRect);

      expect(handler.$getPosition()).toEqual({
        top: 20,
        height: 40,
        width: 120,
        left: 30,
        maxHeight: 300,
      });
    });
  });
});
