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
import { changeCodeTheme } from '@/utils/config';
/**
 * 设置代码块的主题
 * 本功能依赖[prism组件](https://github.com/PrismJS/prism)
 */
export default class CodeTheme extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('codeTheme');
    this.updateMarkdown = false;
    this.noIcon = true;
    this.subMenuConfig = [
      { noIcon: true, name: 'light', onclick: this.bindSubClick.bind(this, 'default') },
      { noIcon: true, name: 'dark', onclick: this.bindSubClick.bind(this, 'dark') },
      { noIcon: true, name: 'one light', onclick: this.bindSubClick.bind(this, 'one-light') },
      { noIcon: true, name: 'one dark', onclick: this.bindSubClick.bind(this, 'one-dark') },
      { noIcon: true, name: 'vs light', onclick: this.bindSubClick.bind(this, 'vs-light') },
      { noIcon: true, name: 'vs dark', onclick: this.bindSubClick.bind(this, 'vs-dark') },
      { noIcon: true, name: 'solarized light', onclick: this.bindSubClick.bind(this, 'solarized-light') },
      { noIcon: true, name: 'tomorrow dark', onclick: this.bindSubClick.bind(this, 'tomorrow-night') },
      { noIcon: true, name: 'okaidia', onclick: this.bindSubClick.bind(this, 'okaidia') },
      { noIcon: true, name: 'twilight', onclick: this.bindSubClick.bind(this, 'twilight') },
      { noIcon: true, name: 'coy', onclick: this.bindSubClick.bind(this, 'coy') },
    ];
  }

  /**
   * 响应点击事件
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @param {string} codeTheme 具体的代码块主题
   */
  onClick(shortKey = '', codeTheme) {
    this.$cherry.$event.emit('changeCodeBlockTheme', codeTheme);
    changeCodeTheme(this.$cherry, codeTheme);
  }
}
