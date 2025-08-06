/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 Tencent. All rights reserved.
 * The below software in this distribution may have been modified by Tencent ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) Tencent.
 *
 * CherryMarkdown is licensed under the Apache License, Version 2.0 (the "License");
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
/**
 * [TAPD](https://tapd.cn)的检查项语法
 * 通用的检查项语法为：
 *  -[ ] 检查项1
 *  -[x] 检查项2
 *  -[ ] 检查项3
 * TAPD的检查项语法为：
 *  [x][ ][ ] 只要有中括号就会成为检查项
 *  [ ][x][ ]
 *  [ ][ ][x]
 */
export default class TapdCheckListPlugin extends ParagraphBase {
  static HOOK_NAME = 'tapdCheckList';

  constructor() {
    super({ needCache: true });
  }
  makeHtml(html) {
    return html;
  }
  afterMakeHtml(html) {
    return html.replace(/\[[\s|x]\]/g, (item) =>
      item.indexOf('x') > -1
        ? ' <span class="ch-icon ch-icon-check"></span> '
        : ' <span class="ch-icon ch-icon-square"></span> ',
    );
  }

  // @ts-ignore
  rule() {
    return {};
  }
}
