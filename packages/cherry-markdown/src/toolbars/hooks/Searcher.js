/**
 * 搜索工具栏按钮（Cherry Markdown 内置）
 *
 * 点击或快捷键触发；实际搜索面板由 SearcherCherryPlugin 挂载的 searcherBridge 提供。
 */
import MenuBase from '@/toolbars/MenuBase';
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

  getBridge() {
    return /** @type {import('../../addons/cherry-searcher-plugin').SearcherCherryBridge | undefined} */ (
      this.$cherry.searcherBridge
    );
  }

  /**
   * 响应工具栏点击或快捷键
   * @param {string} selection
   * @param {string} [aliasName]
   */
  onClick(selection, aliasName = '') {
    const bridge = this.getBridge();
    if (!bridge) {
      return;
    }

    bridge.handleTrigger(selection, aliasName);
  }
}
