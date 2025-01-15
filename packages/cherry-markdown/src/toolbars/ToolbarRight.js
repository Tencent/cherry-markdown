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
import Toolbar from './Toolbar';
import { createElement } from '@/utils/dom';
/**
 * 在编辑区域选中文本时浮现的bubble工具栏
 */
export default class ToolbarRight extends Toolbar {
  /**
   * 根据配置画出来一级工具栏
   */
  appendMenusToDom(menus) {
    const toolbarLeft = createElement('div', 'toolbar-right');
    toolbarLeft.appendChild(menus);
    this.options.dom.appendChild(toolbarLeft);
  }

  init() {
    super.init();
    Object.entries(this.shortcutKeyMap).forEach(([key, value]) => {
      this.$cherry.toolbar.shortcutKeyMap[key] = value;
    });
  }
}
