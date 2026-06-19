/**
 * 创建 DOM 元素
 * @param {string} tag
 * @param {string} [className]
 * @param {Record<string, string>} [attrs]
 */
export function createElement(tag, className = '', attrs = {}) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}
