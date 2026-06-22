/**
 * Searcher 运行时注册表（工具栏与 cherry-searcher-plugin 共用，不挂到 Cherry 实例）
 */

/**
 * 桥接层在运行时注册表中的形态（供单测与内部断言）
 * @typedef {Object} SearcherBridgeHandle
 * @property {import('@cherry-markdown/plugin-searcher').default} panel
 * @property {(selection?: string, aliasName?: string) => void} handleTrigger
 * @property {() => void} destroy
 */

/** @type {WeakMap<object, SearcherBridgeHandle>} */
const searcherBridges = new WeakMap();

/**
 * 注册实例桥接层
 * @param {object} cherry
 * @param {SearcherBridgeHandle} bridge
 */
export function registerSearcherBridge(cherry, bridge) {
  searcherBridges.set(cherry, bridge);
}

/**
 * 注销实例桥接层
 * @param {object} cherry
 */
export function unregisterSearcherBridge(cherry) {
  searcherBridges.delete(cherry);
}

/**
 * 获取实例桥接层（仅供单测断言）
 * @param {object} cherry
 * @returns {SearcherBridgeHandle | undefined}
 */
export function getSearcherBridge(cherry) {
  return searcherBridges.get(cherry);
}

/**
 * 工具栏/快捷键触发搜索面板
 * @param {object} cherry
 * @param {string} [selection]
 * @param {string} [aliasName]
 */
export function triggerSearcher(cherry, selection = '', aliasName = '') {
  searcherBridges.get(cherry)?.handleTrigger(selection, aliasName);
}
