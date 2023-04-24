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
export default class Justify extends Panel {
  constructor($cherry) {
    super($cherry);
    this.setName('justify', 'justify');
    this.panelRule = getPanelRule().reg;
    this.subMenuConfig = [
      {
        iconName: 'justifyLeft',
        name: '左对齐',
        onclick: this.bindSubClick.bind(this, 'left'),
      },
      {
        iconName: 'justifyCenter',
        name: '居中',
        onclick: this.bindSubClick.bind(this, 'center'),
      },
      {
        iconName: 'justifyRight',
        name: '右对齐',
        onclick: this.bindSubClick.bind(this, 'right'),
      },
    ];
  }

  $getTitle() {
    return ' ';
  }
}
