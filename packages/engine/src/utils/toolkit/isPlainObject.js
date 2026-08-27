/**
 * 判断是否为纯对象（非 null、非数组、原型为 Object 或 null）
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export default function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
