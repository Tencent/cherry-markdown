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
 * 工具栏里的分割线，用来切分不同类型按钮的区域
 * 一个实例中可以配置多个分割线
 */
export default class Split extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('split', '|');
  }

  /**
   * 重载创建按钮逻辑
   * @returns {HTMLElement} 分割线标签
   */
  createBtn() {
    const className = 'cherry-toolbar-button cherry-toolbar-split';
    const i = document.createElement('i');
    i.className = className;
    return i;
  }
}
