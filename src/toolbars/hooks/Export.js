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

export default class Export extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('export');
    this.noIcon = true;
    this.updateMarkdown = false;
    this.subMenuConfig = [
      { noIcon: true, name: 'exportToPdf', onclick: this.bindSubClick.bind(this, 'pdf') },
      { noIcon: true, name: 'exportScreenshot', onclick: this.bindSubClick.bind(this, 'screenShot') },
      { noIcon: true, name: 'exportMarkdownFile', onclick: this.bindSubClick.bind(this, 'markdown') },
      { noIcon: true, name: 'exportHTMLFile', onclick: this.bindSubClick.bind(this, 'html') },
    ];
  }

  onClick(shortKey = '', type) {
    if (document.querySelector('.cherry-dropdown[name=export]')) {
      /** @type {HTMLElement}*/ (document.querySelector('.cherry-dropdown[name=export]')).style.display = 'none';
    }
    // 强制刷新一下预览区域的内容
    const { previewer } = this.$cherry;
    let html = '';
    if (previewer.isPreviewerHidden()) {
      html = previewer.options.previewerCache.html;
    } else {
      html = previewer.getDomContainer().innerHTML;
    }
    // 需要未加载的图片替换成原始图片
    html = previewer.lazyLoadImg.changeDataSrc2Src(html);
    previewer.refresh(html);
    previewer.export(type);
  }
}
