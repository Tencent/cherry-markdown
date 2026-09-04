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
import SyntaxBase, { HOOKS_TYPE_LIST } from '@/core/SyntaxBase';
import Link from '@/core/hooks/Link';

const linkRule = new Link({ config: {}, globalConfig: {} }).RULE.reg;

function isEscaped(str, index) {
  let backslashCount = 0;
  for (let i = index - 1; i >= 0 && str[i] === '\\'; i -= 1) {
    backslashCount += 1;
  }
  return backslashCount % 2 === 1;
}

function findUnescaped(str, delimiter, fromIndex) {
  let index = str.indexOf(delimiter, fromIndex);
  while (index !== -1 && isEscaped(str, index)) {
    index = str.indexOf(delimiter, index + delimiter.length);
  }
  return index;
}

function getLinkDestinationRanges(str) {
  const ranges = [];
  str.replace(linkRule, (match, leadingChar, text, link, title, target, targetValue, offset) => {
    const destinationStart = match.indexOf(link, match.indexOf(']') + 1);
    if (destinationStart !== -1) {
      ranges.push({ start: offset + destinationStart, end: offset + match.length });
    }
    return match;
  });
  return ranges;
}

export default class MathDelimiter extends SyntaxBase {
  static HOOK_NAME = 'mathDelimiter';
  static HOOK_TYPE = HOOKS_TYPE_LIST.PAR;

  constructor({ cherry }) {
    super({});
    const syntax = cherry.options.engine.syntax;
    this.inlineMathEnabled = syntax.inlineMath !== false;
    this.mathBlockEnabled = syntax.mathBlock !== false;
  }

  beforeMakeHtml(str) {
    /** @type {{ open: string; close: string; replacement?: string }[]} */
    let delimiters = [
      { open: '~D~D', close: '~D~D' },
      { open: '~D', close: '~D' },
    ];
    if (this.mathBlockEnabled) {
      delimiters.push({ open: '\\[', close: '\\]', replacement: '~D~D' });
    }
    if (this.inlineMathEnabled) {
      delimiters.push({ open: '\\(', close: '\\)', replacement: '~D' });
    }

    let result = '';
    let cursor = 0;
    const linkDestinationRanges = getLinkDestinationRanges(str);
    while (cursor < str.length) {
      /** @type {{ open: string; close: string; replacement?: string } | undefined} */
      let nextDelimiter;
      let openIndex = -1;
      for (const delimiter of delimiters) {
        const index = findUnescaped(str, delimiter.open, cursor);
        if (index !== -1 && (openIndex === -1 || index < openIndex)) {
          nextDelimiter = delimiter;
          openIndex = index;
        }
      }
      if (!nextDelimiter) {
        return result + str.slice(cursor);
      }

      result += str.slice(cursor, openIndex);
      const contentStart = openIndex + nextDelimiter.open.length;
      const closeIndex = findUnescaped(str, nextDelimiter.close, contentStart);
      if (closeIndex === -1) {
        result += nextDelimiter.open;
        cursor = contentStart;
        delimiters = delimiters.filter((delimiter) => delimiter !== nextDelimiter);
        continue;
      }

      const content = str.slice(contentStart, closeIndex);
      const isInLinkDestination = linkDestinationRanges.some(
        ({ start, end }) => openIndex >= start && openIndex < end,
      );
      if (nextDelimiter.replacement && content.trim() && !isInLinkDestination) {
        result += `${nextDelimiter.replacement}${content}${nextDelimiter.replacement}`;
      } else {
        result += str.slice(openIndex, closeIndex + nextDelimiter.close.length);
      }
      cursor = closeIndex + nextDelimiter.close.length;
    }
    return result;
  }
}
