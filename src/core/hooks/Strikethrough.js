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
/**
 * 删除线语法
 */
export default class Strikethrough extends SyntaxBase {
  static HOOK_NAME = 'strikethrough';

  constructor({ config } = { config: undefined }) {
    super({ config });
    if (!config) {
      return;
    }
    this.needWhitespace = !!config.needWhitespace;
  }

  /**
   * 主要逻辑
   * @param {string} str markdown源码
   * @returns {string} html内容
   */
  makeHtml(str) {
    if (!this.test(str)) {
      return str;
    }
    return str.replace(this.RULE.reg, '$1<del>$2</del>');
  }

  rule({ config } = { config: undefined }) {
    /** @type {Partial<import('~types/syntax').BasicHookRegexpRule>} */
    let ret = {};
    if (!!config.needWhitespace) {
      ret = { begin: '(^|[\\s])\\~T\\~T', end: '\\~T\\~T(?=\\s|$)', content: '([\\w\\W]+?)' };
    } else {
      ret = { begin: '(^|[^\\\\])\\~T\\~T', end: '\\~T\\~T', content: '([\\w\\W]+?)' };
    }
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
