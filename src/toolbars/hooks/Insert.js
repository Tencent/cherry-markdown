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
import BubbleTableMenu from '@/toolbars/BubbleTable';
import { getSelection } from '@/utils/selection';
/**
 * "插入"按钮
 */
export default class Insert extends MenuBase {
  // TODO: 需要优化参数传入方式
  constructor($cherry) {
    super($cherry);
    this.setName('insert', 'insert');
    this.noIcon = true;

    this.subBubbleTableMenu = new BubbleTableMenu({ row: 9, col: 9 });
    $cherry.editor.options.wrapperDom.appendChild(this.subBubbleTableMenu.dom);
  }

  /**
   * 上传文件的逻辑
   * @param {string} type 上传文件的类型
   */
  handleUpload(type = 'image') {
    // type为上传文件类型 image|video|audio|pdf|word
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'fileUpload';
    input.value = '';
    input.style.display = 'none';
    // document.body.appendChild(input);
    input.addEventListener('change', (event) => {
      // @ts-ignore
      const [file] = event.target.files;
      // 文件上传后的回调函数可以由调用方自己实现
      this.$cherry.options.fileUpload(file, (url) => {
        // 文件上传的默认回调行数，调用方可以完全不使用该函数
        if (typeof url !== 'string' || !url) {
          return;
        }
        let code = '';
        if (type === 'image') {
          // 如果是图片，则返回固定的图片markdown源码
          code = `![${file.name}](${url})`;
        } else if (type === 'video') {
          // 如果是视频，则返回固定的视频markdown源码
          code = `!video[${file.name}](${url})`;
        } else if (type === 'audio') {
          // 如果是音频，则返回固定的音频markdown源码
          code = `!audio[${file.name}](${url})`;
        } else {
          // 默认返回超链接
          code = `[${file.name}](${url})`;
        }
        // 替换选中区域
        // @ts-ignore
        this.$cherry.$cherry.doc.replaceSelection(code);
      });
    });
    input.click();
  }
  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数
   * @param {Function} [callback] 回调函数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '', callback) {
    if (/normal-table/.test(shortKey)) {
      // 如果是插入markdown标准表格
      // 根据shortKey获取想插入表格的行号和列号
      // shortKey形如：`normal-table-2*4`，表示插入2行(包含表头是3行)4列的表格
      const rowAndCol = shortKey.match(/([0-9]+)[^0-9]([0-9]+)/);
      const row = rowAndCol ? +rowAndCol[1] : 3;
      const col = rowAndCol ? +rowAndCol[2] : 5;
      const headerText = ' Header |'.repeat(col);
      const controlText = ' ------ |'.repeat(col);
      const rowText = `\n|${' Sample |'.repeat(col)}`;
      const text = `${selection}\n\n|${headerText}\n|${controlText}${rowText.repeat(row)}\n\n`;
      return text;
    }
    const $selection = getSelection(this.editor.editor, selection);
    switch (shortKey) {
      case 'hr':
        // 插入分割线
        return `${selection}\n\n---\n`;
      case 'br':
        // 插入换行，在cherry里约定一个回车是一个换行，两个连续回车是一个空行，三个及以上连续回车是两个空行
        return `${selection}<br>`;
      case 'code':
        // 插入代码块
        return `\n\`\`\` \n${selection ? selection : 'code...'}\n\`\`\`\n`;
      case 'formula':
        // 插入行内公式
        return `${selection}\n\n$ e=mc^2 $\n\n`;
      case 'checklist':
        // 插入检查项
        return `${selection}\n\n- [x] Item 1\n- [ ] Item 2\n- [ ] Item 3\n`;
      case 'toc':
        // 插入目录
        return `${selection}\n\n[[toc]]\n`;
      case 'link':
        // 插入超链接
        return `${selection}[${this.locale.link}](http://url.com) `;
      case 'image':
        // 插入图片，调用上传文件逻辑
        this.handleUpload('image');
        return selection;
      case 'video':
        // 插入视频，调用上传文件逻辑
        this.handleUpload('video');
        return selection;
      case 'audio':
        // 插入音频，调用上传文件逻辑
        this.handleUpload('audio');
        return selection;
      case 'table':
        // 插入表格，会出现一个二维面板，用户可以通过点击决定插入表格的行号和列号
        // TODO: 菜单定位方式调整，空行判断
        this.subBubbleTableMenu.dom.style.left = this.subMenu.dom.style.left;
        this.subBubbleTableMenu.dom.style.top = this.subMenu.dom.style.top;
        this.subBubbleTableMenu.show((row, col) => {
          const headerText = ' Header |'.repeat(col);
          const controlText = ' ------ |'.repeat(col);
          const rowText = `\n|${' Sample |'.repeat(col)}`;
          const text = `${selection}\n\n|${headerText}\n|${controlText}${rowText.repeat(row)}\n\n`;
          callback(text);
        });
        return;
      case 'line-table':
        // 插入带折线图的表格
        return `${selection}\n\n${[
          '| :line: {x,y} | a | b | c |',
          '| :-: | :-: | :-: | :-: |',
          '| x | 1 | 2 | 3 |',
          '| y | 2 | 4 | 6 |',
          '| z | 7 | 5 | 3 |',
        ].join('\n')}\n\n`;
      case 'bar-table':
        // 插入带柱状图的表格
        return `${selection}\n\n${[
          '| :bar: {x,y} | a | b | c |',
          '| :-: | :-: | :-: | :-: |',
          '| x | 1 | 2 | 3 |',
          '| y | 2 | 4 | 6 |',
          '| z | 7 | 5 | 3 |',
        ].join('\n')}\n\n`;
      case 'headlessTable':
        // 插入没有表头的表格
        // 该表格语法是源于[TAPD](https://tapd.cn) wiki应用里的一种表格语法
        // 该表格语法不是markdown通用语法，请慎用
        // TODO: 菜单定位方式调整, 空行判断
        this.subBubbleTableMenu.dom.style.left = this.subMenu.dom.style.left;
        this.subBubbleTableMenu.dom.style.top = this.subMenu.dom.style.top;
        this.subBubbleTableMenu.show((row, col) => {
          const text = `${selection}\n\n||${' ~Header ||'.repeat(col)}${`\n||${' SampleT ||'.repeat(col)}`.repeat(
            row - 1,
          )}\n\n`;
          callback(text);
        });
        return;
      case 'pdf':
        // 插入pdf文件，调用上传文件逻辑
        this.handleUpload('pdf');
        return selection;
      case 'word':
        // 插入word，调用上传文件逻辑
        // 可以在文件上传逻辑里做处理，word上传后通过后台服务转成html再返回，前端接受后进行处理并回填
        this.handleUpload('word');
        return selection;
      case 'ruby':
        // 如果选中的文本中已经有ruby语法了，则去掉该语法
        if (/^\s*\{[\s\S]+\|[\s\S]+\}/.test($selection)) {
          return $selection.replace(/^\s*\{\s*([\s\S]+?)\s*\|[\s\S]+\}\s*/gm, '$1');
        }
        return ` { ${$selection} | ${this.editor.$cherry.options.callback.changeString2Pinyin($selection).trim()} } `;
    }
  }
}
