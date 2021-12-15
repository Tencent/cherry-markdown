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

function attrsToAttributeString(object) {
  if (typeof object !== 'object' && Object.keys(object).length < 1) {
    return '';
  }
  const attrs = ['']; // 为了join一步到位
  Object.keys(object).forEach((key) => {
    attrs.push(`${key}="${object[key]}"`);
  });
  return attrs.join(' ');
}

function classNamesToAttributeString(array) {
  if (array instanceof Array && array.length > 0) {
    return attrsToAttributeString({ class: array.join(' ') });
  }
  return '';
}

export function makeChecklist(text) {
  return text.replace(/([*+-]\s+)\[(\s|x)\]/g, (whole, pre, test) => {
    const checkHtml = /\s/.test(test)
      ? '<span class="ch-icon ch-icon-square"></span>'
      : '<span class="ch-icon ch-icon-check"></span>';
    return `${pre}${checkHtml}`;
  });
}

export default class List extends ParagraphBase {
  static HOOK_NAME = 'list';

  constructor({ config }) {
    super({ needCache: true });
    this.config = config || {};
    this.intentSpace = this.config.intentSpace > 0 ? this.config.intentSpace : 2;
  }

  $getListStyle(type, m2) {
    if (/^[a-z]/.test(m2)) {
      return 'lower-greek';
    }
    if (/^[一二三四五六七八九十]/.test(m2)) {
      return 'cjk-ideographic';
    }
    if (/^I/.test(m2)) {
      return 'upper-roman';
    }
    if (/^\+/.test(m2)) {
      return 'circle';
    }
    if (/^\*/.test(m2)) {
      return 'square';
    }
    return 'default';
  }

