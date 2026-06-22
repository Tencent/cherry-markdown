/**
 * 搜索工具栏按钮（Cherry Markdown 内置）
 *
 * 点击或快捷键触发；面板由 SearcherCherryPlugin 在 onCherryInit 时挂载。
 */
import MenuBase from '@/toolbars/MenuBase';
import { triggerSearcher } from '@/addons/searcher-runtime';
import { getKeyCode, getPlatformControlKey } from '@/utils/shortcutKey';

export default class Searcher extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('searcher', 'search');
    this.updateMarkdown = false;
    this.shortcutKeyMap = {
      [`${getPlatformControlKey()}-${getKeyCode('f')}`]: {
        hookName: this.name,
        aliasName: this.name,
      },
    };

    const searcherConfig = $cherry.options?.toolbars?.config?.searcher;
    if (searcherConfig?.enableReplace !== false) {
      this.shortcutKeyMap[`${getPlatformControlKey()}-${getKeyCode('h')}`] = {
        hookName: this.name,
        aliasName: 'searcher-replace',
      };
    }
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
