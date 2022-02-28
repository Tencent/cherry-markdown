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
 * 全屏按钮
 */
export default class FullScreen extends MenuBase {
  constructor(editor) {
    super(editor);
    this.updateMarkdown = false;
    this.editor = editor;
    this.setName('fullScreen', 'fullscreen');
  }

  /**
   * 响应点击事件
   */
  onClick() {
    const cherryClass = this.editor.options.editorDom.parentElement.classList;
    if (cherryClass.contains('fullscreen')) {
      cherryClass.remove('fullscreen');
    } else {
      cherryClass.add('fullscreen');
    }
    this.editor.editor.refresh();
  }
}
