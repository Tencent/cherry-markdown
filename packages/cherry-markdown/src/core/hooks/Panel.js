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
import ParagraphBase from '@/core/ParagraphBase';
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
import { getPanelRule } from '@/utils/regexp';
import { blockNames } from '@/utils/sanitize';
/**
 * 面板语法
 * 例：
 *  :::tip
 *  这是一段提示信息
 *  :::
 *  :::warning
 *  这是一段警告信息
 *  :::
 *  :::danger
 *  这是一段危险信息
 *  :::
 */
export default class Panel extends ParagraphBase {
  static HOOK_NAME = 'panel';

  constructor(options) {
    super({ needCache: true });
    const {
      enableJustify = false,
      enableAlign = false,
      enablePanel = true,
      enableCols = true,
      enableTabs = true,
    } = options.config;
    this.enableAlign = enableJustify || enableAlign;
    this.enablePanel = enablePanel;
    this.enableCols = enableCols;
    this.enableTabs = enableTabs;
    // 为每个 Panel 实例生成一个全局递增的 tabs 组序号，保证 radio name 在同页多个 tabs 之间互不干扰
    this.$tabsSeed = 0;
    this.initBrReg(options.globalConfig.classicBr);
  }

  makeHtml(str, sentenceMakeFunc) {
    return str.replace(this.RULE.reg, (match, preLines, name, content) => {
      const type = this.$getTargetType(name);
      if (!this.enablePanel && /primary|info|warning|danger|success/i.test(type)) {
        return match;
      }
      if (!this.enableAlign && /^(left|right|center|justify|cols|tabs)$/i.test(type)) {
        return match;
      }
      // 独立开关：关闭 cols/tabs 后，相应语法将不被识别
      if (!this.enableCols && /^cols$/i.test(type)) {
        return match;
      }
      if (!this.enableTabs && /^tabs$/i.test(type)) {
        return match;
      }
      const lineCount = this.getLineCount(match, preLines);
      const sign = this.$engine.hash(match);
      const testHasCache = this.testHasCache(sign);
      if (testHasCache !== false) {
        return prependLineFeedForParagraph(match, testHasCache);
      }
      const { title, body, appendStyle, className } = this.$getPanelInfo(name, content, sentenceMakeFunc);
      const ret = this.pushCache(
        `<div class="${className}" data-sign="${sign}" data-lines="${lineCount}" ${appendStyle}>${title}${body}</div>`,
        sign,
        lineCount,
      );
      return prependLineFeedForParagraph(match, ret);
    });
  }

  $getClassByType(type) {
    if (/^(left|right|center|justify)$/i.test(type)) {
      return `cherry-text-align cherry-text-align__${type}`;
    }
    if (/^cols$/i.test(type)) {
      return `cherry-panel-cols cherry-panel-cols__cols`;
    }
    if (/^tabs$/i.test(type)) {
      return `cherry-tabs`;
    }
    return `cherry-panel cherry-panel__${type}`;
  }

