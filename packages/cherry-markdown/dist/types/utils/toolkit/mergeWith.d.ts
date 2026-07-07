/**
 * 深合并对象。末参为函数时视为 customizer（lodash 兼容），否则全部为 source。
 * @param {object} object 目标对象（会被修改）
 * @param {...object|MergeCustomizer} args 一个或多个 source，或 sources + customizer
 * @returns {object} 合并后的目标对象
 */
export default function mergeWith(object: object, ...args: (object | MergeCustomizer)[]): object;
export type MergeCustomizer = (objValue: unknown, srcValue: unknown, key?: string, object?: object, source?: object) => unknown;
