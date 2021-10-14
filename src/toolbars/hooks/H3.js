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
 * 插入3级标题
 */
export default class H3 extends MenuBase {
  constructor(editor) {
    super(editor);
    this.setName('h3', 'h3');
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    // TODO: 1、改成获取整行内容进行判断； 2、根据#号个数判断是增加#号还是删除#号还是编辑#号
    if (/^\s*(#+)\s*[\s\S]+/.test(selection)) {
      return selection.replace(/(^\s*)(#+)(\s*)([\s\S]+$)/gm, '$1$4');
    }
    let $selection = selection ? selection : '标题';
    $selection = $selection.replace(/(^)([\s]*)([^\n]+)($)/gm, '$1### $3$4');
    return $selection;
  }
}
