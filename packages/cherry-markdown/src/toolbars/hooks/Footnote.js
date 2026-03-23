import MenuBase from '@/toolbars/MenuBase';

/**
 * 插入脚注
 */
export default class Footnote extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('footnote', 'footnote');
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string|false} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    if (this.$cherry.status?.wysiwyg === 'show' && this.$cherry.wysiwygEditor) {
      this.$cherry.wysiwygEditor.execCommand('footnote');
      return false;
    }
    const label = this.#nextFootnoteLabel();
    return `${selection}[^${label}]\n\n[^${label}]: 脚注内容\n\n`;
  }

  #nextFootnoteLabel() {
    const doc = this.$cherry.getMarkdown?.() || '';
    let n = 1;
    while (doc.includes(`[^fn${n}]`)) n++;
    return `fn${n}`;
  }
}
