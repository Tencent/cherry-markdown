/**
 * Copyright (C) 2021 Tencent.
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
/**
 * 预览区域右侧悬浮的工具栏
 * 推荐放置跟编辑区域完全无关的工具栏
 *    比如复制预览区域内容、修改预览区域主题等
 */
export default class Sidebar extends Toolbar {
  // constructor(options) {
  //   super(options);
  // }
  appendMenusToDom(menus) {
    const list = document.createElement('div');
    list.className = 'cherry-sidebar-list';
    list.appendChild(menus);
    this.options.dom.appendChild(list);
    // 将侧栏列表高度写入 CSS 变量，便于定位
    if (typeof document !== 'undefined' && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        const height = list.scrollHeight;
        // 高度为 0 时保持默认 120px，不覆盖
        if (height > 0) {
          this.$cherry.wrapperDom.style.setProperty('--sidebar-list-height', `${height}px`);
        }
      });
      observer.observe(list);
    }
  }

  init() {
    super.init();
    Object.entries(this.shortcutKeyMap).forEach(([key, value]) => {
      this.$cherry.toolbar.shortcutKeyMap[key] = value;
    });
  }
}
