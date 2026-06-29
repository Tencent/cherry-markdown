/**
 * 搜索工具栏按钮（Cherry Markdown 内置）
 *
 * - 点击 / Mod+F：打开搜索面板
 * - Mod+H：打开并展开替换行（`enableReplace: false` 时不注册）
 *
 * 面板由 {@link initSearcherBridge} 挂载，未配置 `'search'` 时按钮无效果。
 */
import MenuBase from '@/toolbars/MenuBase';
import { getSearcherBridge, isSearcherReplaceEnabled, triggerSearcher } from '@/toolbars/searcher/SearcherBridge';
import { getKeyCode, getPlatformControlKey } from '@/utils/shortcutKey';

/** 主工具栏与侧栏共用的搜索按钮选择器 */
const SEARCH_BUTTON_SELECTOR = '.cherry-toolbar-button.cherry-toolbar-search';

export default class Search extends MenuBase {
  /**
   * @param {object} $cherry Cherry 实例
   *
   * Mod+H 仅在 `enableReplace !== false` 时注册（构造时读取配置，改配置需重新 new Cherry）。
   */
  constructor($cherry) {
    super($cherry);
    this.setName('search', 'search');
    this.updateMarkdown = false;

    this.shortcutKeyMap = {
      [`${getPlatformControlKey()}-${getKeyCode('f')}`]: {
        hookName: this.name,
        aliasName: this.name,
      },
    };

    if (isSearcherReplaceEnabled($cherry)) {
      this.shortcutKeyMap[`${getPlatformControlKey()}-${getKeyCode('h')}`] = {
        hookName: this.name,
        aliasName: 'replace',
      };
    }
  }

  /** 遍历所有搜索工具栏按钮（toolbar / sidebar 可能各有一个） */
  forEachSearchButton(callback) {
    this.$cherry.wrapperDom?.querySelectorAll(SEARCH_BUTTON_SELECTOR).forEach(callback);
  }

  /** 根据 enableReplace 同步 tooltip：「搜索」或「搜索/替换」 */
  syncToolbarLabel() {
    const enableReplace = isSearcherReplaceEnabled(this.$cherry);
    const title = enableReplace
      ? this.locale.search || '搜索/替换'
      : this.locale.searchOnly || this.locale.searchFor || '搜索';

    this.forEachSearchButton((button) => {
      button.setAttribute('title', title);
    });
  }

  /** @param {HTMLElement} btnDom */
  afterInit(btnDom) {
    this.syncToolbarLabel();
  }

  /** @param {boolean} active */
  setToolbarActive(active) {
    this.forEachSearchButton((button) => {
      button.classList.toggle('cherry-toolbar-button--active', active);
    });
  }

  /** 再次点击工具栏按钮时关闭面板 */
  toggleToolbarPanel() {
    const bridge = getSearcherBridge(this.$cherry);
    if (!bridge?.panel.isVisible()) {
      return false;
    }

    bridge.panel.hide();
    return true;
  }

  /** @param {string} selection @param {string} [aliasName] */
  onClick(selection, aliasName = '') {
    const action = aliasName === 'replace' && !isSearcherReplaceEnabled(this.$cherry) ? this.name : aliasName;
    triggerSearcher(this.$cherry, selection, action);
  }
}
