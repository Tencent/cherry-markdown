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
import HookCenter from './core/HookCenter';
import hooksConfig from './core/HooksConfig';
import NestedError, { $expectTarget, $expectInherit, $expectInstance } from './utils/error';
import CryptoJS from 'crypto-js';
import SyntaxBase from './core/SyntaxBase';
import ParagraphBase from './core/ParagraphBase';
import { PUNCTUATION, longTextReg, imgBase64Reg, imgDrawioXmlReg, base64Reg } from './utils/regexp';
import { escapeHTMLSpecialChar } from './utils/sanitize';
import Logger from './Logger';
import { configureMathJax } from './utils/mathjax';
import AsyncRenderHandler from './utils/async-render-handler';
import UrlCache from './UrlCache';
import htmlParser from './utils/htmlparser';
import { isBrowser } from './utils/env';
import * as htmlparser2 from 'htmlparser2';
import LRUCache from './utils/LRUCache';
import { loadCSS, loadScript } from './utils/dom';

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
    this.asyncRenderHandler = new AsyncRenderHandler(cherry);
    // 使用LRU缓存替代普通对象
    this.hashCache = new LRUCache(20000); // 缓存最多20000个渲染结果
    this.hashStrMap = new LRUCache(2000); // 缓存最多2000个哈希值
    this.cachedBigData = {};
    this.urlProcessorMap = {};

    this.markdownParams = markdownParams;
    this.currentStrMd5 = [];
    this.globalConfig = markdownParams.engine.global;
    this.htmlWhiteListAppend = this.globalConfig.htmlWhiteList;
    this.htmlBlackList = this.globalConfig.htmlBlackList;
  }

  /**
   * 重新生成html
   * 这是为urlProcessor支持异步回调函数而实现的重新生成html的方法
   * 该方法会清空所有缓存，所以降低了该方法的执行频率，1s内最多执行一次
   */
  reMakeHtml() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.$cherry.lastMarkdownText = '';
      this.hashCache.clear();
      const markdownText = this.$cherry.editor.editor.getValue();
      const html = this.makeHtml(markdownText);
      this.$cherry.previewer.refresh(html);
      this.$cherry.$event.emit('afterChange', {
        markdownText,
        html,
      });
    }, 1000);
  }

  urlProcessor(url, srcType) {
    const key = `${srcType}_${url}`;
    if (this.urlProcessorMap[key]) {
      return this.urlProcessorMap[key];
    }
    let originUrl = this.dealAfterMakeHtml(url);
    originUrl = originUrl.replace(/&amp;/g, '&');
    const ret = this.$cherry.options.callback.urlProcessor(originUrl, srcType, (/** @type {string} */ newUrl) => {
      if (newUrl) {
        if (!this.urlProcessorMap[key]) {
          this.urlProcessorMap[key] = newUrl;
          this.reMakeHtml();
        }
      } else {
        delete this.urlProcessorMap[key];
      }
      return;
    });
    if (ret && ret !== originUrl) {
      return ret;
    }
    return url;
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
    if (syntax.mathBlock.engine === 'MathJax' || syntax.inlineMath.engine === 'MathJax') {
      // 已经加载过MathJax
      if (externals.MathJax || window.MathJax) {
        return;
      }
      configureMathJax(plugins);
      if (syntax.mathBlock.src || syntax.inlineMath.src) {
        loadScript(syntax.mathBlock.src ? syntax.mathBlock.src : syntax.inlineMath.src, 'mathjax-js');
      }
    }
    if (syntax.mathBlock.engine === 'katex' || syntax.inlineMath.engine === 'katex') {
      // @ts-ignore
      if (window.katex) {
        return;
      }
      syntax.mathBlock.css && loadCSS(syntax.mathBlock.css, 'katex-css');
      if (syntax.mathBlock.src) {
        loadScript(syntax.mathBlock.src, 'katex-js').then(() => {
          // 先更新预览区域
          this.$cherry.previewer
            .getDom()
            .querySelectorAll('.cherry-katex-need-render')
            .forEach((el) => {
              const displayMode = el.classList.contains('Cherry-Math');
              el.innerHTML = window.katex.renderToString(decodeURI(el.getAttribute('data-content')), {
                throwOnError: false,
                displayMode,
              });
              el.classList.remove('cherry-katex-need-render');
            });
          // 再更新asyncRenderHandler里的md（实际为html）内容
          const needDoneKeys = [];
          this.asyncRenderHandler.md = this.asyncRenderHandler.md.replace(
            /<(div|span) data-sign="([^"]+?)" class="([^"]+?) cherry-katex-need-render" ([^>]+? data-lines="[^"]+?") data-content="([\s\S]+?)"><\/\1>/g,
            (match, domName, sign, className, attrs, content) => {
              const displayMode = domName === 'div';
              const key = domName === 'div' ? `math-block-${sign}` : `math-inline-${sign}`;
              // @ts-ignore
              const html = window.katex.renderToString(decodeURI(content), {
                throwOnError: false,
                displayMode,
              });
              needDoneKeys.push(key);
              return `<${domName} data-sign="${sign}" class="${className}" ${attrs}>${html}</${domName}>`;
            },
          );
          needDoneKeys.forEach((key) => {
            this.asyncRenderHandler.done(key);
          });
          // 最后再更新预览区缓存的内容（当预览区隐藏的时候需要更新）
          if (this.$cherry.previewer.isPreviewerHidden()) {
            this.$cherry.previewer.options.previewerCache.html = this.asyncRenderHandler.md;
          }
        });
      }
    }
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

  $prepareMakeHtml(md) {
    this.asyncRenderHandler.clear();
    this.asyncRenderHandler.handleSyncRenderStart(md);
  }

  $completeMakeHtml(md) {
    this.asyncRenderHandler.handleSyncRenderCompleted(md);
  }

  $beforeMakeHtml(str) {
    let $str = str.replace(/~/g, '~T');
    $str = $str.replace(/\$/g, '~D');
    $str = $str.replace(/\r\n/g, '\n'); // DOS to Unix
    $str = $str.replace(/\r/g, '\n'); // Mac to Unix
    // 避免正则性能问题，如/.+\n/.test(' '.repeat(99999)), 回溯次数过多
    // 参考文章：http://www.alloyteam.com/2019/07/13574/
    if ($str[$str.length - 1] !== '\n') {
      $str += '\n';
    }
    $str = this.$fireHookAction($str, 'sentence', 'beforeMakeHtml');
    $str = this.$fireHookAction($str, 'paragraph', 'beforeMakeHtml', this.$dealSentenceByCache.bind(this));
    return $str;
  }

  dealAfterMakeHtml(str) {
    let $str = str.replace(/~D/g, '$');
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
    return $str;
  }

  $afterMakeHtml(str) {
    let $str = this.$fireHookAction(str, 'paragraph', 'afterMakeHtml', this.$dealSentenceByCache.bind(this));
    // str = this._fireHookAction(str, 'sentence', 'afterMakeHtml');
    $str = this.dealAfterMakeHtml($str);
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
    const before = actionArgs?.before || '';
    const method = action === 'afterMakeHtml' ? 'reduceRight' : 'reduce';
    if (!this.hooks && !this.hooks[type] && !this.hooks[type][method]) {
      return $md;
    }
    try {
      let canContinue = true;
      $md = this.hooks[type][method]((newMd, oneHook) => {
        if (!canContinue) {
          return newMd;
        }
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
        // 特殊处理：引用语法在实现嵌套引用时，需要将引用语法之前的语法进行执行，但不需要执行引用语法之后的语法
        if (before && type === 'paragraph' && action === 'afterMakeHtml') {
          if (oneHook.getName() === before) {
            canContinue = false;
          }
        }
        return oneHook[action](newMd, actionArgs, this.markdownParams);
      }, $md);
    } catch (e) {
      throw new NestedError(e);
    }
    return $md;
  }

  /**
   * @deprecated 已废弃，推荐使用 .hash()
   */
  md5(str) {
    return this.hash(str);
  }

  /**
   * 计算哈希值
   * @param {String} str 被计算的字符串
   * @returns {String} 哈希值
   */
  hash(str) {
    // 当缓存队列比较大时，随机抛弃500个缓存
    if (this.hashStrMap.size > 2000) {
      const keys = Array.from(this.hashStrMap.keys()).slice(0, 200);
      keys.forEach((key) => this.hashStrMap.delete(key));
    }
    if (!this.hashStrMap.get(str)) {
      this.hashStrMap.set(str, CryptoJS.SHA256(str).toString());
    }
    return this.hashStrMap.get(str);
  }

  $checkCache(str, func) {
    const sign = this.hash(str);
    if (typeof this.hashCache.get(sign) === 'undefined') {
      this.hashCache.set(sign, func(str));
      if (BUILD_ENV !== 'production') {
        // 生产环境屏蔽
        Logger.log('markdown引擎渲染了：', str);
      }
    }
    return { sign, html: this.hashCache.get(sign) };
  }

  $dealParagraph(md) {
    return this.$fireHookAction(md, 'paragraph', 'makeHtml', this.$dealSentenceByCache.bind(this));
  }

  // 缓存大文本数据，用以提升渲染性能
  $cacheBigData(md) {
    let $md = md.replace(base64Reg, (dataUri) => {
      const cacheKey = `data:cherry/cache;sha256,${this.hash(dataUri)}`;
      this.cachedBigData[cacheKey] = dataUri;
      return cacheKey;
    });
    $md = $md.replace(imgBase64Reg, (whole, m1, m2) => {
      const cacheKey = `bigDataBegin${this.hash(m2)}bigDataEnd`;
      this.cachedBigData[cacheKey] = m2;
      return `${m1}${cacheKey})`;
    });
    $md = $md.replace(imgDrawioXmlReg, (whole, m1, m2) => {
      const cacheKey = `bigDataBegin${this.hash(m2)}bigDataEnd`;
      this.cachedBigData[cacheKey] = m2;
      return `${m1}${cacheKey}}`;
    });
    $md = $md.replace(longTextReg, (whole, m1, m2) => {
      const cacheKey = `bigDataBegin${this.hash(m2)}bigDataEnd`;
      this.cachedBigData[cacheKey] = m2;
      return `${m1}${cacheKey}}`;
    });
    return $md;
  }

  /**
   * @param {string} md
   */
  $deCacheBigData(md) {
    return md
      .replace(/data:cherry\/cache;sha256,[0-9a-f]+/g, (cacheUri) => {
        return this.cachedBigData[cacheUri];
      })
      .replace(/bigDataBegin[^\n]+?bigDataEnd/g, (whole) => {
        return this.cachedBigData[whole];
      });
  }

  /**
   * 流式输出场景时，在最后增加一个光标占位
   * @param {string} md 内容
   * @returns {string}
   */
  $setFlowSessionCursorCache(md) {
    if (this.$cherry.options.engine.global.flowSessionContext && this.$cherry.options.engine.global.flowSessionCursor) {
      // 为了不破坏加粗、斜体等语法，光标占位符放在加粗、斜体语法后面
      if (/[*_~^]+\n*$/.test(md)) {
        return md.replace(/([*_~^]+\n*)$/, 'CHERRYFLOWSESSIONCURSOR$1');
      }
      // 针对信息面板和手风琴做特殊处理
      if (/:::\s*\n*$/.test(md) || /\+\+[+-]*\s*\n*$/.test(md)) {
        return md;
      }
      // 针对代码块做特殊处理
      if (/\n\s*`{1,}\s*\n*$/.test(md)) {
        return md.replace(/(\n\s*`{1,}\s*\n*)$/, 'CHERRYFLOWSESSIONCURSOR$1');
      }
      // 针对无序列表做特殊处理
      if (/\n\s*[-*]$/.test(md)) {
        return md.replace(/(\n\s*[-*])$/, 'CHERRYFLOWSESSIONCURSOR$1');
      }
      // 针对表格做特殊处理
      // 针对表格的第二行做特殊处理
      if (/\|[\s-:]+\|*\n*$/.test(md)) {
        return md;
      }
      if (/\|\n*$/.test(md)) {
        return md.replace(/(\|\n*)$/, 'CHERRYFLOWSESSIONCURSOR$1');
      }
      // 针对换行符做特殊处理
      if (/\n+$/.test(md)) {
        return md.replace(/(\n+)$/, 'CHERRYFLOWSESSIONCURSOR$1');
      }
      return `${md}CHERRYFLOWSESSIONCURSOR`;
    }
    return md;
  }

  /**
   * 流式输出场景时，把最后的光标占位替换为配置的dom元素，并在一段时间后删除该元素
   * @param {string} md 内容
   * @returns {string}
   */
  $clearFlowSessionCursorCache(md) {
    if (this.$cherry.options.engine.global.flowSessionCursor) {
      if (this.clearCursorTimer) {
        clearTimeout(this.clearCursorTimer);
      }
      this.clearCursorTimer = setTimeout(() => {
        this.$cherry.clearFlowSessionCursor();
      }, 2560);
      return md.replace(/CHERRYFLOWSESSIONCURSOR/g, this.$cherry.options.engine.global.flowSessionCursor);
    }
    return md;
  }

  /**
   * @param {string} md md字符串
   * @param {'string'|'object'} returnType 返回格式，string：返回html字符串，object：返回结构化数据
   * @returns {string|object} 获取html
   */
  makeHtml(md, returnType = 'string') {
    this.$prepareMakeHtml(md);
    let $md = this.$setFlowSessionCursorCache(md);
    $md = this.$cacheBigData($md);
    $md = this.$beforeMakeHtml($md);
    $md = this.$dealParagraph($md);
    $md = this.$afterMakeHtml($md);
    this.$fireHookAction($md, 'paragraph', '$cleanCache');
    $md = this.$deCacheBigData($md);
    $md = this.$clearFlowSessionCursorCache($md);
    this.$completeMakeHtml($md);
    if (returnType === 'object') {
      return htmlparser2.parseDocument($md.replace(/\n/g, ''));
    }
    return $md;
  }

  makeHtmlForBlockquote(md) {
    let $md = md;
    $md = this.$dealParagraph($md);
    $md = this.$fireHookAction($md, 'paragraph', 'afterMakeHtml', { before: 'blockquote' });
    return $md;
  }

  makeHtmlForFootnote(md) {
    let $md = md;
    $md = this.$dealParagraph($md);
    $md = this.$fireHookAction($md, 'paragraph', 'afterMakeHtml', { before: 'footnote' });
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
