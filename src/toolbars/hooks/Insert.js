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
import Event from '@/Event';
/**
 * "插入"按钮
 */
export default class Insert extends MenuBase {
  $toolbarStatus = false;
  // TODO: 需要优化参数传入方式
  constructor(editor, options, engine) {
    super(editor);
    this.setName('insert', 'insert');
    this.$toolbarStatus = engine.markdownParams.toolbars.showToolbar; // 获取toolbar默认配置
    this.engine = engine;
    this.subBubbleTableMenu = new BubbleTableMenu({ row: 9, col: 9 });
    editor.options.wrapperDom.appendChild(this.subBubbleTableMenu.dom);

    // 定义子菜单
    /**
     * **TODO**:
     *   这里所有子菜单的代码应该删掉，复用已有的toolbar对象
     */
    this.subMenuConfig = [
      { iconName: 'image', name: 'image', onclick: this.bindSubClick.bind(this, 'image') },
      { iconName: 'video', name: 'audio', onclick: this.bindSubClick.bind(this, 'audio') },
      { iconName: 'video', name: 'video', onclick: this.bindSubClick.bind(this, 'video') },
      { iconName: 'link', name: 'link', onclick: this.bindSubClick.bind(this, 'link') },
      { iconName: 'line', name: 'hr', onclick: this.bindSubClick.bind(this, 'hr') },
      { iconName: 'br', name: 'br', onclick: this.bindSubClick.bind(this, 'br') },
      { iconName: 'code', name: 'code', onclick: this.bindSubClick.bind(this, 'code') },
      { iconName: 'insertFormula', name: 'formula', onclick: this.bindSubClick.bind(this, 'formula') },
      { iconName: 'toc', name: 'toc', onclick: this.bindSubClick.bind(this, 'toc') },
      { iconName: 'table', name: 'table', onclick: this.bindSubClick.bind(this, 'table'), async: true },
      // { iconName: 'table', name: 'line-table', onclick: this.bindSubClick.bind(this, 'line-table') },
      // { iconName: 'table', name: 'bar-table', onclick: this.bindSubClick.bind(this, 'bar-table') },
      // {iconName:'headlessTable', onclick: this.bindSubClick.bind(this, 'headlessTable'), async: true},
      { iconName: 'pdf', name: 'pdf', onclick: this.bindSubClick.bind(this, 'pdf') },
      { iconName: 'word', name: 'word', onclick: this.bindSubClick.bind(this, 'word') },
      { iconName: 'pinyin', name: 'ruby', onclick: this.bindSubClick.bind(this, 'ruby') },
      { iconName: '', name: 'toggleToolbar', onclick: this.bindSubClick.bind(this, 'toggleToolbar') },
    ];
    // 用户可配置
    if (options instanceof Array) {
      const menuMap = this.subMenuConfig.map((menu) => menu.name);
      this.subMenuConfig = options.reduce((config, name) => {
        const index = menuMap.indexOf(name);
        if (index === -1) {
          return config;
        }
        if (name === 'line-table' || name === 'bar-table') {
          if (engine.markdownParams.engine.syntax.table.enableChart === false) {
            return config;
          }
        }
        config.push(this.subMenuConfig[index]);
        return config;
      }, []);
    }
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  bindSubClick(shortCut, selection, async, callback) {
    if (async) {
      return this.onClick(selection, shortCut, callback);
    }
    return this.onClick(selection, shortCut);
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
      this.editor.options.fileUpload(file, (url) => {
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
        this.editor.editor.doc.replaceSelection(code);
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
    // eslint-disable-next-line no-param-reassign
    shortKey = this.matchShortcutKey(shortKey);
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
        return `${selection}\n\n- [x] No.1\n- [ ] No.2\n- [ ] No.3\n`;
      case 'toc':
        // 插入目录
        return `${selection}\n\n[[toc]]\n`;
      case 'link':
        // 插入超链接
        return `${selection}[超链接](http://url.com) `;
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
      case 'toggleToolbar':
        this.toggleToolbar();
        return '';
    }
  }

  /**
   * 解析快捷键
   * @param {string} shortcutKey 快捷键
   * @returns
   */
  matchShortcutKey(shortcutKey) {
    const shortcutKeyMaps = this.shortcutKeyMaps();
    const shortcutKeyMap = shortcutKeyMaps.find((item) => {
      return item.shortcutKey === shortcutKey;
    });
    return shortcutKeyMap !== undefined ? shortcutKeyMap.shortKey : shortcutKey;
  }

  /**
   * 获得监听的快捷键
   * 根据系统字段监听Ctrl+*和 cmd+*
   */
  shortcutKeyMaps() {
    return [
      {
        shortKey: 'code',
        shortcutKey: 'Mod-k',
      },
      {
        shortKey: 'link',
        shortcutKey: 'Mod-l',
      },
      {
        shortKey: 'image',
        shortcutKey: 'Mod-g',
      },
      {
        shortKey: 'formula',
        shortcutKey: 'Mod-m',
      },
      {
        shortKey: 'toggleToolbar',
        shortcutKey: 'Mod-q',
      },
    ];
  }

  /**
   * 切换Toolbar显示状态
   */
  toggleToolbar() {
    const wrapperDom = this.engine.$cherry.cherryDom.childNodes[0];
    if (wrapperDom instanceof HTMLDivElement) {
      if (wrapperDom.className.indexOf('cherry--no-toolbar') > -1) {
        wrapperDom.classList.remove('cherry--no-toolbar');
      } else {
        wrapperDom.classList.add('cherry--no-toolbar');
      }
    }
  }

  get shortcutKeys() {
    const shortcutKeyMap = this.shortcutKeyMaps();
    return shortcutKeyMap.map((item) => {
      return item.shortcutKey;
    });
  }
}
