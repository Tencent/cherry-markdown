/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * 判断当前是否浏览器环境
 * @returns {boolean}
 */
export function isBrowser() {
  return typeof window === 'object';
}

/**
 * 创建 DOM 元素
 * @param {string} tagName
 * @param {string} [className]
 * @param {Object} [attributes]
 * @returns {HTMLElement}
 */
export function createElement(tagName, className = '', attributes = {}) {
  const element = document.createElement(tagName);
  element.className = className;
  if (typeof attributes !== 'undefined') {
    Object.keys(attributes).forEach((key) => {
      const value = attributes[key];
      if (key.startsWith('data-')) {
        const dataName = key.replace(/^data-/, '');
        element.dataset[dataName] = value;
        return;
      }
      element.setAttribute(key, value);
    });
  }
  return element;
}
