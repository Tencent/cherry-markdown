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
import { getSelection } from '@/utils/selection';
/**
 * 插入“引用”的按钮
 */
export default class Quote extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('quote', 'blockquote');
  }

  /**
   * click handler
   * @param {string} selection selection in editor
   * @returns
   */
  onClick(selection) {
    const $selection = getSelection(this.editor.editor, selection, 'line', true) || this.locale.quote;
    const isWrapped = $selection.split('\n').every((text) => /^\s*>[^\n]+$/.exec(text));
    if (isWrapped) {
      // 去掉>号
      return $selection.replace(/(^\s*)>\s*([^\n]+)($)/gm, '$1$2$3').replace(/\n+$/, '\n\n');
    }
    this.registerAfterClickCb(() => {
      this.setLessSelection('> ', '');
    });
    // 给每一行增加>号
    return $selection.replace(/(^)([^\n]+)($)/gm, '$1> $2$3').replace(/\n+$/, '\n\n');
  }
}
