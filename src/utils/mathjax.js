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
import { isBrowser } from './env';
import { PUNCTUATION } from './regexp';
import { escapeHTMLSpecialChar } from './sanitize';

/**
 * 装饰器，挂载对应的模块到实例上
 */
export function LoadMathModule() {
  if (!isBrowser()) {
    return;
  }
  // @ts-ignore
  this.katex = this.externals?.katex ?? window.katex;
  // @ts-ignore
  this.MathJax = this.externals?.MathJax ?? window.MathJax;
}

export const configureMathJax = (usePlugins) => {
  if (!isBrowser()) {
    console.log('mathjax disabled');
    return;
  }
  const plugins = usePlugins
    ? ['input/asciimath', '[tex]/noerrors', '[tex]/cancel', '[tex]/color', '[tex]/boldsymbol']
    : [];
  // @ts-ignore
  window.MathJax = {
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
      packages: { '[+]': ['noerrors', 'cancel', 'color'] },
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
  };
};

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
