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
import { isBrowser } from './env';
import { getExternal } from './external';
import { PUNCTUATION } from './regexp';
import { escapeHTMLSpecialChar } from './sanitize';

/**
 * 装饰器，挂载对应的模块到实例上
 */
export function LoadMathModule() {
  const self = /** @type {import('../core/SyntaxBase').default & { katex?: unknown; MathJax?: unknown }} */ (this);
  self.katex = getExternal('katex', self.$externals?.katex);
  self.MathJax = getExternal('MathJax', self.$externals?.MathJax);
}

export const configureMathJax = (usePlugins) => {
  if (!isBrowser()) {
    return;
  }
  const plugins = usePlugins
    ? ['input/asciimath', '[tex]/noerrors', '[tex]/cancel', '[tex]/color', '[tex]/boldsymbol', 'ui/safe']
    : ['ui/safe'];
  // 使用 getExternal 确保 SSR 安全（虽然 configureMathJax 上面已守卫，但保持一致性）
  const mathJaxTarget = /** @type {Record<string, unknown>} */ (getExternal('MathJax'));
  if (mathJaxTarget) {
    Object.assign(mathJaxTarget, {
      startup: {
        elements: ['.Cherry-Math', '.Cherry-InlineMath'],
        typeset: true,
      },
      tex: {
        inlineMath: [
          ['$', '$'],
          ['\\(', '\\)'],
        ],
        displayMath: [
          ['$$', '$$'],
          ['\\[', '\\]'],
        ],
        tags: 'ams',
        packages: { '[+]': ['noerrors', 'cancel', 'color', 'boldsymbol'] },
        macros: {
          bm: ['{\\boldsymbol{#1}}', 1],
        },
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'a'],
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process',
        // 关闭 mathjax 菜单
        enableMenu: false,
      },
      loader: {
        load: plugins,
      },
    });
  }
};

// 控制字符（U+0000–U+001F 以及 U+007F）在 LaTeX 中是非法的，
// MathJax / KaTeX 遇到这类字符（如退格 \x08）时可能直接抛异常，导致整篇预览渲染中断。
const INVALID_MATH_CHAR_REG = /[\u0000-\u001f\u007f]/g;

/**
 * 公式渲染失败时的兜底：回显原始源码，并把其中的非法控制字符用红色标出。
 * @param {string} content 原始公式源码（不含 $ / $$ 定界符）
 * @param {boolean} isDisplayMode 是否为块级公式（决定用 $$ 还是 $ 包裹）
 * @returns {string} HTML 字符串
 */
export function renderMathFallback(content, isDisplayMode) {
  const delimiters = isDisplayMode ? '$$' : '$';
  const body = escapeHTMLSpecialChar(content).replace(INVALID_MATH_CHAR_REG, (char) => {
    const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
    return `<span class="cherry-math-error" style="color:red">\\x${hex}</span>`;
  });
  return `${delimiters}${body}${delimiters}`;
}

const noEscape = ['&', '<', '>', '"', "'"]; // 需要转换为HTML实体字符的符号

// 用于预处理会在Markdown中被反转义的字符，如：\\ 会被反转义为 \
export const escapeFormulaPunctuations = (formula) => {
  const $formula = formula.replace(new RegExp(PUNCTUATION, 'g'), (match) => {
    if (noEscape.indexOf(match) !== -1) {
      // HTML特殊字符需要转换为实体字符，防XSS注入
      return escapeHTMLSpecialChar(match);
    }
    return `\\${match}`; // 先转义特殊字符，防止在afterMakeHtml中被反转义
  });
  return $formula;
};

export default {};
