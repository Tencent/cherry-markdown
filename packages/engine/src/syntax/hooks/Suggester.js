// @ts-nocheck
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
import escapeRegExp from '../../utils/toolkit/escapeRegExp';
import SyntaxBase from '../SyntaxBase';
import { isLookbehindSupported } from '../../utils/regexp';
import { replaceLookbehind } from '../../utils/lookbehind-replace';

/**
 * Pure rendering half of the suggester syntax. Editor events, selection,
 * focus and panel DOM live in cherry-markdown's interaction adapter.
 */
export default class Suggester extends SyntaxBase {
  static HOOK_NAME = 'suggester';

  constructor({ config = {} }) {
    super({ needCache: true });
    this.config = config;
    this.suggester = this.normalizeConfig(config.suggester);
    this.RULE = this.rule();
  }

  normalizeConfig(config) {
    const items = Array.isArray(config) ? config : Object.values(config || {});
    return items.reduce((result, item) => {
      if (item?.keyword) result[item.keyword] = item;
      return result;
    }, {});
  }

  makeHtml(str) {
    if (!this.RULE.reg) return str;
    if (isLookbehindSupported()) return str.replace(this.RULE.reg, this.toHtml.bind(this));
    return replaceLookbehind(str, this.RULE.reg, this.toHtml.bind(this), true, 1);
  }

  toHtml(wholeMatch, leadingChar, keyword, text) {
    if (text) {
      return (
        this.suggester[keyword]?.echo?.call(this, text) ||
        `${leadingChar}<span class="cherry-suggestion">${keyword}${text}</span>`
      );
    }
    if (this.suggester[keyword]?.echo === false) return leadingChar;
    if (!this.suggester[keyword]) return leadingChar + text;
    return text ? leadingChar + text : leadingChar;
  }

  rule() {
    const keys = Object.keys(this.suggester || {});
    if (keys.length === 0) return {};
    const escapedKeys = keys.map((key) => escapeRegExp(key)).join('|');
    return {
      reg: new RegExp(
        `${isLookbehindSupported() ? '((?<!\\\\))[ ]' : '(^|[^\\\\])[ ]'}(${escapedKeys})(([^${escapedKeys}\\s])+)`,
        'g',
      ),
    };
  }
}
