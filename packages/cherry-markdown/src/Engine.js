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
import HookCenter from './core/HookCenter';
import hooksConfig from './core/HooksConfig';
import NestedError, { $expectTarget, $expectInherit, $expectInstance } from './utils/error';
import md5 from 'md5';
import SyntaxBase from './core/SyntaxBase';
import ParagraphBase from './core/ParagraphBase';
import { PUNCTUATION, imgBase64Reg, imgDrawioXmlReg } from './utils/regexp';
import { escapeHTMLSpecialChar } from './utils/sanitize';
import Logger from './Logger';
import { configureMathJax } from './utils/mathjax';
import UrlCache from './UrlCache';
import htmlParser from './utils/htmlparser';
import { isBrowser } from './utils/env';

export default class Engine {
  /**
   *
   * @param {Partial<import('./Cherry').CherryOptions>} markdownParams 初始化Cherry时传入的选项
   * @param {import('./Cherry').default} cherry Cherry实例
   */
  constructor(markdownParams, cherry) {
    this.$cherry = cherry;
    // Deprecated
    Object.defineProperty(this, '_cherry', {
      get() {
        Logger.warn('`_engine._cherry` is deprecated. Use `$engine.$cherry` instead.');
        return this.$cherry;
      },
    });
    this.initMath(markdownParams);
    this.$configInit(markdownParams);
    this.hookCenter = new HookCenter(hooksConfig, markdownParams, cherry);
    this.hooks = this.hookCenter.getHookList();
    this.md5Cache = {};
    this.md5StrMap = {};
    this.cachedBigData = {};
    this.markdownParams = markdownParams;
    this.currentStrMd5 = [];
    this.globalConfig = markdownParams.engine.global;
    this.htmlWhiteListAppend = this.globalConfig.htmlWhiteList;
  }

  initMath(opts) {
    // 无论MathJax还是Katex，都可以先进行MathJax配置
    const { externals, engine } = opts;
    const { syntax } = engine;
    const { plugins } = syntax.mathBlock;
    // 未开启公式
    if (
      !isBrowser() ||
      (!syntax.mathBlock.src && !syntax.inlineMath.src && !syntax.mathBlock.engine && !syntax.inlineMath.engine)
    ) {
      return;
    }
    // 已经加载过MathJax
    if (externals.MathJax || window.MathJax) {
      return;
    }
    configureMathJax(plugins);
    // 等待MathJax各种插件加载
    const script = document.createElement('script');
    script.src = syntax.mathBlock.src ? syntax.mathBlock.src : syntax.inlineMath.src;
    script.async = true;
    if (script.src) document.head.appendChild(script);
  }

  $configInit(params) {
    if (params.hooksConfig && $expectTarget(params.hooksConfig.hooksList, Array)) {
      for (let key = 0; key < params.hooksConfig.hooksList.length; key++) {
        const hook = params.hooksConfig.hooksList[key];
        try {
          if (hook.getType() === 'sentence') {
            $expectInherit(hook, SyntaxBase);
          }

          if (hook.getType() === 'paragraph') {
            $expectInherit(hook, ParagraphBase);
          }
          $expectInstance(hook);
          hooksConfig.push(hook);
        } catch (e) {
          throw new Error('the hook does not correctly inherit');
        }
      }
    }
  }

  $beforeMakeHtml(str) {
    let $str = str.replace(/~/g, '~T');
    $str = $str.replace(/\$/g, '~D');
    $str = $str.replace(/\r\n/g, '\n'); // DOS to Unix
    $str = $str.replace(/\r/g, '\n'); // Mac to Unix
    if (
      // @ts-ignore
      this.$cherry.options.engine.syntax.fontEmphasis.selfClosing ||
      this.$cherry.options.engine.global.flowSessionContext
    ) {
      // 自动补全最后一行的加粗、斜体语法
      if (/(^|\n)[^\n]*\*{1,3}[^\n]+$/.test($str) && $str.match(/(^|\n)([^\n]+)$/)) {
        const lastLineStr = $str.match(/(^|\n)([^\n]+)$/)[2].split(/(\*{1,3})/g);
        const emphasis = [];
        for (let i = 0; i < lastLineStr.length; i++) {
          if (/\*{1,3}/.test(lastLineStr[i])) {
            const current = lastLineStr[i];
            if (emphasis.length <= 0) {
              emphasis.push(current);
            } else {
              if (emphasis[emphasis.length - 1] === current) {
                emphasis.pop();
              } else {
                emphasis.push(current);
              }
            }
          }
        }
        if (emphasis.length === 1) {
          $str = $str.replace(/(\*{1,3})(\s*)([^*\n]+?)$/, '$1$2$3$2$1');
        }
        if (emphasis.length === 2) {
          $str = $str.replace(/(\*{1,3})(\s*)([^*\n]+?)\*{0,2}$/, '$1$2$3$2$1');
        }
      }
    }
    // 避免正则性能问题，如/.+\n/.test(' '.repeat(99999)), 回溯次数过多
    // 参考文章：http://www.alloyteam.com/2019/07/13574/
    if ($str[$str.length - 1] !== '\n') {
      $str += '\n';
    }
    $str = this.$fireHookAction($str, 'sentence', 'beforeMakeHtml');
    $str = this.$fireHookAction($str, 'paragraph', 'beforeMakeHtml');
    return $str;
  }

