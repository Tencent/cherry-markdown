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
import SyntaxBase from '@/core/SyntaxBase';
import {
  compileRegExp,
  DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE_ALLOW_EMPTY,
  ALLOW_WHITESPACE_MULTILINE,
  UNDERSCORE_EMPHASIS_BOUNDARY,
} from '@/utils/regexp';

export default class Emphasis extends SyntaxBase {
  static HOOK_NAME = 'fontEmphasis';

  constructor({ config } = { config: undefined }) {
    super({ config });
    if (!config) {
      return;
    }
    this.allowWhitespace = !!config.allowWhitespace;
  }

  makeHtml(str, sentenceMakeFunc) {
    const converAsterisk = function (match, leading, symbol, text) {
      const tagType = symbol.length % 2 === 1 ? 'em' : 'strong';
      const repeat = Math.floor(symbol.length / 2);
      let prefix = '<strong>'.repeat(repeat);
      let suffix = '</strong>'.repeat(repeat);
      if (tagType === 'em') {
        prefix += '<em>';
        suffix = `</em>${suffix}`;
      }
      // 这里转义_是为了避免跨标签识别
      const result = `${leading}${prefix}${sentenceMakeFunc(text).html.replace(/_/g, '~U')}${suffix}`;
      return result;
    };
    let $str = str;
    if (this.allowWhitespace) {
      $str = $str.replace(/(^|\n[\s]*)(\*)([^\s*](?:.*?)(?:(?:\n.*?)*?))\*/g, converAsterisk);
      $str = $str.replace(/(^|\n[\s]*)(\*{2,})((?:.*?)(?:(?:\n.*?)*?))\2/g, converAsterisk);
      $str = $str.replace(/([^\n*\\\s][ ]*)(\*+)((?:.*?)(?:(?:\n.*?)*?))\2/g, converAsterisk);
    } else {
      $str = $str.replace(this.RULE.asterisk.reg, converAsterisk);
    }

    $str = $str.replace(this.RULE.underscore.reg, (match, leading, symbol, text, index, string) => {
      if (text.trim() === '') {
        return match;
      }
      const tagType = symbol.length % 2 === 1 ? 'em' : 'strong';
      const repeat = Math.floor(symbol.length / 2);
      let prefix = '<strong>'.repeat(repeat);
      let suffix = '</strong>'.repeat(repeat);
      const innerText = sentenceMakeFunc(text).html;
      if (tagType === 'em') {
        // if(/<em>.*?<\/em>/.test(innerText)) {
        //     prefix += symbol;
        //     suffix = symbol + suffix;
        // } else {
        prefix += '<em>';
        suffix = `</em>${suffix}`;
        // }
      }
      const result = `${leading}${prefix}${innerText}${suffix}`;
      return result;
    });

    return $str.replace(/~U/g, '_');
  }

  test(str, flavor) {
    return this.RULE[flavor].reg && this.RULE[flavor].reg.test(str);
  }

  rule({ config } = { config: undefined }) {
    const allowWhitespace = config ? !!config.allowWhitespace : false;
    const REGEX = allowWhitespace
      ? ALLOW_WHITESPACE_MULTILINE
      : DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE_ALLOW_EMPTY;
    const asterisk = {
      begin: '(^|[^\\\\])(\\*+)', // ?<leading>, ?<symbol>
      content: `(${REGEX})`, // ?<text>
      end: '\\2',
    };

    // UNDERSCORE_EMPHASIS_BORDER：允许除下划线以外的「标点符号」和空格出现，使用[^\w\S \t]或[\W\s]会有性能问题
    const underscore = {
      begin: `(^|${UNDERSCORE_EMPHASIS_BOUNDARY})(_+)`, // ?<leading>, ?<symbol>
      content: `(${REGEX})`, // ?<text>
      end: `\\2(?=${UNDERSCORE_EMPHASIS_BOUNDARY}|$)`,
    };

    asterisk.reg = compileRegExp(asterisk, 'g');
    underscore.reg = compileRegExp(underscore, 'g');
    return { asterisk, underscore };
  }
}
