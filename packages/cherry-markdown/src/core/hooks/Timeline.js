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
import Panel from './Panel';
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
import { blockNames } from '@/utils/sanitize';

/**
 * 时间线语法
 * 复用 :::xxx ... ::: 容器语法，type 为 timeline
 *
 * 例：
 *  :::timeline 项目历程
 *  - [done] 2024-01-15 项目立项
 *    完成需求评审，确定技术选型。
 *  - [doing] 2024-03-20 Alpha 版本
 *    正在联调。
 *  - [todo] 2024-06-01 正式上线
 *  - [milestone] 2024-08-01 用户破万
 *  - [error] 2024-09-01 严重回滚事件
 *  :::
 *
 * 状态修饰符（可选，默认 todo）：
 *   [done] / [✓]         已完成
 *   [doing] / […]        进行中
 *   [todo] / [ ]         待办
 *   [milestone] / [★]    里程碑
 *   [error] / [✗]        异常
 *
 * 说明：
 *   - 每个 "- " 开头行为一个节点条目
 *   - 状态修饰符之后紧跟的第一个空白分隔词组作为时间戳（可选）
 *   - 其后到下一个 "- " 之前的所有内容作为标题+描述，首行为标题，其余为描述
 */
export default class Timeline extends Panel {
  static HOOK_NAME = 'timeline';

  constructor(options) {
    // 复用 Panel 的构造：needCache、正则初始化等
    super(options);
    const { enableTimeline = true } = options.config || {};
    this.enableTimeline = enableTimeline;
  }

  /**
   * 复用父类 Panel 的 makeHtml 流程；
   * 通过覆盖 $getTargetType / $getPanelInfo 让 type=timeline 时走时间线渲染
   */
  makeHtml(str, sentenceMakeFunc) {
    if (!this.enableTimeline) {
      return str;
    }
    return str.replace(this.RULE.reg, (match, preLines, name, content) => {
      // 非 timeline 类型交回父类处理，避免与 Panel 冲突
      if (!this.$isTimelineType(name)) {
        return match;
      }
      const lineCount = this.getLineCount(match, preLines);
      const sign = this.$engine.hash(match);
      const testHasCache = this.testHasCache(sign);
      if (testHasCache !== false) {
        return prependLineFeedForParagraph(match, testHasCache);
      }
      const title = this.$getTimelineTitle(name, sentenceMakeFunc);
      const body = this.$buildTimelineBody(content, sentenceMakeFunc);
      const ret = this.pushCache(
        `<div class="cherry-timeline cherry-timeline__vertical" data-sign="${sign}" data-lines="${lineCount}">${title}${body}</div>`,
        sign,
        lineCount,
      );
      return prependLineFeedForParagraph(match, ret);
    });
  }

  /**
   * 判断 :::xxx 的 xxx 是否为 timeline 类型
   * 兼容 :::timeline / :::timeline 标题
   * @param {string} name
   * @returns {boolean}
   */
  $isTimelineType(name) {
    const $name = /\s/.test(name.trim()) ? name.trim().replace(/\s.*$/, '') : name;
    return $name.trim().toLowerCase() === 'timeline';
  }

  /**
   * 提取容器顶部的标题（:::timeline 标题）
   */
  $getTimelineTitle(name, sentenceMakeFunc) {
    const $name = name.trim();
    const rawTitle = /\s/.test($name) ? $name.replace(/[^\s]+\s/, '') : '';
    if (!rawTitle) {
      return '';
    }
    const { html } = sentenceMakeFunc(rawTitle);
    return `<div class="cherry-timeline--header">${html}</div>`;
  }

