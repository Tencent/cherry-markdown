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
import ParagraphBase from '@/core/ParagraphBase';
import { escapeFormulaPunctuations, LoadMathModule } from '@/utils/mathjax';
import { getHTML } from '@/utils/dom';
import { isBrowser } from '@/utils/env';
import { getTableRule, isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';

/**
 * 行内公式的语法
 * 虽然叫做行内公式，Cherry依然将其视为“段落级语法”，因为其具备排他性并且需要优先渲染
 */
export default class InlineMath extends ParagraphBase {
  static HOOK_NAME = 'inlineMath';
  /** @type {'katex' | 'MathJax' | 'node'} */
  engine = 'MathJax'; // 渲染引擎，默认为MathJax，MathJax支持2.x与3.x版本
  katex;
  MathJax;

  constructor({ config }) {
    super({ needCache: true });
    // 非浏览器环境下配置为 node
    this.engine = isBrowser() ? config.engine ?? 'MathJax' : 'node';
  }

  toHtml(wholeMatch, leadingChar, m1) {
    if (!m1) {
      return wholeMatch;
    }
    LoadMathModule.bind(this)('engine');
    const linesArr = m1.match(/\n/g);
    const lines = linesArr ? linesArr.length + 2 : 2;
    const sign = this.$engine.md5(wholeMatch);
    if (this.engine === 'katex' && this.katex?.renderToString) {
      // katex渲染
      const html = this.katex.renderToString(m1, {
        throwOnError: false,
      });
      const result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock" data-lines="${lines}">${html}</span>`;
      return this.pushCache(result, ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX + sign);
    }

    if (this.MathJax?.tex2svg) {
      // MathJax渲染
      const svg = getHTML(this.MathJax.tex2svg(m1, { em: 12, ex: 6, display: false }), true);
      const result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock" data-lines="${lines}">${svg}</span>`;
      return this.pushCache(result, ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX + sign);
    }
    // 既无MathJax又无katex时，原样输出
    const result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock"
        data-lines="${lines}">$${escapeFormulaPunctuations(m1)}$</span>`;
    return this.pushCache(result, ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX + sign);
  }

  beforeMakeHtml(str) {
    let $str = str;
    // 格里处理行内公式，让一个td里的行内公式语法生效，让跨td的行内公式语法失效
    $str = $str.replace(getTableRule(true), (whole, ...args) => {
      return whole
        .split('|')
        .map((oneTd) => {
          return this.makeInlineMath(oneTd);
        })
        .join('|')
        .replace(/~D/g, '\\~D');
    });
    return this.makeInlineMath($str);
  }

  makeInlineMath(str) {
    if (!this.test(str)) {
      return str;
    }
    if (isLookbehindSupported()) {
      return str.replace(this.RULE.reg, this.toHtml.bind(this));
    }
    return replaceLookbehind(str, this.RULE.reg, this.toHtml.bind(this), true, 1);
  }

  makeHtml(str) {
    return str;
  }

  rule() {
    const ret = {
      begin: isLookbehindSupported() ? '((?<!\\\\))~D\\n?' : '(^|[^\\\\])~D\\n?',
      content: '(.*?)\\n?',
      end: '~D',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
