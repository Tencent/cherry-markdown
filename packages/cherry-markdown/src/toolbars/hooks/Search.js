/**
 * 搜索工具栏按钮（Cherry Markdown 内置）
 *
 * 点击或快捷键触发；面板由 Cherry 初始化后在 toolbars/searcher 中挂载。
 */
import MenuBase from '@/toolbars/MenuBase';
import { triggerSearcher } from '@/toolbars/searcher/SearcherBridge';
import { getKeyCode, getPlatformControlKey } from '@/utils/shortcutKey';

export default class Search extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('search', 'search');
    this.updateMarkdown = false;
    this.shortcutKeyMap = {
      [`${getPlatformControlKey()}-${getKeyCode('f')}`]: {
        hookName: this.name,
        aliasName: this.name,
      },
      [`${getPlatformControlKey()}-${getKeyCode('h')}`]: {
        hookName: this.name,
        aliasName: 'replace',
      },
    };
  }

  /**
   * 响应工具栏点击或快捷键
   * @param {string} selection
   * @param {string} [aliasName]
   */
  onClick(selection, aliasName = '') {
    triggerSearcher(this.$cherry, selection, aliasName);
  }
}