  $getPanelInfo(name, str, sentenceMakeFunc) {
    const ret = {
      type: this.$getTargetType(name),
      title: sentenceMakeFunc(this.$getTitle(name)).html,
      body: str,
      appendStyle: '',
      className: '',
    };
    ret.className = this.$getClassByType(ret.type);
    if (/^(left|right|center|justify)$/i.test(ret.type)) {
      ret.appendStyle = `style="text-align:${ret.type};"`;
    }
    // 多列排版语法（cols，旧 2cols/3cols 作为别名）支持在类型后追加对齐关键字（left|center|right|justify），默认左对齐
    // 列数由 :: 分隔符自动推断；旧语法 2cols/3cols 指定固定列数
    // tabs 语法同样支持在类型后追加对齐关键字，仅作用于 panel 内容
    let colsAlignStyle = '';
    if (/^(cols|tabs)$/i.test(ret.type)) {
      const align = this.$getColsAlign(name);
      if (align && align !== 'left') {
        ret.className += ` cherry-text-align cherry-text-align__${align}`;
        colsAlignStyle = `text-align:${align};`;
      }
    }
    const paragraphProcessor = (str) => {
      if (str.trim() === '') {
        return '';
      }
      // 调用行内语法，获得段落的签名和对应html内容
      const { html } = sentenceMakeFunc(str);
      let domName = 'p';
      // 如果包含html块级标签（比如div、blockquote等），则当前段落外层用div包裹，反之用p包裹
      const isContainBlockTest = new RegExp(`<(${blockNames})[^>]*>`, 'i');
      if (isContainBlockTest.test(html)) {
        domName = 'div';
      }
      return `<${domName}>${this.$cleanParagraph(html)}</${domName}>`;
    };
    // 多列排版语法（cols）：使用独占一行的 :: 分隔每一列，列数由分隔符数量自动推断
    if (/^cols$/i.test(ret.type)) {
      ret.title = '';
      // 兼容 fixedColCount：旧语法 2cols/3cols 会传入固定列数
      const fixedColCount = this.$getFixedColCount(name);
      const rawCols = this.$splitCols(ret.body, fixedColCount);
      const colCount = rawCols.length || 1;
      const colsHtml = rawCols
        .map((colStr) => {
          let $col = '';
          if (this.isContainsCache(colStr)) {
            $col = this.makeExcludingCached(colStr, paragraphProcessor);
          } else {
            $col = paragraphProcessor(colStr);
          }
          return `<div class="cherry-panel--col">${$col}</div>`;
        })
        .join('');
      ret.body = colsHtml;
      // 通过 --cols CSS 变量驱动列数；同时向后兼容 __2cols/__3cols
      ret.className += ` cherry-panel-cols__${colCount}cols`;
      ret.appendStyle = `style="--cols:${colCount};${colsAlignStyle}"`;
      return ret;
    }
    // 选项卡语法（tabs）：使用独占一行的 :: 分隔每一个 tab
    // 每个 tab 块的首行非空行作为标题，其余行作为 panel 内容
    // 采用 CSS-only 方案（radio + :checked ~ panel），无需 JS 即可完成切换
    if (/^tabs$/i.test(ret.type)) {
      ret.title = '';
      const rawTabs = this.$splitCols(ret.body, 0);
      const tabCount = rawTabs.length || 1;
      // 同页多个 tabs 之间使用递增序号区隔 name，避免 radio 分组冲突
      this.$tabsSeed += 1;
      const groupName = `cherry-tabs-group-${this.$tabsSeed}`;
      const inputsHtml = [];
      const labelsHtml = [];
      const panelsHtml = [];
      rawTabs.forEach((tabStr, idx) => {
        const { title: tabTitle, body: tabBody } = this.$splitTabTitleAndBody(tabStr, idx);
        const inputId = `${groupName}-${idx}`;
        const checkedAttr = idx === 0 ? ' checked' : '';
        const titleHtml = sentenceMakeFunc(tabTitle).html;
        let $panel = '';
        if (tabBody.trim() === '') {
          $panel = '';
        } else if (this.isContainsCache(tabBody)) {
          $panel = this.makeExcludingCached(tabBody, paragraphProcessor);
        } else {
          $panel = paragraphProcessor(tabBody);
        }
        // input 必须与 .cherry-tabs--labels / .cherry-tabs--panels 同级，
        // 这样 :checked ~ .cherry-tabs--labels .label__N 与 :checked ~ .cherry-tabs--panels .panel__N 才能生效
        inputsHtml.push(
          `<input type="radio" name="${groupName}" id="${inputId}" class="cherry-tabs--radio cherry-tabs--radio__${idx}"${checkedAttr}>`,
        );
        labelsHtml.push(
          `<label for="${inputId}" class="cherry-tabs--label cherry-tabs--label__${idx}">${titleHtml}</label>`,
        );
        panelsHtml.push(`<div class="cherry-tabs--panel cherry-tabs--panel__${idx}">${$panel}</div>`);
      });
      ret.body = `${inputsHtml.join('')}<div class="cherry-tabs--labels">${labelsHtml.join(
        '',
      )}</div><div class="cherry-tabs--panels">${panelsHtml.join('')}</div>`;
      ret.className += ` cherry-tabs__${tabCount}tabs`;
      ret.appendStyle = `style="--tabs:${tabCount};${colsAlignStyle}"`;
      return ret;
    }
    ret.title = `<div class="cherry-panel--title ${ret.title ? 'cherry-panel--title__not-empty' : ''}">${
      ret.title
    }</div>`;
    let $body = '';
    if (this.isContainsCache(ret.body)) {
      $body = this.makeExcludingCached(ret.body, paragraphProcessor);
    } else {
      $body = paragraphProcessor(ret.body);
    }
    ret.body = `<div class="cherry-panel--body">${$body}</div>`;
    return ret;
  }

  /**
   * 从 name 中解析多列排版语法的对齐关键字
   * 例如 name 为 "3cols center" 时返回 "center"
   * @param {string} name panel 头部关键字（例如 "3cols center"）
   * @returns {string} 对齐关键字（left|center|right|justify），未指定或非法时返回 'left'
   */
  $getColsAlign(name) {
    const $name = String(name || '').trim();
    if (!/\s/.test($name)) {
      return 'left';
    }
    // 取第一个空格后的第一个词作为对齐关键字
    const rest = $name.replace(/^\S+\s+/, '').trim();
    const first = rest.split(/\s+/)[0].toLowerCase();
    switch (first) {
      case 'left':
      case 'l':
        return 'left';
      case 'right':
      case 'r':
        return 'right';
      case 'center':
      case 'c':
        return 'center';
      case 'justify':
      case 'j':
        return 'justify';
      default:
        return 'left';
    }
  }

