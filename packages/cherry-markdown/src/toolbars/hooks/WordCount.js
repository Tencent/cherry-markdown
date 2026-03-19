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
import MenuBase from '@/toolbars/MenuBase';
/**
 * 字数统计
 */
export default class wordCount extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('wordCount', 'wordCount');
    this.noIcon = true;
    this.countEvent = new Event('count');
    // 强制转成数字
    this.countState = Number(localStorage.getItem('cherry-wordCountState')) || 1;
  }

  $dealEditorChange() {
    const { locale } = this.$cherry;
    switch (this.countState) {
      case 0:
        this.btnDom.innerHTML = locale.wordCount;
        break;
      case 1: {
        const { characters, words, lines } = this.$cherry.editor.wordCount(1);
        this.btnDom.innerHTML = `${locale.wordCountC} ${characters} &nbsp; ${locale.wordCountW} ${words} &nbsp; ${locale.wordCountL} ${lines}`;
        break;
      }
      case 2: {
        const { paragraphs, images, codeblocks } = this.$cherry.editor.wordCount(2);
        this.btnDom.innerHTML = `${locale.wordCountP} ${paragraphs} &nbsp; ${locale.wordCountImg} ${images} &nbsp; ${locale.wordCountCode} ${codeblocks}`;
        break;
      }
      case 3: {
        const { chineseWords, englishWords, numbers, symbols } = this.$cherry.editor.wordCount(3);
        this.btnDom.innerHTML = `${locale.wordCountChinese} ${chineseWords} &nbsp; ${locale.wordCountEnglish} ${englishWords} &nbsp; ${locale.wordCountNumber} ${numbers} &nbsp; ${locale.wordCountSymbol} ${symbols}`;
        break;
      }
    }
  }

  afterInit(btnDom) {
    this.btnDom = btnDom;
    this.btnDom.addEventListener('count', () => {
      this.$dealEditorChange();
    });
    this.$dealEditorChange();

    // 编辑区修改时延时触发字数统计，防止过于频繁
    let timeout = null;
    const debouncedCount = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        btnDom.dispatchEvent(this.countEvent);
        timeout = null;
      }, 500);
    };
    setTimeout(() => {
      this.$cherry.editor.editor.on('change', debouncedCount);
      this.$dealEditorChange();
    }, 500);
    // WYSIWYG 模式下 WysiwygEditor 也会 emit afterChange 事件
    this.$cherry.$event.on('afterChange', debouncedCount);
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    // 循环切换4种状态
    this.countState += 1;
    if (this.countState > 3) {
      this.countState = 1;
    }
    // 转成string格式
    localStorage.setItem('cherry-wordCountState', String(this.countState));
    this.btnDom.dispatchEvent(this.countEvent);
    return selection;
  }
}
