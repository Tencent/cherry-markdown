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
import Panel from './Panel';
import { getPanelRule } from '@/utils/regexp';
/**
 * 插入对齐方式
 */
export default class Align extends Panel {
  constructor($cherry) {
    super($cherry);
    this.setName('align', 'align');
    this.panelRule = getPanelRule().reg;
    const { locale } = this.$cherry;
    this.subMenuConfig = [
      {
        iconName: 'alignLeft',
        name: locale?.alignLeft ?? '左对齐',
        onclick: this.bindSubClick.bind(this, 'left'),
      },
      {
        iconName: 'alignCenter',
        name: locale?.alignCenter ?? '居中',
        onclick: this.bindSubClick.bind(this, 'center'),
      },
      {
        iconName: 'alignRight',
        name: locale?.alignRight ?? '右对齐',
        onclick: this.bindSubClick.bind(this, 'right'),
      },
      {
        iconName: 'alignJustify',
        name: locale?.alignJustify ?? '两端对齐',
        onclick: this.bindSubClick.bind(this, 'justify'),
      },
    ];
  }

  $getTitle() {
    return ' ';
  }
}