  /**
   * 从 name 中解析旧语法固定列数（2cols/3cols）
   * 新语法 cols 返回 0，表示由分隔符数量自动推断列数
   * @param {string} name panel 头部关键字
   * @returns {number} 固定列数（0 表示不固定）
   */
  $getFixedColCount(name) {
    const $name = String(name || '')
      .trim()
      .toLowerCase();
    const first = /\s/.test($name) ? $name.replace(/\s.*$/, '') : $name;
    if (first === '2cols') return 2;
    if (first === '3cols') return 3;
    return 0;
  }

  /**
   * 从选项卡单块内容中拆分出标题与 body
   * - 标题：块内首个非空行（去除头尾空白）；完全为空时退化为 `Tab N`
   * - body：首行之后的任意内容
   * @param {string} raw 单个 tab 的原始文本
   * @param {number} idx tab 序号（从 0 开始），用于退化标题
   * @returns {{title: string, body: string}}
   */
  $splitTabTitleAndBody(raw, idx) {
    // 保留 body 内部缩进，仅 trim 块首尾多余的空白行
    const trimmed = String(raw || '')
      .replace(/^\s*\n/, '')
      .replace(/\n\s*$/, '');
    if (trimmed === '') {
      return { title: `Tab ${idx + 1}`, body: '' };
    }
    const nlIdx = trimmed.indexOf('\n');
    if (nlIdx < 0) {
      // 只有一行：作为标题，body 为空
      return { title: trimmed.trim() || `Tab ${idx + 1}`, body: '' };
    }
    const firstLine = trimmed.slice(0, nlIdx).trim();
    const restBody = trimmed.slice(nlIdx + 1);
    return {
      title: firstLine || `Tab ${idx + 1}`,
      body: restBody,
    };
  }

  /**
   * 按 :: 分隔符拆分多列排版语法的内容
   * - 新语法（cols）：列数由分隔符数量自动推断，末尾空列会被 trim 掉
   * - 旧语法（2cols/3cols）：将结果补齐/截断到固定列数
   * - tabs 语法复用本方法，仅使用推断模式（fixedColCount = 0）
   * @param {string} str 面板内容
   * @param {number} fixedColCount 固定列数（0 表示由分隔符推断）
   * @returns {string[]} 拆分后的各列内容
   */
  $splitCols(str, fixedColCount) {
    // 匹配独占一行的 :: 分隔符（前后为空行/文本行边界均可）
    const parts = str.split(/\n[ \t]*::[ \t]*(?=\n|$)/);
    if (fixedColCount && fixedColCount > 0) {
      // 旧语法：列数不足则补齐，超过则合并到最后一列
      if (parts.length > fixedColCount) {
        const head = parts.slice(0, fixedColCount - 1);
        const tail = parts.slice(fixedColCount - 1).join('\n::\n');
        return [...head, tail];
      }
      while (parts.length < fixedColCount) {
        parts.push('');
      }
      return parts;
    }
    // 新语法：trim 掉末尾空列（内容全为空白视为空列），至少保留 1 列
    while (parts.length > 1 && parts[parts.length - 1].trim() === '') {
      parts.pop();
    }
    return parts;
  }

  $getTitle(name) {
    const $name = name.trim();
    return /\s/.test($name) ? $name.replace(/[^\s]+\s/, '') : '';
  }

  $getTargetType(name) {
    const $name = /\s/.test(name.trim()) ? name.trim().replace(/\s.*$/, '') : name;
    switch ($name.trim().toLowerCase()) {
      case 'primary':
      case 'p':
        return 'primary';
      case 'info':
      case 'i':
        return 'info';
      case 'warning':
      case 'w':
        return 'warning';
      case 'danger':
      case 'd':
        return 'danger';
      case 'success':
      case 's':
        return 'success';
      case 'right':
      case 'r':
        return 'right';
      case 'center':
      case 'c':
        return 'center';
      case 'left':
      case 'l':
        return 'left';
      case 'justify':
      case 'j':
        return 'justify';
      // 旧语法 2cols/3cols 作为 cols 的别名保留
      case 'cols':
      case '2cols':
      case '3cols':
        return 'cols';
      // 选项卡语法
      case 'tabs':
      case 't':
        return 'tabs';
      default:
        return 'primary';
    }
  }

  rule() {
    return getPanelRule();
  }
}
