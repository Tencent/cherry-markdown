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
import { isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';

// 归一化 \[...\] → ~D~D...~D~D 的正则：
// - `[\s\S]+?` 非贪婪匹配至少一个字符（`+` 保证匹配失败于 `\[\]` 这类零字符组合）
// - `(?<!\\)` lookbehind 排除被反斜杠转义的 `\[` / `\]`
const bracketBlockReg = isLookbehindSupported()
  ? /(?<!\\)\\\[([\s\S]+?)(?<!\\)\\\]/g
  : /(^|[^\\])\\\[([\s\S]+?)(?<!\\)\\\]/g;

// selfClosing 场景下，匹配"未闭合的 \[ + 到 EOL 之间的内容"，用于补开定界符 ~D~D
const bracketOpenOnlyReg = isLookbehindSupported()
  ? /(?<!\\)\\\[([\s\S]+?)(CHERRYFLOWSESSIONCURSOR\n*)?$/
  : /(^|[^\\])\\\[([\s\S]+?)(CHERRYFLOWSESSIONCURSOR\n*)?$/;

export default class MathBlock extends ParagraphBase {
  static HOOK_NAME = 'mathBlock';
  /**
   * 块级公式语法
   * 该语法具有排他性，并且需要优先其他段落级语法进行渲染
   * @type {'katex' | 'MathJax' | 'node'}
   */
  engine = 'MathJax'; // 渲染引擎，默认为MathJax，MathJax支持2.x与3.x版本
  katex;
  MathJax;

  constructor({ config, cherry }) {
    super({ needCache: true });
    // 非浏览器环境下配置为 node
    this.engine = isBrowser() ? (config.engine ?? 'MathJax') : 'node';
    // 是否启用 TeX 风格定界符 \[ ... \]（默认开启）
    // 关闭后，\[ ... \] 不会被归一化为 $$..$$，仅保留原生 $$..$$ 的渲染能力
    this.TeXDelimiter = config.TeXDelimiter !== false;
    this.$cherry = cherry;
    this.lastCode = '';
  }

  toHtml(wholeMatch, lineSpace, leadingChar, content) {
    LoadMathModule.bind(this)('engine');
    // 去掉开头的空字符，去掉结尾的换行符
    const wholeMatchWithoutSpace = wholeMatch.replace(/^[ \f\r\t\v]*/, '').replace(/\s*$/, '');
    // 去掉匹配到的第一个换行符
    const lineSpaceWithoutPreSpace = lineSpace.replace(/^[ \f\r\t\v]*\n/, '');
    const sign = this.$engine.hash(wholeMatch);
    let lines = this.getLineCount(wholeMatchWithoutSpace, lineSpaceWithoutPreSpace);
    // 判断公式是不是新行输入，如果不是新行，则行号减1
    if (!/\n/.test(lineSpace)) {
      lines -= 1;
    }
    // 判断公式后面有没有尾接内容，如果尾接了内容，则行号减1
    if (!/\n\s*$/.test(wholeMatch)) {
      lines -= 1;
    }
    // 目前的机制还没有测过lines为负数的情况，先不处理
    lines = lines > 0 ? lines : 0;

    // 既无MathJax又无katex时，原样输出
    let result = '';
    let $content = content.replace(/\\~D/g, '$').replace(/\\~T/g, '~').replace(/~T/g, '~');
    const hasCursor = /CHERRYFLOWSESSIONCURSOR/.test($content);
    $content = $content.replace('CHERRYFLOWSESSIONCURSOR', '');
    // 保留一份源码到渲染节点上，供 formulaUtilsHandler 直接读取，避免再次对全文做正则解析。
    const encodedFormulaSource = encodeURIComponent($content);

    if (this.engine === 'katex') {
      // katex渲染
      if (!this.katex) {
        result = `<div data-sign="${sign}" class="Cherry-Math cherry-katex-need-render" data-type="mathBlock" data-formula-source="${encodedFormulaSource}" data-lines="${lines}" data-content="${encodeURIComponent($content)}"></div>`;
        this.$engine.asyncRenderHandler.add(`math-block-${sign}`);
      } else {
        let html;
        try {
          html = this.katex.renderToString($content, {
            throwOnError: false,
            displayMode: true,
          });
        } catch (e) {
          html = renderMathFallback($content, true);
        }
        if (this.isSelfClosing()) {
          if (/class="katex-error"/.test(html) && this.lastCode) {
            html = this.lastCode;
          }
          this.lastCode = html;
        }
        result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
              data-lines="${lines}" data-formula-source="${encodedFormulaSource}">${html}</div>`;
      }
    } else if (this.engine === 'MathJax') {
      // MathJax渲染
      if (!this.MathJax?.tex2svg) {
        // MathJax尚未加载完成，先输出占位符，等待异步加载完成后再渲染
        result = `<div data-sign="${sign}" class="Cherry-Math cherry-mathjax-need-render" data-type="mathBlock" data-formula-source="${encodedFormulaSource}" data-lines="${lines}" data-content="${encodeURIComponent($content)}"></div>`;
        this.$engine.asyncRenderHandler.add(`math-block-${sign}`);
      } else {
        let svg = '';
        try {
          svg = getHTML(this.MathJax.tex2svg($content), true);
        } catch (e) {
          if (this.isSelfClosing() && this.lastCode) {
            svg = this.lastCode;
          } else {
            svg = renderMathFallback($content, true);
          }
        }

        if (this.isSelfClosing()) {
          if (/data-mml-node="merror"/.test(svg) && this.lastCode) {
            svg = this.lastCode;
          }
          this.lastCode = svg;
        }
        result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
              data-lines="${lines}" data-formula-source="${encodedFormulaSource}">${svg}</div>`;
      }
    } else {
      result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
      data-lines="${lines}" data-formula-source="${encodedFormulaSource}">$$${escapeFormulaPunctuations(content)}$$</div>`;
    }

    const appendCursor = hasCursor ? 'CHERRYFLOWSESSIONCURSOR' : '';
    return leadingChar + this.getCacheWithSpace(this.pushCache(result, sign, lines), wholeMatch) + appendCursor;
  }

  isSelfClosing() {
    return (
      (this.$cherry.options.engine.syntax.mathBlock && this.$cherry.options.engine.syntax.mathBlock.selfClosing) ||
      this.$cherry.options.engine.global.flowSessionContext
    );
  }

  $dealUnclosingMath(str) {
    let $str = str.replace(/(^|[^\\])(~D|~D~D)(CHERRYFLOWSESSIONCURSOR\n*|\n*)$/, '$1$3');
    if (/(^|[^\\])~D~D/.test($str)) {
      $str = $str.replace(/(CHERRYFLOWSESSIONCURSOR\n*|\n*)$/, '~D~D$1');
    }
    return $str;
  }

  makeMath(str) {
    if (isLookbehindSupported()) {
      return str.replace(this.RULE.reg, this.toHtml.bind(this));
    }
    return replaceLookbehind(str, this.RULE.reg, this.toHtml.bind(this), true, 1);
  }

  /**
   * 将 `\[...\]` 归一化为 `~D~D...~D~D`。空白内容不归一化，
   */
  rewriteBracketBlock(str) {
    if (isLookbehindSupported()) {
      return str.replace(bracketBlockReg, (whole, content) => (content.trim() ? `~D~D${content}~D~D` : whole));
    }
    return replaceLookbehind(
      str,
      bracketBlockReg,
      (whole, _lead, content) => (content.trim() ? `~D~D${content}~D~D` : whole),
      true,
      1,
    );
  }

  /** selfClosing 场景下补开定界符：把"未闭合 \["补一个 ~D~D 前缀。 */
  rewriteOpenOnlyBracket(str) {
    if (isLookbehindSupported()) {
      return str.replace(bracketOpenOnlyReg, (_whole, content, tail = '') => `~D~D${content}${tail}`);
    }
    return replaceLookbehind(
      str,
      bracketOpenOnlyReg,
      (_whole, _lead, content, tail = '') => `~D~D${content}${tail}`,
      true,
      1,
    );
  }

  /** selfClosing 兜底：把最尾的孤立 ~D~D 补齐成闭合的 ~D~D..~D~D，再走一次 makeMath。 */
  makeMathWithSelfClosing(str) {
    if (!this.isSelfClosing()) {
      return str;
    }
    const $str = this.$dealUnclosingMath(str);
    return $str === str ? str : this.makeMath($str);
  }

  /**
   * 整体流程：
   *   Step 1: 先跑一次 makeMath，把用户原生输入的 $$..$$（经 Engine 编码为 ~D~D..~D~D）
   *           整段渲染并存入 cache，剩余字符串里的 ~D~D 段被替换为 cache 占位符，
   *           从而形成天然"保护壳"——后续 \[..\] 归一化不会误伤 $$..$$ 内部的 \[。
   *   Step 2: 归一化剩余（未被 $$..$$ 包住）的 \[..\] → ~D~D..~D~D，
   *           再跑一次 makeMath 把新归一化的段落也吃到 cache 里，
   *           避免下一步的 selfClosing 正则把已闭合公式误当成半开公式。
   *   Step 3: selfClosing 场景下，把剩余的"未闭合 \["补一个开定界符 ~D~D。
   *   Step 4: selfClosing 兜底——把最尾的孤立 ~D~D 补齐成闭合的 ~D~D..~D~D 并渲染。
   *
   * 当 TeXDelimiter 关闭时，跳过 Step 2 / Step 3，仅保留 Step 1 冻结 + Step 4 兜底。
   */
  beforeMakeHtml(str) {
    let $str = this.makeMath(str);

    if (this.TeXDelimiter) {
      $str = this.rewriteBracketBlock($str);
      $str = this.makeMath($str);

      if (this.isSelfClosing()) {
        $str = this.rewriteOpenOnlyBracket($str);
      }
    }

    return this.makeMathWithSelfClosing($str);
  }
  makeHtml(str) {
    return str;
  }

  rule() {
    const ret = {
      begin: isLookbehindSupported() ? '(\\s*)((?<!\\\\))~D~D\\s*' : '(\\s*)(^|[^\\\\])~D~D\\s*',
      content: '([\\w\\W]*?)',
      end: '(\\s*)~D~D(?:\\s{0,1})',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
