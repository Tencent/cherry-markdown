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
import {
  whiteList,
  convertHTMLNumberToName,
  // isValidScheme, encodeURIOnce,
  escapeHTMLEntitiesWithoutSemicolon,
} from '@/utils/sanitize';
import { sanitizer } from '@/Sanitizer';
import { isBrowser } from '@/utils/env';

export default class HtmlBlock extends ParagraphBase {
  static HOOK_NAME = 'htmlBlock';
  constructor() {
    super({ needCache: true });
  }

  // ref: http://www.vfmd.org/vfmd-spec/specification/#procedure-for-detecting-automatic-links
  isAutoLinkTag(tagMatch) {
    const REGEX_GROUP = [
      /^<([a-z][a-z0-9+.-]{1,31}:\/\/[^<> `]+)>$/i,
      /^<(mailto:[^<> `]+)>$/i,
      /^<([^()<>[\]:'@\\,"\s`]+@[^()<>[\]:'@\\,"\s`.]+\.[^()<>[\]:'@\\,"\s`]+)>$/i,
    ];
    return REGEX_GROUP.some((regex) => regex.test(tagMatch));
  }

  isHtmlComment(match) {
    const htmlComment = /^<!--.*?-->$/;
    return htmlComment.test(match);
  }

  beforeMakeHtml(str, sentenceMakeFunc) {
    if (this.$engine.htmlWhiteListAppend) {
      /**
       * @property
       * @type {false | RegExp}
       */
      this.htmlWhiteListAppend = new RegExp(`^(${this.$engine.htmlWhiteListAppend})( |$|/)`, 'i');
      /**
       * @property
       * @type {string[]}
       */
      this.htmlWhiteList = this.$engine.htmlWhiteListAppend.split('|');
    } else {
      this.htmlWhiteListAppend = false;
      this.htmlWhiteList = [];
    }

    let $str = str;
    $str = convertHTMLNumberToName($str);
    $str = escapeHTMLEntitiesWithoutSemicolon($str);
    $str = $str.replace(/<[/]?(.*?)>/g, (whole, m1) => {
      // 匹配到非白名单且非AutoLink语法的尖括号会被转义
      // 如果是HTML注释，放行
      if (!whiteList.test(m1) && !this.isAutoLinkTag(whole) && !this.isHtmlComment(whole)) {
        if (this.htmlWhiteListAppend === false || !this.htmlWhiteListAppend.test(m1)) {
          return whole.replace(/</g, '&#60;').replace(/>/g, '&#62;');
        }
      }
      // 到达此分支的包含被尖括号包裹的AutoLink语法以及在白名单内的HTML标签
      // 没有被AutoLink解析并渲染的标签会被DOMPurify过滤掉，正常情况下不会出现遗漏
      // 临时替换完整的HTML标签首尾为$#60;和$#62;，供下一步剔除损坏的HTML标签
      return whole.replace(/</g, '$#60;').replace(/>/g, '$#62;');
    });
    // 替换所有形如「<abcd」和「</abcd」的左尖括号
    $str = $str.replace(/<(?=\/?(\w|\n|$))/g, '&#60;');
    // 还原被替换的尖括号
    $str = $str.replace(/\$#60;/g, '<').replace(/\$#62;/g, '>');
    return $str;
  }

  // beforeMakeHtml(str) {
  //     return str;
  // }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  afterMakeHtml(str) {
    let $str = str;
    const config = {
      ALLOW_UNKNOWN_PROTOCOLS: true,
      ADD_ATTR: ['target'],
    };
    if (this.htmlWhiteListAppend !== false) {
      config.ADD_TAGS = this.htmlWhiteList;
      if (this.htmlWhiteListAppend.test('style') || this.htmlWhiteListAppend.test('ALL')) {
        $str = $str.replace(/<style(>| [^>]*>).*?<\/style>/gi, (match) => {
          return match.replace(/<br>/gi, '');
        });
      }
      if (this.htmlWhiteListAppend.test('iframe') || this.htmlWhiteListAppend.test('ALL')) {
        config.ADD_ATTR = config.ADD_ATTR.concat([
          'align',
          'frameborder',
          'height',
          'longdesc',
          'marginheight',
          'marginwidth',
          'name',
          'sandbox',
          'scrolling',
          'seamless',
          'src',
          'srcdoc',
          'width',
        ]);
        config.SANITIZE_DOM = false;
        $str = $str.replace(/<iframe(>| [^>]*>).*?<\/iframe>/gi, (match) => {
          return match.replace(/<br>/gi, '').replace(/\n/g, '');
        });
      }
      if (this.htmlWhiteListAppend.test('script') || this.htmlWhiteListAppend.test('ALL')) {
        // 如果允许script或者输入了ALL，则不做任何过滤了
        $str = $str.replace(/<script(>| [^>]*>).*?<\/script>/gi, (match) => {
          return match.replace(/<br>/gi, '');
        });
        return $str;
      }
    }
    // node 环境下不输出sign和lines
    if (!isBrowser()) {
      config.FORBID_ATTR = ['data-sign', 'data-lines'];
    }
    return sanitizer.sanitize($str, config);
  }
}
