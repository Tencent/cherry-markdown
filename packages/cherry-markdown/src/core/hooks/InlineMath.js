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

  constructor({ config, cherry }) {
    super({ needCache: true });
    // 非浏览器环境下配置为 node
    this.engine = isBrowser() ? (config.engine ?? 'MathJax') : 'node';
    this.$cherry = cherry;
    this.lastCode = '';
  }

  toHtml(wholeMatch, leadingChar, m1) {
    if (!m1) {
      return wholeMatch;
    }
    LoadMathModule.bind(this)('engine');
    const linesArr = m1.match(/\n/g);
    const lines = linesArr ? linesArr.length + 2 : 2;
    const sign = this.$engine.hash(wholeMatch);
    const $m1 = m1.replace(/\\~D/g, '$').replace(/\\~T/g, '~').replace(/~T/g, '~');
    // 既无MathJax又无katex时，原样输出
    let result = '';
    if (this.engine === 'katex') {
      // katex渲染
      if (!this.katex) {
        result = `${leadingChar}<span data-sign="${sign}" class="Cherry-InlineMath cherry-katex-need-render" data-type="mathBlock" data-lines="${lines}" data-content="${encodeURI($m1)}"></span>`;
        this.$engine.asyncRenderHandler.add(`math-inline-${sign}`);
      } else {
        let html = this.katex.renderToString($m1, {
          throwOnError: false,
        });
        if (this.isSelfClosing()) {
          if (/class="katex-error"/.test(html) && this.lastCode) {
            html = this.lastCode;
          }
          this.lastCode = html;
        }
        result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock" data-lines="${lines}">${html}</span>`;
      }
    } else if (this.MathJax?.tex2svg) {
      // MathJax渲染
      let svg = getHTML(this.MathJax.tex2svg($m1, { em: 12, ex: 6, display: false }), true);
      if (this.isSelfClosing()) {
        if (/data-mml-node="merror"/.test(svg) && this.lastCode) {
          svg = this.lastCode;
        }
        this.lastCode = svg;
      }
      result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock" data-lines="${lines}">${svg}</span>`;
    } else {
      result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock"
        data-lines="${lines}">$${escapeFormulaPunctuations(m1)}$</span>`;
    }

    return this.pushCache(result, ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX + sign);
  }

  isSelfClosing() {
    return (
      (this.$cherry.options.engine.syntax.inlineMath && this.$cherry.options.engine.syntax.inlineMath.selfClosing) ||
      this.$cherry.options.engine.global.flowSessionContext
    );
  }

  $dealUnclosingMath(str) {
    let $str = str.replace(/(^|[^\\])(~D)(CHERRYFLOWSESSIONCURSOR\n*|\n*)$/, '$1$3');
    const $strWithOutBlockMath = $str.replace(/(^|[^\\])~D~D/g, '');
    if (/(^|[^\\])~D/.test($strWithOutBlockMath)) {
      $str = $str.replace(/(CHERRYFLOWSESSIONCURSOR\n*|\n*)$/, '~D$1');
    }
    return $str;
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
        .replace(/\\~D/g, '~D') // 出现反斜杠的情况（如/$e=m^2$）会导致多一个反斜杠，这里替换掉
        .replace(/~D/g, '\\~D');
    });
    $str = this.makeInlineMath($str);
    if (this.isSelfClosing()) {
      const $oldStr = $str;
      $str = this.$dealUnclosingMath($str);
      if ($oldStr !== $str) {
        $str = this.makeInlineMath($str);
      }
    }
    return $str;
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
      end: isLookbehindSupported() ? '((?<!\\\\))~D' : '[^\\\\]~D',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
