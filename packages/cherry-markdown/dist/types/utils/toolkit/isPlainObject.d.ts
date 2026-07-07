/**
 * 判断是否为纯对象（非 null、非数组、原型为 Object 或 null）
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export default function isPlainObject(value: unknown): value is Record<string, unknown>;
