/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
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
function mergeMarginBottom(bottom, top) {
  const currentBottom = parseFloat(bottom);
  const nextTop = parseFloat(top);
  if (nextTop >= 0) {
    // 不受合并影响
    return currentBottom;
  }
  if (currentBottom >= 0) {
    return currentBottom + nextTop;
  }
  // 同时为负数，取最小的
  return Math.min(currentBottom, nextTop);
}

function mergeMarginTop(bottom, top) {
  const prevBottom = parseFloat(bottom);
  const currentTop = parseFloat(top);
  if (currentTop < 0) {
    // 负数的margin都被上一个区块吸收了
    return 0;
  }
  if (prevBottom >= 0) {
    // 如果当前margin-top比上一个margin-bottom要大，则只合并部分；反之合并全部，归属于上一个区块
    return Math.max(currentTop - prevBottom, 0);
  }
  // 上一个margin-bottom为负数不受影响
  return currentTop;
}
/**
 * 用于解决块级元素边距合并问题
 * @param {HTMLElement} element
 */
export function getBlockTopAndHeightWithMargin(element) {
  const prevSibling = element.previousElementSibling;
  const nextSibling = element.nextElementSibling;
  if (!prevSibling) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (!nextSibling) {
      return {
        // marginBottom可能为负数
        height: Math.max(parseFloat(style.marginTop) + rect.height + parseFloat(style.marginBottom), 0),
        offsetTop: element.offsetTop - Math.abs(parseFloat(style.marginTop)),
      };
    }
    const nextSibStyle = getComputedStyle(nextSibling);
    const marginBottom = mergeMarginBottom(style.marginBottom, nextSibStyle.marginTop);
    return {
      height: Math.max(parseFloat(style.marginTop) + rect.height + marginBottom, 0), // marginBottom可能为负数
      offsetTop: element.offsetTop - Math.abs(parseFloat(style.marginTop)),
    };
  }
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const prevSibStyle = getComputedStyle(prevSibling);
  const marginTop = mergeMarginTop(prevSibStyle.marginBottom, style.marginTop);
  if (!nextSibling) {
    return {
      height: Math.max(marginTop + rect.height + parseFloat(style.marginBottom), 0), // marginBottom可能为负数
      offsetTop: element.offsetTop - Math.abs(parseFloat(style.marginTop)),
    };
  }
  const nextSibStyle = getComputedStyle(nextSibling);
  const marginBottom = mergeMarginBottom(style.marginBottom, nextSibStyle.marginTop);
  return {
    height: Math.max(marginTop + rect.height + marginBottom, 0), // marginBottom可能为负数
    offsetTop: element.offsetTop - Math.abs(marginTop),
  };
}

/**
 * document.elementsFromPoint polyfill
 * ref: https://github.com/JSmith01/elementsfrompoint-polyfill/blob/master/index.js
 * @param {number} x
 * @param {number} y
 */
export function elementsFromPoint(x, y) {
  // see https://caniuse.com/#search=elementsFromPoint
  if (typeof document.elementsFromPoint === 'function') {
    return document.elementsFromPoint(x, y);
  }

  if (typeof (/** @type {any}*/ (document).msElementsFromPoint) === 'function') {
    const nodeList = /** @type {any}*/ (document).msElementsFromPoint(x, y);
    return nodeList !== null ? Array.from(nodeList) : nodeList;
  }
  const elements = [];
  const pointerEvents = [];
  /** @type {HTMLElement} */
  let ele;
  do {
    const currentElement = /** @type {HTMLElement} */ (document.elementFromPoint(x, y));
    if (ele !== currentElement) {
      ele = currentElement;
      elements.push(ele);
      pointerEvents.push(ele.style.pointerEvents);
      ele.style.pointerEvents = 'none';
    } else {
      ele = null;
    }
  } while (ele);
  elements.forEach((e, index) => {
    e.style.pointerEvents = pointerEvents[index];
  });
  return elements;
}

export function getHTML(who, deep) {
  if (!who || !who.tagName) {
    return '';
  }
  let txt;
  let ax;
  let el = document.createElement('div');
  el.appendChild(who.cloneNode(false));
  txt = el.innerHTML;
  if (deep) {
    ax = txt.indexOf('>') + 1;
    txt = txt.substring(0, ax) + who.innerHTML + txt.substring(ax);
  }
  el = null;
  return txt;
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tagName 标签名
 * @param {string} className 元素类名
 * @param {Record<string,string>} attributes 附加属性
 * @returns {HTMLElementTagNameMap[K]}
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
