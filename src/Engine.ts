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
import HookCenter from '@/core/HookCenter';
import hooksConfig from '@/core/HooksConfig';
import NestedError, { $expectTarget, $expectInherit, $expectInstance } from '@/utils/error';
import md5 from 'md5';
import SyntaxBase from '@/core/SyntaxBase';
import ParagraphBase from '@/core/ParagraphBase';
import { PUNCTUATION } from '@/utils/regexp';
import { escapeHTMLSpecialChar } from '@/utils/sanitize';
import Logger from '@/Logger';
import { configureMathJax } from '@/utils/mathjax';
import UrlCache from '@/UrlCache';
import htmlParser from '@/utils/htmlparser';
import { isBrowser } from '@/utils/env';
import type { CherryOptions } from '~types/cherry';
import type Cherry from '@/Cherry';

export const Lifecycle = {
  beforeMakeHtml: 'beforeMakeHtml',
  makeHtml: 'makeHtml',
  afterMakeHtml: 'afterMakeHtml',
  mounted: 'mounted',
} as const;

export type EngineLifecycle = keyof typeof Lifecycle;
export type EngineHooksType = 'sentence' | 'paragraph';

export function injectEngine(syntaxHook: SyntaxBase, $engine: Engine): SyntaxBase {
  // @ts-expect-error
  if (!syntaxHook.$engine) {
    // @ts-expect-error
    syntaxHook.$engine = $engine;
    // Deprecated
    Object.defineProperty(syntaxHook, '_engine', {
      get(this: SyntaxBase) {
        Logger.warn('`this._engine` is deprecated. Use `this.$engine` instead.');
        return this.$engine;
      },
    });
  }
  return syntaxHook;
}

export default class Engine {
  private hookCenter!: HookCenter;
  private hooks!: Record<EngineHooksType, SyntaxBase[]>;
  private md5Cache: Record<string, string> = {};
  private md5StrMap: Record<string, string> = {};
  /**
   * @deprecated
   * @unused
   */
  private currentStrMd5: string[] = [];

  /**
   *
   * @param options 初始化Cherry时传入的选项
   * @param $cherry Cherry实例
   */
  constructor(private options: Partial<CherryOptions>, public $cherry: Cherry) {
    // Deprecated
    Object.defineProperty(this, '_cherry', {
      get() {
        Logger.warn('`_engine._cherry` is deprecated. Use `$engine.$cherry` instead.');
        return $cherry;
      },
    });
    this.initMath();
    this.hookCenter = new HookCenter(hooksConfig as typeof SyntaxBase[], options);
    this.hooks = this.hookCenter.getHookList();
  }

  /**
   * @deprecated
   */
  get htmlWhiteListAppend() {
    return this.options.engine?.global?.htmlWhiteList ?? '';
  }

  md5(str: string): string {
    if (!this.md5StrMap[str]) {
      this.md5StrMap[str] = md5(str);
    }
    return this.md5StrMap[str];
  }

  makeHtml(md: string): string {
    let processedText = md;
    processedText = this.$beforeMakeHtml(processedText);
    processedText = this.$dealParagraph(processedText);
    processedText = this.$afterMakeHtml(processedText);
    return processedText;
  }

  makeMarkdown(html: string): string {
    return htmlParser.run(html);
  }

  mounted() {
    this.fireHookAction('sentence', 'mounted');
    this.fireHookAction('paragraph', 'mounted');
    UrlCache.clear();
  }

  private initMath() {
    // 无论MathJax还是Katex，都可以先进行MathJax配置
    const { externals, engine } = this.options;
    const { mathBlock, inlineMath } = engine?.syntax ?? {};
    const mathBlockEnabled = mathBlock !== false;
    const inlineMathEnabled = inlineMath !== false;
    const pluginsEnabled = mathBlockEnabled && mathBlock.plugins === true;
    const mathBlockSrc = mathBlockEnabled ? mathBlock.src : '';
    const inlineMathSrc = inlineMathEnabled ? inlineMath.src : '';
    // 未开启公式
    if (!isBrowser() || (!mathBlockSrc && !inlineMathSrc)) {
      return;
    }
    // 已经加载过MathJax
    if (externals?.MathJax || window.MathJax) {
      return;
    }
    configureMathJax(pluginsEnabled);
    // 等待MathJax各种插件加载
    const script = document.createElement('script');
    script.src = mathBlockSrc || inlineMathSrc;
    script.async = true;
    if (script.src) {
      document.head.appendChild(script);
    }
  }

  private $beforeMakeHtml(str: string): string {
    let $str = str.replace(/~/g, '~T');
    $str = $str.replace(/\$/g, '~D');
    $str = $str.replace(/\r\n/g, '\n'); // DOS to Unix
    $str = $str.replace(/\r/g, '\n'); // Mac to Unix
    // 避免正则性能问题，如/.+\n/.test(' '.repeat(99999)), 回溯次数过多
    // 参考文章：http://www.alloyteam.com/2019/07/13574/
    if ($str[$str.length - 1] !== '\n') {
      $str += '\n';
    }
    $str = this.fireHookAction('sentence', 'beforeMakeHtml', $str);
    $str = this.fireHookAction('paragraph', 'beforeMakeHtml', $str);
    return $str;
  }

  private $afterMakeHtml(str: string): string {
    let $str = this.fireHookAction('paragraph', 'afterMakeHtml', str);
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
    return $str;
  }

  private $dealSentenceByCache(md: string): { sign: string; html: string } {
    return this.$checkCache(md, (str: string) => this.$dealSentence(str));
  }

  private $dealSentence(md: string) {
    return this.fireHookAction('sentence', 'makeHtml', md, this.$dealSentenceByCache.bind(this));
  }

  private fireHookAction(type: EngineHooksType, action: 'mounted'): void;
  private fireHookAction(
    type: EngineHooksType,
    action: Exclude<EngineLifecycle, 'mounted'>,
    markdownText: string,
    actionArgs?: any,
  ): string;
  private fireHookAction(
    type: EngineHooksType,
    action: EngineLifecycle,
    markdownText?: string,
    actionArgs?: any,
  ): string | void {
    if (action === 'mounted') {
      this.hooks[type].forEach((syntaxHook) => syntaxHook.mounted?.());
      return;
    }

    const markdownTextReducer = (
      action: Exclude<EngineLifecycle, 'mounted'>,
      markdown: string,
      syntaxHook: SyntaxBase,
    ): string => {
      injectEngine(syntaxHook, this);
      if (typeof syntaxHook[action as keyof SyntaxBase] !== 'function') {
        return markdown;
      }
      return syntaxHook[action](markdown, actionArgs, this.options);
    };

    try {
      if (action === 'afterMakeHtml') {
        return this.hooks[type].reduceRight<string>(markdownTextReducer.bind(this, action), markdownText ?? '');
      }
      return this.hooks[type].reduce<string>(markdownTextReducer.bind(this, action), markdownText ?? '');
    } catch (error: unknown) {
      throw new NestedError(
        'Invalid syntax hooks definitions: define at least one sort mapping or one type mapping',
        error,
      );
    }
  }

  private $checkCache(str: string, func: (str: string) => string): { sign: string; html: string } {
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

  private $dealParagraph(md: string) {
    return this.fireHookAction('paragraph', 'makeHtml', md, this.$dealSentenceByCache.bind(this));
  }
}
