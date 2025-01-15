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

import { svg2img, getSvgString } from '@/utils/svgUtils';
import { copyTextByClipboard } from '@/utils/copy';
import MathBlock from '@/core/hooks/MathBlock';

export default class FormulaHandler {
  /** @type{HTMLElement} */
  bubbleContainer = null;
  /**
   * @param {string} trigger 触发方式
   * @param {Element} target 目标dom
   * @param {HTMLDivElement} container bubble容器
   * @param {HTMLDivElement} previewerDom 预览器dom
   * @param {import('../Editor').default} editor 编辑器实例
   */
  constructor(trigger, target, container, previewerDom, editor) {
    this.trigger = trigger;
    this.target = target;
    this.container = container;
    this.previewerDom = previewerDom;
    this.editor = editor;
  }

  /**
   * 触发事件
   * @param {string} type 事件类型
   * @param {Event} event 事件对象
   */
  // @ts-ignore
  emit(type, event) {
    switch (type) {
      case 'remove':
      case 'scroll':
        return this.remove();
    }
  }

  /**
   * 绘制公式操作bubble容器
   */
  drawBubble() {
    const bubbleContainer = document.createElement('div');
    bubbleContainer.innerHTML = `<div class="formula-utils-btn formula-utils-img">
    <button>输出图片</button>
    <div class="formula-utils-submenu formula-utils-img-submenu">
      <div class="formula-utils-submenu-btn formula-utils-img-svg">
        <button data-name="svg">svg</button>
      </div>
      <div class="formula-utils-submenu-btn formula-utils-img-png">
        <button data-name="png">png</button>
      </div>
      <div class="formula-utils-submenu-btn formula-utils-img-jpg">
        <button data-name="jpg">jpg</button>
      </div>
    </div>
  </div>
  <div class="formula-utils-btn formula-utils-code">
    <button>输出代码</button>
    <div class="formula-utils-submenu formula-utils-code-submenu">
      <div class="formula-utils-submenu-btn formula-utils-code-latex">
        <button data-name="latex">latex</button>
      </div>
      <div class="formula-utils-submenu-btn formula-utils-code-html">
        <button data-name="html">html</button>
      </div>
      <div class="formula-utils-submenu-btn formula-utils-code-svgcode">
        <button data-name="svgcode">svgcode</button>
      </div>
    </div>
  </div>
  <div class="formula-utils-btn formula-utils-word">
    <button>输出mathml</button>
    <div class="formula-utils-submenu formula-utils-word-submenu">
      <div class="formula-utils-submenu-btn formula-utils-word-mathml">
        <button data-name="mathml">mathml</button>
      </div>
    </div>
  </div>
  <div class="formula-utils-btn formula-utils-transfer">
    <button>转义</button>
    <div class="formula-utils-submenu formula-utils-transfer-submenu">
      <div class="formula-utils-submenu-btn formula-utils-transfer-backslash">
        <button data-name="\\">反斜杠</button>
      </div>
      <div class="formula-utils-submenu-btn formula-utils-transfer-dollar">
        <button data-name="$">$包裹</button>
      </div>
      <div class="formula-utils-submenu-btn formula-utils-transfer-double-dollar">
        <button data-name="$$">$$包裹</button>
      </div>
    </div>
  </div>`;
    bubbleContainer.id = 'formula-utils-bubble-container'; // 方便 namedItem 获取
    bubbleContainer.className = ['formula-utils-bubble-container'].join(' ');
    this.bubbleContainer = bubbleContainer;
    this?.editor?.$cherry?.wrapperDom?.appendChild(bubbleContainer);
  }

  /**
   * 显示bubble
   * @param {number} x
   * @param {number} y
   */
  showBubble(x, y) {
    const bubbleContainer = this?.editor?.$cherry?.wrapperDom?.children?.namedItem('formula-utils-bubble-container');
    const targetRect = this.target.getBoundingClientRect();
    if (bubbleContainer instanceof HTMLElement) {
      this.bubbleContainer = bubbleContainer;
    } else {
      this.drawBubble();
    }
    this.bubbleContainer.style.display = 'flex';
    this.bubbleContainer.style.top = `${y || targetRect.top}px`;
    this.bubbleContainer.style.left = `${x || targetRect.left}px`;
    this.bubbleContainer.addEventListener('click', this.bubbleClickHandler.bind(this), { once: true });
    this.collectFormulaCode();
  }

  collectFormulaCode() {
    const formulaCode = [];
    // @ts-ignore
    this.editor.editor.getValue().replace(/(\$+)\s*([\w\W]*?)\s*(\1)/g, (whole, start, content, end, offset) => {
      formulaCode.push({
        code: content,
        offset,
      });
    });
    this.formulaCode = formulaCode;
  }

  remove() {
    if (this.bubbleContainer) {
      this.bubbleContainer.style.display = 'none';
    }
  }

  /**
   * bubble 上的点击事件
   * @param {Event} e
   */
  bubbleClickHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    const { target } = e;
    if (target instanceof HTMLButtonElement) {
      const { name = '' } = target.dataset;
      switch (name) {
        case 'svg':
        case 'png':
        case 'jpg':
          // 涉及到图片的操作
          if (this.target instanceof SVGSVGElement) {
            svg2img(this.target, { format: name });
          }
          break;
        case 'html':
        case 'svgcode':
          // 涉及到代码的操作
          if (this.target instanceof SVGSVGElement) {
            if (name === 'svgcode') {
              copyTextByClipboard(getSvgString(this.target));
            } else {
              const mathElement = this.target.parentElement.querySelector('math');
              mathElement.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
              copyTextByClipboard(mathElement.outerHTML);
            }
          }
          break;
        case '\\':
        case '$':
        case '$$':
        case 'latex':
        case 'mathml':
        case 'docx':
          // 涉及到公式API的操作
          {
            const allMjx = this.previewerDom.querySelectorAll('mjx-container');
            let mjxIndex = -1;
            allMjx.forEach((mjx, index) => {
              if (mjx === this.target.parentElement) {
                mjxIndex = index;
              }
            });
            if (mjxIndex >= 0 && this.formulaCode[mjxIndex]) {
              const { code } = this.formulaCode[mjxIndex];
              if (name === 'mathml' || name === 'docx') {
                /** @type {MathBlock} */
                // @ts-ignore
                const hook = this.editor.$cherry.engine.hooks.paragraph.find((hook) => hook instanceof MathBlock);
                if (hook && hook.engine === 'MathJax') {
                  window.MathJax?.texReset();
                  window.MathJax?.tex2mmlPromise?.(code, { display: true }).then((mml) => {
                    if (name === 'mathml') {
                      copyTextByClipboard(mml);
                    } else {
                      // TODO: docx
                    }
                  });
                }
                // TODO: other engine
              } else if (name === 'latex') {
                copyTextByClipboard(code);
              } else if (name === '$') {
                copyTextByClipboard(`${name}${code}${name}`);
              } else if (name === '$$') {
                copyTextByClipboard(`${name}\n${code}\n${name}`);
              } else if (name === '\\') {
                copyTextByClipboard(`\\${code}`);
              }
            }
          }
          break;
      }
    }
    this.remove();
  }
}