  /**
   * 将容器内 markdown 内容拆分为多个 "- " 起始的条目
   * @param {string} body
   * @returns {string[]} 每个条目为原始 markdown 字符串（不含起始 "- "）
   */
  $splitTimelineItems(body) {
    const lines = body.split('\n');
    const items = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const startMatch = line.match(/^[ \t]*-[ \t]+(.*)$/);
      if (startMatch) {
        if (current !== null) {
          items.push(current);
        }
        current = startMatch[1];
      } else if (current !== null) {
        // 允许多行描述，去掉行首的一层缩进以对齐
        const dedented = line.replace(/^(?: {2}|\t)/, '');
        current += `\n${dedented}`;
      }
      // 首个 "- " 之前的内容（一般是空行）忽略
    }
    if (current !== null) {
      items.push(current);
    }
    return items;
  }

  /**
   * 从单条条目原始文本中提取状态、时间、标题、描述
   * @param {string} raw
   * @returns {{status: string, time: string, title: string, desc: string}}
   */
  $parseTimelineItem(raw) {
    let rest = raw;
    let status = 'todo';
    // 匹配可选的状态修饰符 [xxx]
    const statusMatch = rest.match(/^\s*\[([^\]]*)\]\s*/);
    if (statusMatch) {
      status = this.$normalizeStatus(statusMatch[1]);
      rest = rest.slice(statusMatch[0].length);
    }
    // 首行 = 时间 + 标题（时间为首个空白分隔词组，形如 2024-01-15、2024/01、v1.0.0 等）
    const nlIdx = rest.indexOf('\n');
    const firstLine = nlIdx >= 0 ? rest.slice(0, nlIdx) : rest;
    const desc = nlIdx >= 0 ? rest.slice(nlIdx + 1) : '';
    let time = '';
    let title = firstLine.trim();
    const timeMatch = firstLine.match(/^\s*(\S+)(?:\s+([\s\S]*))?$/);
    if (timeMatch) {
      const maybeTime = timeMatch[1];
      // 只有看起来像"时间/版本号"才当作 time，否则整行都作为 title
      if (/^[\d]/.test(maybeTime) || /^v\d/i.test(maybeTime)) {
        time = maybeTime;
        title = (timeMatch[2] || '').trim();
      }
    }
    return { status, time, title, desc };
  }

  /**
   * 规范化状态修饰符
   */
  $normalizeStatus(raw) {
    const key = (raw || '').trim().toLowerCase();
    switch (key) {
      case 'done':
      case '✓':
      case 'x':
        return 'done';
      case 'doing':
      case '…':
      case '...':
        return 'doing';
      case 'todo':
      case '':
      case ' ':
        return 'todo';
      case 'milestone':
      case '★':
      case '*':
        return 'milestone';
      case 'error':
      case 'err':
      case '✗':
        return 'error';
      default:
        return 'todo';
    }
  }

  /**
   * 构造整段时间线的 HTML
   */
  $buildTimelineBody(body, sentenceMakeFunc) {
    const items = this.$splitTimelineItems(body);
    if (items.length === 0) {
      return '';
    }
    const paragraphProcessor = (str) => {
      if (!str || str.trim() === '') {
        return '';
      }
      const { html } = sentenceMakeFunc(str);
      let domName = 'p';
      const isContainBlockTest = new RegExp(`<(${blockNames})[^>]*>`, 'i');
      if (isContainBlockTest.test(html)) {
        domName = 'div';
      }
      return `<${domName}>${this.$cleanParagraph(html)}</${domName}>`;
    };
    const itemsHtml = items
      .map((raw) => {
        const { status, time, title, desc } = this.$parseTimelineItem(raw);
        const timeHtml = time ? `<div class="cherry-timeline--time">${sentenceMakeFunc(time).html}</div>` : '';
        const titleHtml = title ? `<div class="cherry-timeline--title">${sentenceMakeFunc(title).html}</div>` : '';
        let descHtml = '';
        if (desc && desc.trim() !== '') {
          if (this.isContainsCache(desc)) {
            descHtml = this.makeExcludingCached(desc, paragraphProcessor);
          } else {
            descHtml = paragraphProcessor(desc);
          }
          descHtml = `<div class="cherry-timeline--desc">${descHtml}</div>`;
        }
        return (
          `<div class="cherry-timeline--item cherry-timeline--item__${status}">` +
          `<div class="cherry-timeline--node"></div>` +
          `<div class="cherry-timeline--content">${timeHtml}${titleHtml}${descHtml}</div>` +
          `</div>`
        );
      })
      .join('');
    return `<div class="cherry-timeline--body">${itemsHtml}</div>`;
  }
}
