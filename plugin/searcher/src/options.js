/**
 * Searcher 插件配置合并
 */
import { DEFAULT_OPTIONS } from './default-options.js';

/** @typedef {import('../types/searcher.types.js').SearcherOptions} SearcherOptions */

/**
 * 合并用户配置与内置默认值
 * @param {Partial<SearcherOptions>} [userOptions]
 * @returns {SearcherOptions & typeof DEFAULT_OPTIONS}
 */
export function mergeOptions(userOptions = {}) {
  const normalized = { ...userOptions };

  // 兼容旧名 closeOnBlur（已改为 closeOnClickOutside）
  if (normalized.closeOnBlur !== undefined && normalized.closeOnClickOutside === undefined) {
    normalized.closeOnClickOutside = normalized.closeOnBlur;
  }
  delete normalized.closeOnBlur;

  return {
    ...DEFAULT_OPTIONS,
    ...normalized,
  };
}
