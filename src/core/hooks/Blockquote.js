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
import { compileRegExp } from '@/utils/regexp';

function computeLeadingSpaces(leadingChars) {
  const indentRegex = /^(\t|[ ]{1,4})/;
  let leadingCharsTemp = leadingChars;
  let indent = 0;
  while (indentRegex.test(leadingCharsTemp)) {
    leadingCharsTemp = leadingCharsTemp.replace(/^(\t|[ ]{1,4})/g, '');
    indent += 1;
  }
  return indent;
}

export default class Blockquote extends ParagraphBase {
  static HOOK_NAME = 'blockquote';

  constructor() {
    super({ needCache: true });
    // TODO: String.prototype.repeat polyfill
  }

  handleMatch(str, sentenceMakeFunc) {
    return str.replace(this.RULE.reg, (match, lines, content) => {
      const { sign: contentSign, html: parsedHtml } = sentenceMakeFunc(content);
      const sign = this.signWithCache(parsedHtml) || contentSign;
      const lineCount = this.getLineCount(match, lines); // 段落所占行数
      const listRegex =
        /^(([ \t]{0,3}([*+-]|\d+[.]|[a-z]\.|[I一二三四五六七八九十]+\.)[ \t]+)([^\r]+?)($|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.]|[a-z]\.|[I一二三四五六七八九十]+\.)[ \t]+)))/;
      let lastIndent = computeLeadingSpaces(lines);
      // 逐行处理
      const contentLines = parsedHtml.split('\n');
      const replaceReg = /^[>\s]+/;
      const countReg = />/g;
      let lastLevel = 1;
      let level = 0;
      let handledHtml = `<blockquote data-sign="${sign}_${lineCount}" data-lines="${lineCount}">`;
      // 存储$line值和level值
      const lineMap = new Map();
      const levelMap = new Map();
      for (let i = 0; contentLines[i]; i++) {
        if (i !== 0) {
          const leadIndent = computeLeadingSpaces(contentLines[i]);
          if (leadIndent <= lastIndent && listRegex.test(contentLines[i])) {
            break;
          }
          lastIndent = leadIndent;
        }
        /* eslint-disable no-loop-func */
        const $line = contentLines[i].replace(replaceReg, (leadSymbol) => {
          const leadSymbols = leadSymbol.match(countReg);
          // 本行引用嵌套层级比上层要多
          if (leadSymbols && leadSymbols.length > lastLevel) {
            level = leadSymbols.length;
          } else {
            // 否则保持当前缩进层级
            level = lastLevel;
          }
          return '';
        });
        // lineMap && levelMap
        lineMap.set(i, $line);
        levelMap.set(i, level);
      }

      for (let i = 0; contentLines[i]; i++) {
        // 同层级，且不为首行时补充一个换行
        if (lastLevel === levelMap.get(i) && i !== 0) {
          handledHtml += '<br>';
        }
        // 补充缩进
        if (lastLevel < levelMap.get(i)) {
          handledHtml += '<blockquote>'.repeat(levelMap.get(i) - lastLevel);
          lastLevel = levelMap.get(i);
        }
        // 插入当前行内容
        if (lineMap.get(i) && !lineMap.get(i - 1)) {
          handledHtml += '<p>';
          handledHtml += lineMap.get(i);
          handledHtml += lineMap.get(i + 1) ? '' : '</p>';
        } else if (lineMap.get(i) && lineMap.get(i - 1)) {
          handledHtml += lineMap.get(i);
          handledHtml += lineMap.get(i + 1) ? '' : '</p>';
        }
      }
      // 标签闭合
      handledHtml += '</blockquote>'.repeat(lastLevel);
      console.log(handledHtml);
      // 避免分割成段落
      handledHtml = handledHtml.replace(/(<br>){2,}/g, '<br>');
      return this.getCacheWithSpace(this.pushCache(handledHtml, sign, lineCount), match);
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    if (!this.test(str)) {
      return str;
    }
    return this.handleMatch(str, sentenceMakeFunc);
  }

  rule() {
    const ret = {
      begin: '(?:^|\\n)(\\s*)',
      content: [
        '(',
        '>(?:.+?\\n(?![*+-]|\\d+[.]|[a-z]\\.))(?:>*.+?\\n(?![*+-]|\\d+[.]|[a-z]\\.))*(?:>*.+?)', // multiline
        '|', // or
        '>(?:.+?)', // single line
        ')',
      ].join(''),
      end: '(?=(\\n)|$)',
    };
    ret.reg = compileRegExp(ret, 'g');
    return ret;
  }
}
