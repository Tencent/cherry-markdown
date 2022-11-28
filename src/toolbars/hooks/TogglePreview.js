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
 * 关闭/展示预览区域的按钮
 */
export default class TogglePreview extends MenuBase {
  /** @type {boolean} 当前预览状态 */
  $previewerHidden = false;

  constructor($cherry) {
    super($cherry);
    this.setName('previewClose', 'previewClose');
    this.instanceId = $cherry.instanceId;
    this.updateMarkdown = false;
    this.attachEventListeners();
  }

  /**
   * 绑定预览事件
   */
  attachEventListeners() {
    Event.on(this.instanceId, Event.Events.previewerClose, () => {
      this.isHidden = true;
    });
    Event.on(this.instanceId, Event.Events.previewerOpen, () => {
      this.isHidden = false;
    });
  }

  get isHidden() {
    return this.$previewerHidden;
  }

  set isHidden(state) {
    // 节流
    if (state === this.$previewerHidden) {
      return;
    }
    const icon = this.dom.querySelector('i');
    // 隐藏预览，按钮状态为打开预览
    if (state) {
      icon.classList.toggle('ch-icon-previewClose', false);
      icon.classList.toggle('ch-icon-preview', true);
      icon.title = this.locale.togglePreview;
    } else {
      icon.classList.toggle('ch-icon-previewClose', true);
      icon.classList.toggle('ch-icon-preview', false);
      icon.title = this.locale.previewClose;
    }
    this.$previewerHidden = state;
  }

  /**
   * 响应点击事件
   */
  onClick() {
    if (this.editor.previewer.isPreviewerHidden()) {
      this.editor.previewer.recoverPreviewer(true);
      this.isHidden = false;
    } else {
      this.editor.previewer.editOnly(true);
      this.isHidden = true;
    }
  }
}
