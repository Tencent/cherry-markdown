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
import Prism from 'prismjs';
import { escapeHTMLSpecialChar } from '@/utils/sanitize';
import { getTableRule, getCodeBlockRule } from '@/utils/regexp';
import { prependLineFeedForParagraph } from '@/utils/lineFeed';

Prism.manual = true;

const CUSTOM_WRAPPER = {
  figure: 'figure',
};

export default class CodeBlock extends ParagraphBase {
  static HOOK_NAME = 'codeBlock';
  static inlineCodeCache = {};

  constructor({ externals, config, cherry }) {
    super({ needCache: true });
    CodeBlock.inlineCodeCache = {};
    this.codeCache = {};
    this.codeCacheList = [];
    this.customLang = [];
    this.customParser = {};
    this.lineNumber = config.lineNumber; // 是否显示行号
    this.copyCode = config.copyCode; // 是否显示“复制”按钮
    this.expandCode = config.expandCode; // 是否显示“展开”按钮
    this.editCode = config.editCode; // 是否显示“编辑”按钮
    this.changeLang = config.changeLang; // 是否显示“切换语言”按钮
    this.selfClosing = config.selfClosing; // 自动闭合，为true时，当md中有奇数个```时，会自动在md末尾追加一个```
    this.mermaid = config.mermaid; // mermaid的配置，目前仅支持格式设置，svg2img=true 展示成图片，false 展示成svg
    this.indentedCodeBlock = typeof config.indentedCodeBlock === 'undefined' ? true : config.indentedCodeBlock; // 是否支持缩进代码块
    this.INLINE_CODE_REGEX = /(`+)(.+?(?:\n.+?)*?)\1/g;
    if (config && config.customRenderer) {
      this.customLang = Object.keys(config.customRenderer).map((lang) => lang.toLowerCase());
      Object.keys(config.customRenderer).forEach((lang) => {
        this.customParser[lang.toLowerCase()] = config.customRenderer[lang];
      });
    }
    this.customHighlighter = config.highlighter;
    this.failedCleanCacheTimes = 0;
    this.codeTimer = null;
    this.$cherry = cherry;
    this.needCleanFlowCursor =
      cherry?.options?.engine?.global?.flowSessionContext && cherry?.options?.engine?.global?.flowSessionCursor;
    this.showInlineColor =
      cherry?.options?.engine?.syntax?.inlineCode?.showColor !== undefined
        ? cherry.options.engine.syntax.inlineCode.showColor
        : true; // 是否在行内代码为颜色值时展示颜色指示
  }

  afterMakeHtml(html) {
    if (this.codeTimer) {
      clearTimeout(this.codeTimer);
      this.failedCleanCacheTimes += 1;
      this.codeTimer = null;
    }
    this.codeTimer = setTimeout(() => {
      this.$resetCache();
    }, 500);
    if (this.failedCleanCacheTimes > 5) {
      this.failedCleanCacheTimes = 0;
      setTimeout(() => {
        this.$resetCache();
      }, 500);
    }
    return this.restoreCache(html);
  }

  $resetCache() {
    if (this.codeCacheList.length > 100) {
      // 如果缓存超过100条，则清空最早的缓存
      for (let i = 0; i < this.codeCacheList.length - 100; i++) {
        delete this.codeCache[this.codeCacheList[i]];
      }
      this.codeCacheList = this.codeCacheList.slice(-100);
    }
  }

  $codeReplace($codeSrc, $lang, sign, lines) {
    let $code = $codeSrc.replace(/~X/g, '\\`');
    $code = this.renderCodeBlock($code, $lang, sign, lines);
    $code = $code.replace(/\\/g, '\\\\');
    return $code;
  }

  $codeCache(sign, str) {
    if (sign && str) {
      this.codeCacheList.push(sign);
      this.codeCache[sign] = str;
    }

    if (this.codeCache[sign]) {
      // 如果命中了缓存，则更新缓存顺序
      for (let i = 0; i < this.codeCacheList.length - 100; i++) {
        if (this.codeCacheList[i] === sign) {
          // 删除i位置的元素
          this.codeCacheList.splice(i, 1);
          this.codeCacheList.push(sign);
          break;
        }
      }
      return this.codeCache[sign];
    }
    return false;
  }

  // 渲染特定语言代码块
  parseCustomLanguage(lang, codeSrc, props) {
    const engine = this.customParser[lang];
    if (!engine || typeof engine.render !== 'function') {
      return false;
    }
    const tag = CUSTOM_WRAPPER[engine.constructor.TYPE] || 'div';
    const addContainer = (html) => {
      return `<${tag} data-sign="${props.sign}" data-type="${lang}" data-lines="${props.lines}">${html}</${tag}>`;
    };
    let html = '';
    const $codeSrc = this.needCleanFlowCursor ? codeSrc.replace(/CHERRYFLOWSESSIONCURSOR/, '') : codeSrc;
    if (lang === 'all') {
      html = engine.render($codeSrc, props.sign, this.$engine, props.lang);
    } else {
      html = engine.render($codeSrc, props.sign, this.$engine, {
        mermaidConfig: this.mermaid,
        updateCache: (cacheCode) => {
          this.$codeCache(props.sign, addContainer(cacheCode));
          this.pushCache(addContainer(cacheCode), props.sign, props.lines);
        },
        fallback: () => {
          const $code = this.$codeReplace($codeSrc, lang, props.sign, props.lines);
          return $code;
        },
      });
    }
    if (!html) {
      return false;
    }
    return addContainer(html);
  }

  // 修复渲染行号时打散的标签
  fillTag(lines) {
    const tagStack = []; // 存储未闭合标签
    return lines.map((rawLine) => {
      if (!rawLine) return '';
      let line = rawLine;
      // 补全上一行未闭合标签
      while (tagStack.length) {
        const tag = tagStack.pop();
        line = `${tag}${line}`;
      }
      // 计算未闭合标签
      const tags = line.match(/<span class="(.+?)">|<\/span>/g);
      let close = 0;
      if (!tags) return line;
      while (tags.length) {
        const tag = tags.pop();
        if (/<\/span>/.test(tag)) close += 1;
        else if (!close) {
          tagStack.unshift(tag.match(/<span class="(.+?)">/)[0]);
        } else {
          close -= 1;
        }
      }
      // 补全未闭合标签
      for (let i = 0; i < tagStack.length; i++) {
        line = `${line}</span>`;
      }
      return line;
    });
  }

  // 渲染行号
  renderLineNumber(code) {
    if (!this.lineNumber) return code;
    let codeLines = code.split('\n');
    codeLines.pop(); // 末尾回车不增加行号
    codeLines = this.fillTag(codeLines);
    return `<span class="code-line">${codeLines.join('</span>\n<span class="code-line">')}</span>`;
  }

  /**
   * 判断内置转换语法是否被覆盖
   * @param {string} lang
   */
  isInternalCustomLangCovered(lang) {
    return this.customLang.indexOf(lang) !== -1;
  }

  /**
   * 预处理代码块
   * @param {string} match
   * @param {string} leadingContent
   * @param {string} code
   */
  computeLines(match, leadingContent, code) {
    const leadingSpaces = leadingContent;
    const lines = this.getLineCount(match, leadingSpaces);
    const sign = this.$engine.hash(match.replace(/^\n+/, '') + lines);
    return {
      sign,
      lines,
    };
  }

  /**
   * 补齐用codeBlock承载的mermaid
   * @param {string} $code
   * @param {string} $lang
   */
  appendMermaid($code, $lang) {
    let [code, lang] = [$code, $lang];
    // 临时实现流程图、时序图缩略写法
    if (/^flow([ ](TD|LR))?$/i.test(lang) && !this.isInternalCustomLangCovered(lang)) {
      const suffix = lang.match(/^flow(?:[ ](TD|LR))?$/i) || [];
      code = `graph ${suffix[1] || 'TD'}\n${code}`;
      lang = 'mermaid';
    }
    if (/^seq$/i.test(lang) && !this.isInternalCustomLangCovered(lang)) {
      code = `sequenceDiagram\n${code}`;
      lang = 'mermaid';
    }
    if (lang === 'mermaid') {
      // 8.4.8版本兼容8.5.2版本的语法
      code = code.replace(/(^[\s]*)stateDiagram-v2\n/, '$1stateDiagram\n');
      // code = code.replace(/(^[\s]*)sequenceDiagram[ \t]*\n[\s]*autonumber[ \t]*\n/, '$1sequenceDiagram\n');
    }
    return [code, lang];
  }

  /**
   * 包裹代码块，解决单行代码超出长度
   * @param {string} $code
   * @param {string} lang
   */
  wrapCode($code, lang) {
    return `<code class="language-${lang}">${$code}</code>`;
  }

  /**
   * 使用渲染引擎处理代码块
   * @param {string} $code
   * @param {string} $lang
   * @param {string} sign
   * @param {number} lines
   */
  renderCodeBlock($code, $lang, sign, lines) {
    let cacheCode = $code;
    let lang = $lang;
    // 兼容流式输出时占位光标影响代码块语言识别的场景
    if (/\s*CHERRY_FLOW_SESSION_CURSOR/.test(lang)) {
      lang = lang.replace(/\s*CHERRY_FLOW_SESSION_CURSOR/, '');
    }
    lang = lang.toLowerCase();
    const oldLang = lang;
    if (this.customHighlighter) {
      // 平台自定义代码块样式
      cacheCode = this.customHighlighter(cacheCode, lang);
    } else {
      // 默认使用prism渲染代码块
      if (!lang || !Prism.languages[lang]) lang = 'javascript'; // 如果没有写语言，默认用js样式渲染
      cacheCode = Prism.highlight(cacheCode, Prism.languages[lang], lang);
      cacheCode = this.renderLineNumber(cacheCode);
    }
    const needUnExpand = this.expandCode && $code.match(/\n/g)?.length > 10; // 是否需要收起代码块
    const codeHtml = `<pre class="language-${lang}">${this.wrapCode(cacheCode, lang)}</pre>`;
    cacheCode = `<div
        data-sign="${sign}"
        data-type="codeBlock"
        data-lines="${lines}" 
        data-edit-code="${this.editCode}" 
        data-copy-code="${this.copyCode}"
        data-expand-code="${this.expandCode}"
        data-change-lang="${this.changeLang}"
        data-lang="${lang}"
        style="position:relative"
        class="${needUnExpand ? 'cherry-code-unExpand' : 'cherry-code-expand'}"
      >
      ${this.customWrapperRender(oldLang, cacheCode, codeHtml)}
      `;
    if (needUnExpand) {
      cacheCode += `<div class="cherry-mask-code-block">
        <div class="expand-btn ">
          <i class="ch-icon ch-icon-expand"></i>
        </div>
      </div>`;
    }
    cacheCode += '</div>';
    return cacheCode;
  }

  customWrapperRender(lang, code, html) {
    const customWrapperRender = this.$cherry.options.engine.syntax.codeBlock.wrapperRender ?? false;
    if (typeof customWrapperRender === 'function') {
      return customWrapperRender(lang, code, html);
    }
    return html;
  }

  /**
   * 获取缩进代码块语法的正则
   * 缩进代码块必须要以连续两个以上的换行符开头
   */
  $getIndentedCodeReg() {
    const ret = {
      begin: '(?:^|\\n\\s*\\n)(?: {4}|\\t)',
      end: '(?=$|\\n( {0,3}[^ \\t\\n]|\\n[^ \\t\\n]))',
      content: '([\\s\\S]+?)',
    };
    return new RegExp(ret.begin + ret.content + ret.end, 'g');
  }

  /**
   * 生成缩进代码块（没有行号、没有代码高亮）
   */
  $getIndentCodeBlock(str) {
    if (!this.indentedCodeBlock) {
      return str;
    }
    return this.$recoverCodeInIndent(str).replace(this.$getIndentedCodeReg(), (match, code) => {
      const lineCount = (match.match(/\n/g) || []).length;
      const sign = this.$engine.hash(match);
      const html = `<pre data-sign="${sign}" data-lines="${lineCount}"><code class="indent-code">${escapeHTMLSpecialChar(
        code.replace(/\n( {4}|\t)/g, '\n'),
      )}</code></pre>`;
      // return this.getCacheWithSpace(this.pushCache(html), match, true);
      return prependLineFeedForParagraph(match, this.pushCache(html, sign, lineCount));
    });
  }

  /**
   * 预处理缩进代码块，将缩进代码块里的高亮代码块和行内代码进行占位处理
   */
  $replaceCodeInIndent(str) {
    if (!this.indentedCodeBlock) {
      return str;
    }
    return str.replace(this.$getIndentedCodeReg(), (match) => {
      return match.replace(/`/g, '~~~IndentCode');
    });
  }

  /**
   * 恢复预处理的内容
   */
  $recoverCodeInIndent(str) {
    if (!this.indentedCodeBlock) {
      return str;
    }
    return str.replace(this.$getIndentedCodeReg(), (match) => {
      return match.replace(/~~~IndentCode/g, '`');
    });
  }

  $dealUnclosingCode(str) {
    const codes = str.match(
      /(?:^|\n)(\n*((?:>[\t ]*)*)(?:[^\S\n]*))(`{3,})([^`]*?)(?=CHERRY_FLOW_SESSION_CURSOR|$|\n)/g,
    );
    if (!codes || codes.length <= 0) {
      return str;
    }
    // 剔除异常的数据
    let codeBegin = false;
    const $codes = codes.filter((value) => {
      if (codeBegin === false) {
        codeBegin = true;
        return true;
      }
      if (/```[^`\s]+/.test(value)) {
        return false;
      }
      codeBegin = false;
      return true;
    });
    // 如果有奇数个代码块关键字，则进行自动闭合
    if ($codes.length % 2 === 1) {
      const lastCode = $codes[$codes.length - 1].replace(/(`)[^`]+$/, '$1').replace(/\n+/, '');
      const $str = str.replace(/\n+$/, '').replace(/\n`{1,2}$/, '');
      return `${$str}\n${lastCode}\n`;
    }
    return str;
  }

  beforeMakeHtml(str, sentenceMakeFunc, markdownParams) {
    let $str = str;

    // 处理段落代码块自动闭合
    if (this.selfClosing || this.$cherry.options.engine.global.flowSessionContext) {
      $str = this.$dealUnclosingCode($str);
    }

    // 预处理缩进代码块
    $str = this.$replaceCodeInIndent($str);

    $str = $str.replace(this.RULE.reg, (match, leadingContent, leadingContentBlockQuote, begin, lang, code) => {
      function addBlockQuoteSignToResult(result) {
        if (leadingContentBlockQuote) {
          const regex = new RegExp(`^\n*`, '');
          const leadingNewline = result.match(regex)[0];
          // eslint-disable-next-line no-param-reassign
          result = leadingNewline + leadingContentBlockQuote + result.replace(regex, (_) => '');
        }
        return result;
      }
      let $code = code;
      const { sign, lines } = this.computeLines(match, leadingContent, code);
      // 从缓存中获取html
      let cacheCode = this.$codeCache(sign);
      if (cacheCode && cacheCode !== '') {
        // 别忘了把 ">"（引用块）加回来
        const result = this.getCacheWithSpace(this.pushCache(cacheCode, sign, lines), match);
        return addBlockQuoteSignToResult(result);
      }
      $code = this.$recoverCodeInIndent($code);
      $code = $code.replace(/~D/g, '$');
      $code = $code.replace(/~T/g, '~');

      /** 处理缩进 - start: 当首行反引号前存在多个空格缩进时，代码内容要相应去除相同数量的空格 */
      const indentSpaces = leadingContent?.match(/[ ]/g)?.length ?? 0;
      if (indentSpaces > 0) {
        const regex = new RegExp(`(^|\\n)[ ]{1,${indentSpaces}}`, 'g');
        $code = $code.replace(regex, '$1');
      }
      /** 处理缩进 - end */

      // 如果本代码块处于一个引用块（形如 "> " 或 "> > "）中，那么需要从代码中每一行去掉引用块的符号
      if (leadingContentBlockQuote) {
        const regex = new RegExp(`(^|\\n)${leadingContentBlockQuote}`, 'g');
        $code = $code.replace(regex, '$1');
      }

      // 未命中缓存，执行渲染
      let $lang = lang.trim().toLowerCase();
      // 如果是公式关键字，则直接返回
      if (/^(math|katex|latex)$/i.test($lang) && !this.isInternalCustomLangCovered($lang)) {
        const prefix = match.match(/^\s*/g);
        // ~D为经编辑器中间转义后的$，code结尾包含结束```前的所有换行符，所以不需要补换行
        return `${prefix}~D~D\n${$code}~D~D`; // 提供公式语法供公式钩子解析
      }
      [$code, $lang] = this.appendMermaid($code, $lang);
      // 自定义语言渲染，可覆盖内置的自定义语言逻辑
      const $oldLang = $lang;
      $lang = this.formatLang($lang);
      if (this.isInternalCustomLangCovered($lang)) {
        cacheCode = this.parseCustomLanguage($lang, $code, {
          lines,
          sign,
          match,
          addBlockQuoteSignToResult,
          lang: $oldLang,
        });
        if (cacheCode && cacheCode !== '') {
          this.$codeCache(sign, cacheCode);
          return this.getCacheWithSpace(this.pushCache(cacheCode, sign, lines), match);
        }
        // 渲染出错则按正常code进行渲染
      }
      // $code = this.$replaceSpecialChar($code);
      cacheCode = this.$codeReplace($code, $lang, sign, lines);
      const result = this.getCacheWithSpace(this.pushCache(cacheCode, sign, lines), match);
      return addBlockQuoteSignToResult(result);
    });
    // 表格里处理行内代码，让一个td里的行内代码语法生效，让跨td的行内代码语法失效
    $str = $str.replace(getTableRule(true), (whole, ...args) => {
      return whole
        .replace(/\\\|/g, '~CHERRYNormalLine')
        .split('|')
        .map((oneTd) => {
          return this.makeInlineCode(oneTd, false).replace(/~CHERRYNormalLine/g, '\\|');
        })
        .join('|')
        .replace(/`/g, '\\`');
    });
    // 为了避免InlineCode被HtmlBlock转义，需要在这里提前缓存
    // InlineBlock只需要在afterMakeHtml还原即可
    $str = this.makeInlineCode($str, true);

    // 处理缩进代码块
    $str = this.$getIndentCodeBlock($str);

    return $str;
  }