  $wrapList(text, sign, dataLines, sentenceMakeFunc) {
    const html = makeChecklist(text);
    const items = html.split('\n');
    // 列表结尾换行符个数
    const endLineFlagLength = html.match(/\n*$/g)[0].length;
    const indents = [-1];
    const spaces = [-2];
    const types = [null];
    const listStyles = [null];
    const starts = [0];
    const indentRegex = /^(\t|[ ])/;
    const listRegex = /^((([*+-]|\d+[.]|[a-z]\.|[I一二三四五六七八九十]+\.)[ \t]+)([^\r]+?)($|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.]|[a-z]\.|[I一二三四五六七八九十]+\.)[ \t]+)))/;
    let handledHtml = '';
    items.unshift('');
    // 预处理
    for (let i = 1; i < items.length - endLineFlagLength; i++) {
      let type = '';
      let space = 0;
      let listStyle = 'default';
      let start = 1;
      // 缩进处理
      while (indentRegex.test(items[i])) {
        space += items[i][0] === '\t' ? 4 : 1;
        items[i] = items[i].replace(indentRegex, '');
      }
      spaces.push(space);

      if (!listRegex.test(items[i])) {
        type = 'blank';
        indents.push(indents[i - 1]);
      } else {
        let last = i - 1;
        while (last > 0 && spaces[last] > spaces[i]) last -= 1;
        if (spaces[i] < spaces[last] + this.intentSpace) {
          indents.push(indents[last]);
        } else if (spaces[i] < spaces[last] + this.intentSpace + 4) {
          indents.push(indents[last] + 1);
        } else {
          type = 'blank';
          indents.push(indents[i - 1]);
        }
      }

      // 标识符处理
      if (listRegex.test(items[i]) && type !== 'blank') {
        items[i] = items[i].replace(listRegex, (wholeMatch, m1, m2, m3, m4) => {
          type = m2.search(/[*+-]/g) > -1 ? 'ul' : 'ol';
          listStyle = this.$getListStyle(type, m2);
          start = Number(m2.replace('.', '')) ? Number(m2.replace('.', '')) : 1;
          return m4;
        });
      }
      types.push(type);
      listStyles.push(listStyle);
      starts.push(start);
    }
    // 区块末尾闭合标签
    indents.push(-1);
    types.push(null);
    listStyles.push(null);
    starts.push(0);

    const checklistRegex = /<span class="ch-icon ch-icon-(square|check)"><\/span>/;
    // 内容处理
    const listStack = [null]; // 列表类型栈
    items.forEach((item, index) => {
      const { html: itemWithHtml } = sentenceMakeFunc(item);
      // 数组越界，跳过
      if (index < 1) {
        return;
      }

      // 无类型列表单独处理，不入栈
      if (types[index] === 'blank') {
        handledHtml += `<br>${itemWithHtml}`;
        return;
      }

      const itemClassNames = [];
      const blockAttrs = {};
      // checklist 判断
      if (checklistRegex.test(itemWithHtml)) {
        itemClassNames.push('check-list-item');
      }

      const newListItemStartTag = `<li${classNamesToAttributeString(itemClassNames)}>`;
      // 存在类型列表处理
      if (indents[index] > indents[index - 1]) {
        if (index === 1) {
          // 首行签名
          blockAttrs['data-sign'] = `${sign}list${dataLines}`;
          blockAttrs['data-lines'] = `${dataLines}`;
        }
        blockAttrs.class = `cherry-list__${listStyles[index]}`;
        if (types[index] === 'ol') {
          // 有序列表，需要赋值起始位置
          blockAttrs.start = `${starts[index]}`;
        }
        listStack.unshift(types[index]); // 有序、无序列表入栈
        handledHtml += `<${types[index]}${attrsToAttributeString(blockAttrs)}>${newListItemStartTag}${itemWithHtml}`;
      } else if (indents[index] <= indents[index - 1]) {
        // 缩进减少，列表项闭合
        // delta表示需要出栈的次数
        const delta = indents[index - 1] - indents[index];
        for (let i = 0; i < delta && listStack.length > 1; i++) {
          const closeListType = listStack.shift(); // 列表出栈，闭合
          handledHtml += `</li></${closeListType}>`;
        }
        // 栈顶列表类型
        const [currentIndentListType] = listStack;
        // 如果栈顶和当前列表项类型都为null，说明列表已经结束
        if (currentIndentListType === null && types[index] === null) {
          return;
        }
        if (currentIndentListType !== types[index]) {
          blockAttrs['data-sign'] = `${sign}list1`; // 首行签名
          blockAttrs['data-lines'] = '1';
          blockAttrs.class = `cherry-list__${listStyles[index]}`;
          // 更换列表类型，先闭合列表，列表出栈
          if (this.config.listNested) {
            for (let i = index; i < indents.length - 1; i++) {
              indents[i] += 1;
            }
          } else {
            handledHtml += `</li></${currentIndentListType}>`;
            listStack.shift();
          }
          if (types[index] === 'ol') {
            // 有序列表，需要赋值起始位置
            blockAttrs.start = `${starts[index]}`;
          }
          listStack.unshift(types[index]); // 有序、无序列表入栈
          handledHtml += `<${types[index]}${attrsToAttributeString(blockAttrs)}>${newListItemStartTag}`;
        } else {
          handledHtml += `</li>${newListItemStartTag}`;
        }
        handledHtml += itemWithHtml;
      }
    });

    return { html: handledHtml, sign };
  }

  makeHtml(str, sentenceMakeFunc) {
    let $str = `${str}~0`;
    if (this.test($str)) {
      $str = $str.replace(this.RULE.reg, (wholeMatch, lineSpaces, m1, m2) => {
        const ignoreEndLineFlags = wholeMatch.replace(/\n*(\s*~0)?$/g, '');
        const lines = this.getLineCount(ignoreEndLineFlags, lineSpaces);
        const text = wholeMatch.replace(/~0$/g, '').replace(/^\n+/, '');
        const { html: result, sign } = this.$wrapList(text, this.$engine.md5(text), lines, sentenceMakeFunc);
        return this.getCacheWithSpace(this.pushCache(result, sign, lines), wholeMatch);
      });
    }
    $str = $str.replace(/~0$/g, '');
    return $str;
  }

  rule() {
    const ret = {
      begin: '(?:^|\n)(\n*)(([ ]{0,3}([*+-]|\\d+[.]|[a-z]\\.|[I一二三四五六七八九十]+\\.)[ \\t]+)',
      content: '([^\\r]+?)',
      end: '(~0|\\n{2,}(?=\\S)(?![ \\t]*(?:[*+-]|\\d+[.]|[a-z]\\.|[I一二三四五六七八九十]+\\.)[ \\t]+)))',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'gm');
    return ret;
  }
}
