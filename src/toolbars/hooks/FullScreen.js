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
import { createIcon } from '@/utils/dom';
/**
 * 全屏按钮
 */
export default class FullScreen extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.updateMarkdown = false;
    this.setName('fullScreen', 'maximize');
    this.iconMaximize = createIcon('maximize');
    this.iconMinimize = createIcon('minimize');
  }

  /**
   * 响应点击事件
   */
  onClick() {
    const cherryClass = this.editor.options.editorDom.parentElement.classList;
    const cherryToolbarFullscreen = document.querySelector('.cherry-toolbar-maximize');
    while (cherryToolbarFullscreen.firstChild) {
      // 循环删除父元素下的第一个子元素，直到父元素下没有子元素
      cherryToolbarFullscreen.removeChild(cherryToolbarFullscreen.firstChild);
    }

    if (cherryClass.contains('maximize')) {
      cherryToolbarFullscreen.appendChild(this.iconMaximize);
      cherryClass.remove('maximize');
    } else {
      cherryToolbarFullscreen.appendChild(this.iconMinimize);
      cherryClass.add('maximize');
    }
    this.editor.editor.refresh();
  }
}
