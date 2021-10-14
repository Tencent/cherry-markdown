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

export default class Size extends MenuBase {
  constructor(editor) {
    super(editor);
    this.setName('size', 'size');
    this.subMenuConfig = [
      { name: '小', noIcon: true, onclick: this.bindSubClick.bind(this, '12') },
      { name: '中', noIcon: true, onclick: this.bindSubClick.bind(this, '17') },
      { name: '大', noIcon: true, onclick: this.bindSubClick.bind(this, '24') },
      { name: '特大', noIcon: true, onclick: this.bindSubClick.bind(this, '32') },
    ];
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  _getFlagStr(shortKey) {
    const test = shortKey.replace(/[^0-9]+([0-9])/g, '$1');
    let header = '#';
    for (let i = 1; i < test; i++) {
      header += '#';
    }
    return header;
  }

  onClick(selection, shortKey = '17') {
    // if(/^\s*(![0-9]+)[\s\S]+(!)/.test(selection)) {
    //     selection = selection.replace(/(^)(\s*)(![0-9]+)([^\n]+)(!)(\s*)($)/gm, '$1$4$7');
    //     return selection;
    // }else {
    let $selection = selection ? selection : '字号';
    $selection = $selection.replace(/(^)([^\n]+)($)/gm, `$1 !${shortKey} $2! $3`);
    return $selection;
    // }
  }
}
