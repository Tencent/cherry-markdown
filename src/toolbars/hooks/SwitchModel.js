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
import Event from '@/Event';
/**
 * 切换预览/编辑模式的按钮
 * 该按钮不支持切换到双栏编辑模式
 * 只能切换成纯编辑模式和纯预览模式
 **/
export default class SwitchModel extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('switchPreview');
    this.instanceId = $cherry.instanceId;
    this.attachEventListeners();
  }

  attachEventListeners() {
    Event.on(this.instanceId, Event.Events.toolbarHide, () => {
      // 当收到工具栏隐藏事件后，修改工具栏的内容为切换到编辑模式的内容
      this.dom.textContent = this.locale.switchEdit;
    });
    Event.on(this.instanceId, Event.Events.toolbarShow, () => {
      // 当收到工具栏显示事件后，修改工具栏的内容为切换到预览模式的内容
      this.dom.textContent = this.locale.switchPreview;
    });
  }

  onClick() {
    if (this.editor.previewer.isPreviewerHidden()) {
      // 从编辑模式切换到预览模式
      this.editor.previewer.previewOnly();
      const toolbar = this.dom.parentElement;
      toolbar.classList.add('preview-only');
      this.dom.textContent = this.locale.switchEdit;
    } else {
      // 从预览模式切换到编辑模式
      this.editor.previewer.editOnly(true);
      const toolbar = this.dom.parentElement;
      toolbar.classList.remove('preview-only');
      this.dom.textContent = this.locale.switchPreview;
    }
  }
}
