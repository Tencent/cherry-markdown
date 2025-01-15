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
import MenuBase from '@/toolbars/MenuBase';
/**
 * 字数统计
 */
export default class wordCount extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('wordCount', 'wordCount');
    this.noIcon = true;
    this.countState = 0;
    this.countEvent = new Event('count');
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    const span = this.$cherry.wrapperDom.querySelector('.cherry-toolbar-button.cherry-toolbar-wordCount');
    // 首次点击时添加监听器
    if (this.countState === 0) {
      span.addEventListener('count', () => {
        const markdown = this.$cherry.getMarkdown();
        const { characters, words, paragraphs } = this.wordCount(markdown);
        const { locale } = this.$cherry;
        switch (this.countState) {
          case 0:
            span.innerHTML = locale.wordCount;
            break;
          case 1:
            span.innerHTML = `${locale.wordCountC} ${characters}`;
            break;
          case 2:
            span.innerHTML = `${locale.wordCountW} ${words}`;
            break;
          case 3:
            span.innerHTML = `${locale.wordCountP} ${paragraphs}`;
            break;
          case 4:
            span.innerHTML = `${locale.wordCountC}  ${characters} &nbsp; ${locale.wordCountW} ${words} &nbsp; ${locale.wordCountP} ${paragraphs}`;
            break;
        }
      });

      // 编辑区修改时延时触发字数统计，防止过于频繁
      let timeout = null;
      this.editor.editor.on('change', () => {
        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          span.dispatchEvent(this.countEvent);
          timeout = null;
        }, 500);
      });
    }
    // 循环切换4种状态
    this.countState += 1;
    if (this.countState > 4) {
      this.countState = 0;
    }
    span.dispatchEvent(this.countEvent);
    return selection;
  }

  /**
   * 统计给定 Markdown 文本的字符数、单词数和段落数。
   * @param {string} markdown - 给定的 Markdown 文本字符串
   * @returns {Object} 包含字符数、单词数和段落数的对象
   */
  wordCount(markdown) {
    // 匹配中文和标点符号
    const pattern =
      /[\u4e00-\u9fa5]|[\u3001\u3002\uff01\uff0c\uff1b\uff1a\u201c\u201d\u2018\u2019\u300a\u300b\u3008\u3009\u3010\u3011\u300e\u300f\u300c\u300d\uff08\uff09\u2014\u2026\u2013\uff0e]/g;
    // 统计字符数量，排除换行和空格
    const characters = markdown.replace(/\n|\s/g, '').length;
    // 统计中文和标点符号
    const chineseWords = (markdown.match(pattern) || []).length;
    // 统计英文单词
    const englishWords = markdown
      .replace(pattern, ' ')
      .split(/[\s\n]+/)
      .filter(Boolean).length;
    const words = chineseWords + englishWords;
    // 统计段落数量，使用至少两个连续换行符分割段落
    const paragraphs = markdown.split(/\n{2,}/).filter((line) => line.trim() !== '').length;
    return { characters, words, paragraphs };
  }
}
