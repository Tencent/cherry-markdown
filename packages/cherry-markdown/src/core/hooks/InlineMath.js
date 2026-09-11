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
import { escapeFormulaPunctuations, LoadMathModule, renderMathFallback } from '@/utils/mathjax';
import { getHTML } from '@/utils/dom';
import { isBrowser } from '@/utils/env';
import { getTableRule, isLookbehindSupported, mathBlockReg } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';

// 归一化 \(...\) → ~D...~D（用于 InlineMath）；带反斜杠转义感知 + 空内容保护
const parenInlineReg = isLookbehindSupported()
  ? /(?<!\\)\\\(([\s\S]+?)(?<!\\)\\\)/g
  : /(^|[^\\])\\\(([\s\S]+?)(?<!\\)\\\)/g;

// selfClosing 场景下，匹配"未闭合的 \( + 到 EOL 之间的内容"，用于补开定界符 ~D
// 调用前会先跑一次 makeInlineMath 把已闭合的 ~D..~D 全部冻结到 cache。
const parenOpenOnlyReg = isLookbehindSupported()
  ? /(?<!\\)\\\(([\s\S]+?)(CHERRYFLOWSESSIONCURSOR\n*)?$/
  : /(^|[^\\])\\\(([\s\S]+?)(CHERRYFLOWSESSIONCURSOR\n*)?$/;

// 表格 td 里归一化 \[...\] → ~D~D...~D~D（td 内部逻辑）
const bracketBlockRegForTd = isLookbehindSupported()
  ? /(?<!\\)\\\[([\s\S]+?)(?<!\\)\\\]/g
  : /(^|[^\\])\\\[([\s\S]+?)(?<!\\)\\\]/g;

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
    // 是否启用 TeX 风格定界符 \( ... \)（默认开启）
    // 关闭后，\( ... \)、表格 td 内的 \[ ... \] 都不会被归一化为 $..$ / $$..$$，
    // 仅保留原生 $..$ 的行内公式渲染能力。
    this.TeXDelimiter = config.TeXDelimiter !== false;
    this.$cherry = cherry;
    /**
     * 这里本意是用来存储「上一轮」成功渲染里的最后一个公式
     * 但因为偷懒，存的是「上一次」成功渲染里的公式，所以这里有个大大的「TODO」
     * 同时，mermaid渲染那里也有同样的问题，也有个大大的「TODO」
     */
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
    let $m1 = m1.replace(/\\~D/g, '$').replace(/\\~T/g, '~').replace(/~T/g, '~');
    const hasCursor = /CHERRYFLOWSESSIONCURSOR/.test($m1);
    $m1 = $m1.replace('CHERRYFLOWSESSIONCURSOR', '');
    // 保留一份源码到渲染节点上，供 formulaUtilsHandler 直接读取，避免再次对全文做正则解析。
    const encodedFormulaSource = encodeURIComponent($m1);
    // 既无MathJax又无katex时，原样输出
    let result = '';
    if (this.engine === 'katex') {
      // katex渲染
      if (!this.katex) {
        result = `${leadingChar}<span data-sign="${sign}" class="Cherry-InlineMath cherry-katex-need-render" data-type="mathBlock" data-formula-source="${encodedFormulaSource}" data-lines="${lines}" data-content="${encodeURIComponent($m1)}"></span>`;
        this.$engine.asyncRenderHandler.add(`math-inline-${sign}`);
      } else {
        let html;
        try {
          html = this.katex.renderToString($m1, {
            throwOnError: false,
          });
        } catch (e) {
          html = renderMathFallback($m1, false);
        }
        if (this.isSelfClosing()) {
          if (/class="katex-error"/.test(html) && this.lastCode) {
            html = this.lastCode;
          }
          this.lastCode = html;
        }
        result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock" data-lines="${lines}" data-formula-source="${encodedFormulaSource}">${html}</span>`;
      }
    } else if (this.engine === 'MathJax') {
      // MathJax渲染
      if (!this.MathJax?.tex2svg) {
        // MathJax尚未加载完成，先输出占位符，等待异步加载完成后再渲染
        result = `${leadingChar}<span data-sign="${sign}" class="Cherry-InlineMath cherry-mathjax-need-render" data-type="mathBlock" data-formula-source="${encodedFormulaSource}" data-lines="${lines}" data-content="${encodeURIComponent($m1)}"></span>`;
        this.$engine.asyncRenderHandler.add(`math-inline-${sign}`);
      } else {
        let svg;
        try {
          svg = getHTML(this.MathJax.tex2svg($m1, { em: 12, ex: 6, display: false }), true);
        } catch (e) {
          svg = renderMathFallback($m1, false);
        }
        if (this.isSelfClosing()) {
          if (/data-mml-node="merror"/.test(svg) && this.lastCode) {
            svg = this.lastCode;
          }
          this.lastCode = svg;
        }
        result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock" data-lines="${lines}" data-formula-source="${encodedFormulaSource}">${svg}</span>`;
      }
    } else {
      result = `${leadingChar}<span class="Cherry-InlineMath" data-type="mathBlock"
        data-lines="${lines}" data-formula-source="${encodedFormulaSource}">$${escapeFormulaPunctuations(m1)}$</span>`;
    }

    const appendCursor = hasCursor ? 'CHERRYFLOWSESSIONCURSOR' : '';
    return this.pushCache(result, ParagraphBase.IN_PARAGRAPH_CACHE_KEY_PREFIX + sign) + appendCursor;
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
    let result = '';
    let cursor = 0;
    // 表格里处理行内公式，让一个td里的行内公式语法生效，让跨td的行内公式语法失效
    str.replace(getTableRule(true), (whole, ...args) => {
      const offset = args[args.length - 2];
      result += this.makeInlineMathWithSelfClosing(this.normalizeTexInlineMath(str.slice(cursor, offset)));
      const arr = whole.split('|');
      result += arr
        .map((oneTd, index) => {
          const isLastTd = index === arr.length - 1;
          // Step 1: 先跑一次 makeInlineMath 把原生 ~D..~D 段冻结到 cache
          let tdContent = this.makeInlineMath(oneTd);
          if (this.TeXDelimiter) {
            // Step 2: 归一化 \[..\] → ~D..~D
            tdContent = this.rewriteBracketBlockInTd(tdContent);
            // Step 3: 归一化 \(..\) → ~D..~D
            tdContent = this.rewriteParenInline(tdContent);
            // Step 4: selfClosing 仅最后一个 td 生效——补开 \(
            if (isLastTd && this.isSelfClosing()) {
              tdContent = this.rewriteOpenOnlyParen(tdContent);
            }
          }
          // 单元格里的段落公式直接替换成行内公式
          tdContent = this.transformBlockMathToInlineMath(tdContent);
          if (isLastTd) {
            return this.makeInlineMathWithSelfClosing(tdContent);
          }
          return this.makeInlineMath(tdContent);
        })
        .join('|')
        .replace(/\\~D/g, '~D') // 出现反斜杠的情况（如/$e=m^2$）会导致多一个反斜杠，这里替换掉
        .replace(/~D/g, '\\~D');
      cursor = offset + whole.length;
      return whole;
    });
    result += this.makeInlineMathWithSelfClosing(this.normalizeTexInlineMath(str.slice(cursor)));
    return result;
  }

  /**
   * 归一化非表格路径下的 `\(...\)`。整体流程为：
   *   Step 1: 先跑一次 makeInlineMath，把用户原生 ~D..~D 段冻结到 cache——形成保护壳，
   *           避免下一步的 \(..\) 归一化误吞已闭合的 $..$ 内部的 \( 或 \)。
   *   Step 2: 正则替换 \(...\) → ~D...~D（带反斜杠转义感知 + 空内容保护）。
   *   Step 3: selfClosing 场景下补开定界符，让下游 $dealUnclosingMath 能识别半开公式。
   * 归一化后的结果会由 makeInlineMathWithSelfClosing 再走一次 makeInlineMath 完成最终渲染。
   *
   * 当 TeXDelimiter 关闭时，仅保留 Step 1 的冻结能力，不对 \(..\) 做归一化。
   */
  normalizeTexInlineMath(str) {
    let $str = this.makeInlineMath(str);
    if (!this.TeXDelimiter) {
      return $str;
    }
    $str = this.rewriteParenInline($str);
    if (this.isSelfClosing()) {
      $str = this.rewriteOpenOnlyParen($str);
    }
    return $str;
  }

  /** 将 `\(...\)` 归一化为 `~D...~D`。空白内容不归一化，等价于旧 mathDelimiter 的 content.trim() 判空。 */
  rewriteParenInline(str) {
    if (isLookbehindSupported()) {
      return str.replace(parenInlineReg, (whole, content) => (content.trim() ? `~D${content}~D` : whole));
    }
    return replaceLookbehind(
      str,
      parenInlineReg,
      (whole, _lead, content) => (content.trim() ? `~D${content}~D` : whole),
      true,
      1,
    );
  }

  /** selfClosing 场景下补开定界符：把"未闭合 \("补一个 ~D 前缀。 */
  rewriteOpenOnlyParen(str) {
    if (isLookbehindSupported()) {
      return str.replace(parenOpenOnlyReg, (_whole, content, tail = '') => `~D${content}${tail}`);
    }
    return replaceLookbehind(
      str,
      parenOpenOnlyReg,
      (_whole, _lead, content, tail = '') => `~D${content}${tail}`,
      true,
      1,
    );
  }

  /** 表格 td 里将 `\[...\]` 归一化为 `~D...~D`。空白内容不归一化。 */
  rewriteBracketBlockInTd(str) {
    if (isLookbehindSupported()) {
      return str.replace(bracketBlockRegForTd, (whole, content) => (content.trim() ? `~D${content}~D` : whole));
    }
    return replaceLookbehind(
      str,
      bracketBlockRegForTd,
      (whole, _lead, content) => (content.trim() ? `~D${content}~D` : whole),
      true,
      1,
    );
  }

  makeInlineMathWithSelfClosing(str) {
    let $str = this.makeInlineMath(str);
    if (this.isSelfClosing()) {
      const $oldStr = $str;
      $str = this.$dealUnclosingMath($str);
      if ($oldStr !== $str) {
        $str = this.makeInlineMath($str);
      }
    }
    return $str;
  }

  transformBlockMathToInlineMath(str) {
    if (isLookbehindSupported()) {
      return str.replace(mathBlockReg, '$1$2~D$3~D$4');
    }
    return replaceLookbehind(
      str,
      mathBlockReg,
      (whole, match1, match2, match3, match4) => `${match1}${match2}~D${match3}~D${match4}`,
      true,
      1,
    );
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
      end: '(\\s*)~D(?:\\s{0,1})',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
