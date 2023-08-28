import { getValueWithoutCode } from '@/utils/regexp';

export default class ListHandler {
  /** @type{HTMLElement} */
  bubbleContainer = null;
  INPUT_AREA_CLASS_NAME = 'cherry-previewer-list-content-hander__input';

  /**
   * @param {string} trigger 触发方式
   * @param {HTMLParagraphElement} target 目标dom
   * @param {HTMLDivElement} container bubble容器
   * @param {HTMLDivElement} previewerDom 预览器dom
   * @param {import('../Editor').default} editor 编辑器实例
   */
  constructor(trigger, target, container, previewerDom, editor, options = {}) {
    this.trigger = trigger;
    this.target = target;
    this.container = container;
    this.previewerDom = previewerDom;
    this.editor = editor;
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const targetRect = entry.target.getBoundingClientRect();
        requestAnimationFrame(() => {
          this.bubbleContainer.setAttribute(
            'style',
            `width: ${targetRect.width}px; height: ${targetRect.height}px; top: ${targetRect.top}px; left: ${targetRect.left}px;`,
          );
        });
      });
    });
  }

  /**
   * 触发事件
   * @param {string} type 事件类型
   * @param {Event} event 事件对象
   */
  emit(type, event) {
    console.log('type: ', type);
    switch (type) {
      case 'remove':
        return this.remove();
      case 'mousedown':
        if (event.target !== this.bubbleContainer && event.target !== this.bubbleContainer.children[0]) {
          return this.remove();
        }
        break;
    }
  }

  drawBubble() {
    this.bubbleContainer = document.createElement('div');
    this.bubbleContainer.id = this.INPUT_AREA_CLASS_NAME;
    this.bubbleContainer.className = [this.INPUT_AREA_CLASS_NAME].join(' ');
    const inputArea = document.createElement('textarea');
    inputArea.addEventListener('input', this.handleTextAreaInput.bind(this));
    this.bubbleContainer.appendChild(inputArea);
    this?.editor?.$cherry?.wrapperDom?.appendChild(this.bubbleContainer);
  }

  showBubble() {
    const bubbleContainer = this?.editor?.$cherry?.wrapperDom?.children?.namedItem(this.INPUT_AREA_CLASS_NAME);
    if (bubbleContainer instanceof HTMLElement) {
      this.bubbleContainer = bubbleContainer;
    } else {
      this.drawBubble();
    }
    this.resizeObserver.observe(this.target);
    if (this.bubbleContainer.children[0] instanceof HTMLTextAreaElement) {
      this.setSelection();
      // 将当前的内容写入textarea
      this.bubbleContainer.children[0].value = this.target.innerText;
      this.bubbleContainer.children[0].focus();
    }
  }

  remove() {
    if (this.bubbleContainer) {
      // this.mutationObserver.disconnect();
      this.resizeObserver.unobserve(this.target);
      this.resizeObserver.disconnect();
      this.bubbleContainer.style.display = 'none';
      if (this.bubbleContainer.children[0] instanceof HTMLTextAreaElement) {
        this.bubbleContainer.children[0].value = ''; // 清空内容
      }
    }
  }

  setSelection() {
    const allLi = Array.from(this.previewerDom.querySelectorAll('li')); // 预览区域内所有的li
    const targetLiIdx = allLi.findIndex((li) => li === this.target.parentElement);
    if (targetLiIdx === -1) {
      return; // 没有找到li
    }
    const contents = getValueWithoutCode(this?.editor.editor.getValue())?.split('\n') ?? [];
    let contentsLiCount = 0; // 编辑器中是列表的数量
    const reg = /(?:[ ]{0,3})(?:[*+-][ ](?:\[[ xX]\])?|[a-z0-9I一二三四五六七八九十零]+\.)([^\r\n]+)/;
    let targetLine = -1; // 行
    let targetCh = -1; // 列
    let targetContent = ''; // 当前点击的li的内容
    contents.forEach((lineContent, lineIdx) => {
      // 匹配是否符合列表的正则
      const regRes = reg.exec(lineContent);
      if (regRes !== null) {
        if (contentsLiCount === targetLiIdx && regRes[1] !== undefined) {
          targetLine = lineIdx;
          [, targetContent] = regRes;
          targetCh = lineContent.indexOf(regRes[1]);
        }
        contentsLiCount += 1;
      }
    });
    this.editor.editor.setSelection(
      { line: targetLine, ch: targetCh },
      { line: targetLine, ch: targetCh + targetContent.length },
    );
  }

  /**
   * 处理textarea的输入事件
   * @param {InputEvent} event
   */
  handleTextAreaInput(event) {
    if (event.inputType === 'insertText') {
      if ('value' in event.target && typeof event.target.value === 'string') {
        this.editor.editor.replaceSelection(event.target.value, 'around'); // 替换当前选中的内容, arrow表示在当前选中的内容的前后插入
      }
    } else if (event.inputType === 'insertLineBreak') {
      // 插入换行符
      this.handleInsertLineBreak();
    }
  }

  handleInsertLineBreak() {
    this.remove(); // 先移除输入框
    // 获取当前光标位置
    const cursor = this.editor.editor.getCursor();
    // 获取光标行的内容
    const lineContent = this.editor.editor.getLine(cursor.line);
    const reg = /([ \t]+[*+-][ ](?:\[[?: xX]\][ ])?|[a-z0-9I一二三四五六七八九十零]+\.)[^\r\n]+/;
    const regRes = reg.exec(lineContent);
    let insertContent = '\n- ';
    if (regRes !== null) {
      insertContent = `\n${regRes[1]?.replace('[x]', '[ ]')}`;
    }
    // 在当前行的末尾插入一个换行符，这会创建一个新行
    this.editor.editor.replaceRange(insertContent, {
      line: cursor.line,
      ch: this.editor.editor.getLine(cursor.line).length,
    });
    // 将光标移动到新行
    this.editor.editor.setCursor({ line: cursor.line + 1, ch: insertContent.length + 1 });
    // 将光标聚焦到编辑器上
    this.editor.editor.focus();
  }
}
