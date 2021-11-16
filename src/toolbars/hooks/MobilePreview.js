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
 * 预览区域切换到“移动端视图”的按钮
 */
export default class MobilePreview extends MenuBase {
  constructor(editor, engine, toolbar) {
    super(editor);
    this.previewer = toolbar.options.previewer;
    this.updateMarkdown = false;
    this.setName('mobilePreview', 'phone');
  }

  /**
   * 响应点击事件
   * 因为是预览区域的按钮，所以不用关注编辑区的选中内容
   */
  onClick() {
    this.previewer.removeScroll();
    // TODO：是否可以只通过修改外层class的方式来实现移动端预览效果的展示，而不是增加删除dom结构的方式
    const content = this.previewer.options.previewerDom.innerHTML;
    const previewer = document.querySelector('.cherry-previewer');
    if (this.previewer.isMobilePreview) {
      previewer.innerHTML = content;
      this.previewer.options.previewerDom = previewer;
    } else {
      previewer.innerHTML = `<div class='cherry-mobile-previewer-content'>${content}</div>`;
      this.previewer.options.previewerDom = document.querySelector('.cherry-mobile-previewer-content');
    }
    this.previewer.isMobilePreview = !this.previewer.isMobilePreview;
    this.previewer.bindScroll();
  }
}