  /**
   * 格式化语言，如果配置了自定义语言“all”，则无脑替换成“all”
   * @param {string} lang 语言
   * @returns {string} 格式化后的语言
   */
  formatLang(lang) {
    // 增加一个潜规则，即便配置了all，也不处理mermaid
    if (this.customLang.indexOf('all') !== -1 && lang !== 'mermaid') {
      return 'all';
    }
    return lang;
  }

  makeInlineCode(str, needAutoClose = true) {
    let $str = str;
    if (this.INLINE_CODE_REGEX.test($str)) {
      $str = $str.replace(/\\`/g, '~~not~inlineCode');
      $str = $str.replace(this.INLINE_CODE_REGEX, (match, syntax, code) => {
        if (code.trim() === '`') {
          return match;
        }
        let $code = code.replace(/~~not~inlineCode/g, '\\`');
        $code = this.$replaceSpecialChar($code);
        $code = $code.replace(/~CHERRYNormalLine/g, '|');
        $code = $code.replace(/\\/g, '\\\\');

        // 如果行内代码只有一个颜色值，则在code末尾追加一个颜色圆点
        const trimmed = $code.trim();
        const isHex = /^#([0-9a-fA-F]{6})$/i.test(trimmed);
        const isRgb = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(trimmed);
        const isHsl = /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/i.test(trimmed);
        const escaped = escapeHTMLSpecialChar($code);
        let html = '';
        if (this.showInlineColor && (isHex || isRgb || isHsl)) {
          const color = trimmed;
          html = `<code>${escaped}<span class="ch-inline-color" style="background:${color};"></span></code>`;
        } else {
          html = `<code>${escaped}</code>`;
        }

        const sign = this.$engine.hash(html);
        CodeBlock.inlineCodeCache[sign] = html;
        return `~~CODE${sign}$`;
      });
      $str = $str.replace(/~~not~inlineCode/g, '\\`');
    }
    /**
     * 处理行内代码块自动补全
     * 注意：表格里的行内代码块暂【不支持】自动补全
     */
    if (needAutoClose) {
      if (
        this.$cherry.options.engine.syntax.inlineCode.selfClosing ||
        this.$cherry.options.engine.global.flowSessionContext
      ) {
        let hasAutoClose = false;
        $str = $str.replace(/(^|\n)([^\n]+)(\n$)/, (match, prefix, content, suffix) => {
          let $content = content.replace(/\\`/g, '~~not~inlineCode').replace(/`+$/, '');
          hasAutoClose = /(`+)([^`]+)$/.test($content) && !/(`+)([^`]*~~CODE[^`]+)$/.test($content);
          if (!hasAutoClose) {
            $content = $content.replace(/~~not~inlineCode/g, '\\`');
            return `${prefix}${$content}${suffix}`;
          }
          $content = $content.replace(/(`+)([^`]+)$/, '$1$2$1').replace(/~~not~inlineCode/g, '\\`');
          return `${prefix}${$content}${suffix}`;
        });
        if (hasAutoClose) {
          $str = this.makeInlineCode($str, false);
        }
      }
    }
    return $str;
  }

  makeHtml(str) {
    return str;
  }

  $replaceSpecialChar(str) {
    let $str = str.replace(/~Q/g, '\\~');
    $str = $str.replace(/~Y/g, '\\!');
    $str = $str.replace(/~Z/g, '\\#');
    $str = $str.replace(/~&/g, '\\&');
    $str = $str.replace(/~K/g, '\\/');
    // $str = $str.replace(/~D/g, '$');
    // $str = $str.replace(/~T/g, '~');
    return $str;
  }

  rule() {
    return getCodeBlockRule();
  }
}
