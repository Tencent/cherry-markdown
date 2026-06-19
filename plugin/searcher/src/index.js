/**
 * Searcher 插件入口
 *
 * 提供 TEditor 风格的文档搜索面板，通过工具栏按钮或 Mod+F 快捷键唤起。
 */
import mergeWith from 'lodash/mergeWith';
import SearcherMenu from './SearcherMenu.js';

/**
 * @typedef {Object} SearcherTagItem
 * @property {string} value - 标签值
 * @property {string} [label] - 展示文本
 */

/**
 * @typedef {Object} SearcherPluginOptions
 * @property {string} [placeholder] - 搜索输入框占位文本
 * @property {string} [recentTitle] - 最近文本区域标题
 * @property {SearcherTagItem[]} [recentTexts] - 历史记录/推荐标签
 * @property {number} [maxRecentCount=10] - 最大历史记录数量
 * @property {string} [storageKey] - localStorage 存储键名
 * @property {(value: string) => boolean | void} [onTagDelete] - 标签删除回调，返回 false 阻止删除
 * @property {boolean} [enableReplace=true] - 是否启用替换功能
 * @property {boolean} [defaultExpandReplace=false] - 打开面板时是否默认展开替换行
 */

export default class SearcherPlugin {
  /**
   * 安装插件，注册 searcher 菜单并合并配置
   * @param {Record<string, unknown>} cherryOptions
   * @param {SearcherPluginOptions} [options]
   */
  static install(cherryOptions, options = {}) {
    const SearcherMenuWithOptions = class extends SearcherMenu {
      constructor($cherry) {
        super($cherry, options);
      }
    };

    mergeWith(cherryOptions, {
      toolbars: {
        config: {
          searcher: options,
        },
        customMenu: {
          searcher: SearcherMenuWithOptions,
        },
      },
    });
  }
}

export { default as SearcherMenu } from './SearcherMenu.js';
export { default as SearcherPanel } from './SearcherPanel.js';
export * from './search-utils.js';