  $afterMakeHtml(str) {
    let $str = this.$fireHookAction(str, 'paragraph', 'afterMakeHtml');
    // str = this._fireHookAction(str, 'sentence', 'afterMakeHtml');
    $str = $str.replace(/~D/g, '$');
    $str = $str.replace(/~T/g, '~');
    $str = $str.replace(/\\<\//g, '\\ </');
    $str = $str
      .replace(new RegExp(`\\\\(${PUNCTUATION})`, 'g'), (match, escapeChar) => {
        if (escapeChar === '&') {
          // & 字符需要特殊处理
          return match;
        }
        return escapeHTMLSpecialChar(escapeChar);
      })
      .replace(/\\&(?!(amp|lt|gt|quot|apos);)/, () => '&amp;');
    $str = $str.replace(/\\ <\//g, '\\</');
    $str = $str.replace(/id="safe_(?=.*?")/g, 'id="'); // transform header id to avoid being sanitized
    $str = UrlCache.restoreAll($str);
    return $str;
  }

  $dealSentenceByCache(md) {
    return this.$checkCache(md, (str) => this.$dealSentence(str));
  }

  $dealSentence(md) {
    return this.$fireHookAction(md, 'sentence', 'makeHtml', this.$dealSentenceByCache.bind(this));
  }

  $fireHookAction(md, type, action, actionArgs) {
    let $md = md;
    const method = action === 'afterMakeHtml' ? 'reduceRight' : 'reduce';
    if (!this.hooks && !this.hooks[type] && !this.hooks[type][method]) {
      return $md;
    }
    try {
      $md = this.hooks[type][method]((newMd, oneHook) => {
        if (!oneHook.$engine) {
          oneHook.$engine = this;
          // Deprecated
          Object.defineProperty(oneHook, '_engine', {
            get() {
              Logger.warn('`this._engine` is deprecated. Use `this.$engine` instead.');
              return this.$engine;
            },
          });
        }

        if (!oneHook[action]) {
          return newMd;
        }
        return oneHook[action](newMd, actionArgs, this.markdownParams);
      }, $md);
    } catch (e) {
      throw new NestedError(e);
    }
    return $md;
  }

  md5(str) {
    if (!this.md5StrMap[str]) {
      this.md5StrMap[str] = md5(str);
    }
    return this.md5StrMap[str];
  }

  $checkCache(str, func) {
    const sign = this.md5(str);
    if (typeof this.md5Cache[sign] === 'undefined') {
      this.md5Cache[sign] = func(str);
      if (BUILD_ENV !== 'production') {
        // 生产环境屏蔽
        Logger.log('markdown引擎渲染了：', str);
      }
    }
    return { sign, html: this.md5Cache[sign] };
  }

  $dealParagraph(md) {
    return this.$fireHookAction(md, 'paragraph', 'makeHtml', this.$dealSentenceByCache.bind(this));
  }

  // 缓存大文本数据，用以提升渲染性能
  $cacheBigData(md) {
    let $md = md.replace(imgBase64Reg, (whole, m1, m2) => {
      const cacheKey = `bigDataBegin${this.md5(m2)}bigDataEnd`;
      this.cachedBigData[cacheKey] = m2;
      return `${m1}${cacheKey})`;
    });
    $md = $md.replace(imgDrawioXmlReg, (whole, m1, m2) => {
      const cacheKey = `bigDataBegin${this.md5(m2)}bigDataEnd`;
      this.cachedBigData[cacheKey] = m2;
      return `${m1}${cacheKey}}`;
    });
    return $md;
  }

  $deCacheBigData(md) {
    return md.replace(/bigDataBegin[^\n]+?bigDataEnd/g, (whole) => {
      return this.cachedBigData[whole];
    });
  }

  /**
   * @param {string} md md字符串
   * @returns {string} 获取html
   */
  makeHtml(md) {
    let $md = this.$cacheBigData(md);
    $md = this.$beforeMakeHtml($md);
    $md = this.$dealParagraph($md);
    $md = this.$afterMakeHtml($md);
    this.$fireHookAction($md, 'paragraph', '$cleanCache');
    $md = this.$deCacheBigData($md);
    return $md;
  }

  makeHtmlForBlockquote(md) {
    let $md = md;
    $md = this.$dealParagraph($md);
    $md = this.$fireHookAction($md, 'paragraph', 'afterMakeHtml');
    return $md;
  }

  mounted() {
    this.$fireHookAction('', 'sentence', 'mounted');
    this.$fireHookAction('', 'paragraph', 'mounted');
    // UrlCache.clear();
  }

  /**
   * @param {string} html html字符串
   * @returns {string} 获取markdown
   */
  makeMarkdown(html) {
    return htmlParser.run(html);
  }
}
