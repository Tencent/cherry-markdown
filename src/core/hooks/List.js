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

const INDENT_SPACE_NUM = 4; // commonmark default use 1~4 spaces for indent
const TAB_SPACE_NUM = 4; // 1 tab === 4 space

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

export function makeChecklist(text) {
  return text.replace(/^((?:|[\t ]+)[*+-]\s+)\[(\s|x)\]/gm, (whole, pre, test) => {
    const checkHtml = /\s/.test(test)
      ? '<span class="ch-icon ch-icon-square"></span>'
      : '<span class="ch-icon ch-icon-check"></span>';
    return `${pre}${checkHtml}`;
  });
}

// 缩进处理
function handleIndent(str, node) {
  const indentRegex = /^(\t|[ ])/;
  let $str = str;
  while (indentRegex.test($str)) {
    node.space += $str[0] === '\t' ? TAB_SPACE_NUM : 1;
    $str = $str.replace(indentRegex, '');
  }
  return $str;
}

// 序号样式处理
function getListStyle(m2) {
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

// 标识符处理
function handleMark(str, node) {
  const listRegex =
    /^((([*+-]|\d+[.]|[a-z]\.|[I一二三四五六七八九十]+\.)[ \t]+)([^\r]*?)($|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.]|[a-z]\.|[I一二三四五六七八九十]+\.)[ \t]+)))/;
  if (!listRegex.test(str)) {
    node.type = 'blank';
    return str;
  }
  return str.replace(listRegex, (wholeMatch, m1, m2, m3, m4) => {
    node.type = m2.search(/[*+-]/g) > -1 ? 'ul' : 'ol';
    node.listStyle = getListStyle(m2);
    node.start = Number(m2.replace('.', '')) ? Number(m2.replace('.', '')) : 1;
    return m4;
  });
}

class Node {
  // 列表树节点
  constructor() {
    this.index = 0;
    this.space = 0;
    this.type = '';
    this.start = 1;
    this.listStyle = '';
    this.strs = [];
    this.children = [];
    this.lines = 0;
  }
}

export default class List extends ParagraphBase {
  static HOOK_NAME = 'list';

  constructor({ config }) {
    super({ needCache: true });
    this.config = config || {};
    this.tree = [];
    this.emptyLines = 0;
    this.indentSpace = Math.max(this.config.indentSpace, 2);
  }

  addNode(node, current, parent, last) {
    if (node.type === 'blank') {
      this.tree[last].strs.push(node.strs[0]);
    } else {
      this.tree[parent].children.push(current);
      this.tree[current] = {
        ...node,
        parent,
      };
    }
  }

  buildTree(html, sentenceMakeFunc) {
    const items = html.split('\n');
    this.tree = [];
    items.unshift('');
    // 列表结尾换行符个数
    const endLineFlagLength = html.match(/\n*$/g)[0].length;
    for (let i = 0; i < items.length - endLineFlagLength; i++) {
      const node = new Node();
      items[i] = handleIndent(items[i], node);
      items[i] = handleMark(items[i], node);
      node.strs.push(sentenceMakeFunc(items[i]).html);
      node.index = i;
      if (i === 0) {
        // 根节点
        node.space = -2;
        this.tree.push(node);
        continue;
      }
      let last = i - 1;
      while (!this.tree[last]) last -= 1;
      if (node.type === 'blank') {
        this.addNode(node, i, this.tree[last].parent, last);
      } else {
        while (!this.tree[last] || this.tree[last].space > node.space) last -= 1;
        const { space } = node;
        const lastSpace = this.tree[last].space;
        if (space < lastSpace + this.indentSpace) {
          // 成为同级节点
          if (this.config.listNested && this.tree[last].type !== node.type) {
            this.addNode(node, i, last);
          } else {
            this.addNode(node, i, this.tree[last].parent);
          }
        } else if (space < lastSpace + this.indentSpace + INDENT_SPACE_NUM) {
          // 成为子节点
          this.addNode(node, i, last);
        } else {
          // 纯文本
          node.type = 'blank';
          this.addNode(node, i, this.tree[last].parent, last);
        }
      }
    }
  }

  renderSubTree(node, children, type) {
    let lines = 0;
    const attr = {};
    const content = children.reduce((html, item) => {
      const child = this.tree[item];
      const itemAttr = {};
      const str = `<p>${child.strs.join('<br>')}</p>`;
      child.lines += this.getLineCount(child.strs.join('\n'));
      const children = child.children.length ? this.renderTree(item) : '';
      node.lines += child.lines;
      lines += child.lines;
      // checklist 样式适配
      const checklistRegex = /<span class="ch-icon ch-icon-(square|check)"><\/span>/;
      if (checklistRegex.test(str)) {
        itemAttr.class = 'check-list-item';
      }
      return `${html}<li${attrsToAttributeString(itemAttr)}>${str}${children}</li>`;
    }, '');
    if (node.parent === undefined) {
      // 根节点增加属性
      attr['data-lines'] = node.index === 0 ? lines + this.emptyLines : lines;
      attr['data-sign'] = this.sign;
    }
    if (children[0] && type === 'ol') {
      attr.start = this.tree[children[0]].start;
    }
    attr.class = `cherry-list__${this.tree[children[0]].listStyle}`;
    return `<${type}${attrsToAttributeString(attr)}>${content}</${type}>`;
  }

  renderTree(current) {
    let from = 0;
    const node = this.tree[current];
    const { children } = node;
    const html = children.reduce((html, item, index) => {
      if (index === 0) return html;
      if (this.tree[children[index]].type === this.tree[children[index - 1]].type) {
        return html;
      }
      const subTree = this.renderSubTree(node, children.slice(from, index), this.tree[children[index - 1]].type);
      from = index;
      return html + subTree;
    }, '');

    const childrenHtml = children.length
      ? this.renderSubTree(node, children.slice(from, children.length), this.tree[children[children.length - 1]].type)
      : '';

    return html + childrenHtml;
  }

  toHtml(wholeMatch, sentenceMakeFunc) {
    // 行数计算吸收的空行
    this.emptyLines = wholeMatch.match(/^\n\n/)?.length ?? 0;
    const text = wholeMatch.replace(/~0$/g, '').replace(/^\n+/, '');
    this.buildTree(makeChecklist(text), sentenceMakeFunc);
    const result = this.renderTree(0);
    return this.pushCache(result, this.sign, this.$getLineNum(wholeMatch));
  }

  $getLineNum(str) {
    const beginLine = str.match(/^\n\n/)?.length ?? 0;
    const $str = str.replace(/^\n+/, '').replace(/\n+$/, '\n');
    return $str.match(/\n/g)?.length ?? 0 + beginLine;
  }

  makeHtml(str, sentenceMakeFunc) {
    let $str = `${str}~0`;
    if (this.test($str)) {
      $str = $str.replace(this.RULE.reg, (wholeMatch) => {
        return this.getCacheWithSpace(
          this.checkCache(wholeMatch, sentenceMakeFunc, this.$getLineNum(wholeMatch)),
          wholeMatch,
        );
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
