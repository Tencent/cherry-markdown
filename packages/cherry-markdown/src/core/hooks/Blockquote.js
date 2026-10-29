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
import { compileRegExp } from '@/utils/regexp';

/**
 * GFM Alerts 默认类型映射
 * 规范参考：https://github.com/orgs/community/discussions/16925
 * 五种官方类型：NOTE / TIP / IMPORTANT / WARNING / CAUTION
 * value 中：
 *   - className：追加到 <blockquote> 上的修饰类名（会同时附加 cherry-alert__{type}）
 *   - title：默认标题文案，可被用户配置覆盖
 */
const DEFAULT_GFM_ALERT_TYPES = {
  note: { className: 'note', title: 'Note' },
  tip: { className: 'tip', title: 'Tip' },
  important: { className: 'important', title: 'Important' },
  warning: { className: 'warning', title: 'Warning' },
  caution: { className: 'caution', title: 'Caution' },
};

export default class Blockquote extends ParagraphBase {
  static HOOK_NAME = 'blockquote';

  constructor(options = {}) {
    super({ needCache: true });
    // TODO: String.prototype.repeat polyfill
    const config = options.config || {};
    const gfmAlertConfig = config.gfmAlert;
    // gfmAlert 默认开启；传入 false 可关闭；传入对象则做深度合并
    if (gfmAlertConfig === false) {
      this.enableGfmAlert = false;
      this.gfmAlertTypes = {};
    } else {
      this.enableGfmAlert = true;
      const userTypes =
        gfmAlertConfig && typeof gfmAlertConfig === 'object' && gfmAlertConfig.types ? gfmAlertConfig.types : {};
      /** @type {Record<string, {className: string, title: string}>} */
      this.gfmAlertTypes = {};
      Object.keys(DEFAULT_GFM_ALERT_TYPES).forEach((key) => {
        this.gfmAlertTypes[key] = { ...DEFAULT_GFM_ALERT_TYPES[key], ...(userTypes[key] || {}) };
      });
      // 允许用户新增自定义类型（例如 success / danger）
      Object.keys(userTypes).forEach((key) => {
        const k = String(key).toLowerCase();
        if (!this.gfmAlertTypes[k]) {
          this.gfmAlertTypes[k] = { className: k, title: userTypes[key].title || key, ...userTypes[key] };
        }
      });
    }
  }

  /**
   * 识别并剥离 GFM Alerts 首行标记
   * 规则：blockquote 的第一行必须形如 `[!TYPE]`（紧跟在 `>` 后，允许前后空白）
   * @param {string} rawContent 已剥离 `>` 前缀的 blockquote 原始内容
   * @returns {{ alertType: string|null, alertTitle: string, content: string }}
   *    alertType 为 null 表示非 GFM Alert，content 原样返回
   */
  $parseGfmAlert(rawContent) {
    if (!this.enableGfmAlert) {
      return { alertType: null, alertTitle: '', content: rawContent };
    }
    // 跳过首部空行后再匹配
    const match = rawContent.match(/^\s*\[!([A-Za-z]+)\][ \t]*\r?\n?/);
    if (!match) {
      return { alertType: null, alertTitle: '', content: rawContent };
    }
    const type = match[1].toLowerCase();
    const typeConf = this.gfmAlertTypes[type];
    if (!typeConf) {
      return { alertType: null, alertTitle: '', content: rawContent };
    }
    return {
      alertType: typeConf.className || type,
      alertTitle: typeConf.title || match[1],
      content: rawContent.slice(match[0].length),
    };
  }

  handleMatch(str, sentenceMakeFunc) {
    return str.replace(this.RULE.reg, (match, lines, content) => {
      const lineCount = this.getLineCount(match, lines); // 段落所占行数
      const sign = this.$engine.hash(match);
      const testHasCache = this.testHasCache(sign);
      if (testHasCache !== false) {
        return this.getCacheWithSpace(testHasCache, match);
      }
      const htmlDomTest = content.split(/\n</);
      // 如果引用内容后面有html dom结构，就认为这不是引用内容
      let after = '';
      if (htmlDomTest.length > 1) {
        after = `\n<${htmlDomTest.slice(1).join('\n<')}`;
      }
      const $content = htmlDomTest[0].replace(/^([ \t]*>)/gm, '');
      // 识别 GFM Alerts 首行标记 `[!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]`
      const { alertType, alertTitle, content: strippedContent } = this.$parseGfmAlert($content);
      const alertClass = alertType ? ` class="cherry-alert cherry-alert__${alertType}"` : '';
      const alertDataAttr = alertType ? ` data-alert-type="${alertType}"` : '';
      let handledHtml = `<blockquote${alertClass} data-sign="${sign}_${lineCount}" data-lines="${lineCount}"${alertDataAttr}>`;
      if (alertType) {
        handledHtml += `<p class="cherry-alert--title cherry-alert--title__${alertType}"><span class="cherry-alert--icon"></span>${alertTitle}</p>`;
      }
      handledHtml += this.cacheAndGetData(
        strippedContent,
        ($content) => {
          const ret = this.$engine.makeHtmlForBlockquote($content);
          // 给 blockquote 内的标题添加标识
          return ret.replace(/(<h[1-6]\s)/g, '$1data-in-blockquote="true" ');
        },
        2000,
        -300,
      );
      // 标签闭合
      handledHtml += '</blockquote>';
      return `${this.getCacheWithSpace(this.pushCache(handledHtml, sign, lineCount), match)}${after}`;
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    // return str;
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
