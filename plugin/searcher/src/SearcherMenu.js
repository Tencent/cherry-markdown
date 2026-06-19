// @ts-nocheck
/**
 * 搜索工具栏按钮
 */
import MenuBase from '@cherry/toolbars/MenuBase.js';
import SearcherPanel from './SearcherPanel.js';
import { getKeyCode, getPlatformControlKey } from '@cherry/utils/shortcutKey.js';

export default class SearcherMenu extends MenuBase {
  /**
   * @param {import('@cherry/toolbars/MenuBase.js').MenuBaseConstructorParams} $cherry
   * @param {import('./index.js').SearcherPluginOptions} [options]
   */
  constructor($cherry, options = {}) {
    super($cherry);
    const configOptions = $cherry?.options?.toolbars?.config?.searcher || {};
    this.pluginOptions = { ...configOptions, ...options };
    this.setName('searcher', 'search');
    this.updateMarkdown = false;
    this.shortcutKeyMap = {
      [`${getPlatformControlKey()}-${getKeyCode('f')}`]: {
        hookName: this.name,
        aliasName: this.name,
      },
    };

    const enableReplace = this.pluginOptions.enableReplace !== false;
    if (enableReplace) {
      this.shortcutKeyMap[`${getPlatformControlKey()}-${getKeyCode('h')}`] = {
        hookName: this.name,
        aliasName: `${this.name}-replace`,
      };
    }

    if (!this.$cherry.searcherPanelInstance) {
      this.$cherry.searcherPanelInstance = new SearcherPanel($cherry, this.pluginOptions);
      this.$cherry.searcherPanelInit = false;
    }
  }

  /**
   * 初始化搜索面板 DOM
   */
  ensurePanelMounted() {
    const panel = this.$cherry.searcherPanelInstance;
    if (!panel.dom.parentNode) {
      const wrapper = this.$cherry.editor?.options?.wrapperDom || document.body;
      wrapper.appendChild(panel.dom);
    }
  }

  /**
   * @param {string} selection
   * @param {string} [aliasName]
   */
  onClick(selection, aliasName) {
    this.ensurePanelMounted();

    const panel = this.$cherry.searcherPanelInstance;
    if (!this.$cherry.searcherPanelInit) {
      this.$cherry.searcherPanelInit = true;
      panel.init(this.$cherry.editor.editor);
    }

    if (panel.isVisible()) {
      if (aliasName === `${this.name}-replace`) {
        panel.setReplaceExpanded(true);
        panel.replaceInput?.focus();
        panel.replaceInput?.select();
        return;
      }
      panel.hide();
      return;
    }

    const selectedText = selection || this.getSelectedText();
    const anchorRect = this.dom.getBoundingClientRect();
    const expandReplace =
      aliasName === `${this.name}-replace` || this.pluginOptions.defaultExpandReplace === true;
    panel.show(anchorRect, selectedText, { expandReplace });
  }

  /**
   * 获取当前选中文本
   * @returns {string}
   */
  getSelectedText() {
    const editor = this.$cherry.editor?.editor;
    if (!editor) {
      return '';
    }

    const { from, to } = editor.view.state.selection.main;
    if (from === to) {
      return '';
    }

    return editor.view.state.doc.sliceString(from, to);
  }
}
