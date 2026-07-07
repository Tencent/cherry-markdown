/**
 * 深拷贝值。支持纯对象、数组、Date、RegExp；函数与原始类型按引用/值复制。
 * 不支持 Map、Set、TypedArray（Cherry 配置场景未用到）。
 * @template T
 * @param {T} value 待拷贝的值
 * @param {WeakMap<object, unknown>} [stack] 循环引用栈（内部使用）
 * @returns {T} 深拷贝结果
 */
export default function cloneDeep<T>(value: T, stack?: WeakMap<object, unknown>): T;
