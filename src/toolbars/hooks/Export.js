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
import html2canvas from 'html2canvas';

const toggleBodyShow = (isShow) => {
  /** @type {HTMLElement[]}*/ (Array.from(document.body.children)).forEach((dom) => {
    dom.style.display = isShow ? '' : 'none';
  });
};

const fileDownload = (downloadUrl) => {
  const aLink = document.createElement('a');
  aLink.style.display = 'none';
  aLink.href = downloadUrl;
  aLink.download = 'cherry.png';
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
};

export default class Export extends MenuBase {
  constructor(editor) {
    super(editor);
    this.setName('export');
    this.updateMarkdown = false;
    this.subMenuConfig = [
      { noIcon: true, name: '导出PDF', onclick: this.bindSubClick.bind(this, 'pdf') },
      { noIcon: true, name: '导出长图', onclick: this.bindSubClick.bind(this, 'screenShot') },
    ];
  }

  onClick(shortKey = '', type) {
    if (document.querySelector('.cherry-dropdown[name=export]')) {
      /** @type {HTMLElement}*/ (document.querySelector('.cherry-dropdown[name=export]')).style.display = 'none';
    }
    if (type === 'pdf') this.exportPDF();
    else if (type === 'screenShot') this.exportScreenShot();
  }

  exportPDF() {
    const cherryPreviewer = document.querySelector('.cherry').cloneNode(true);
    const cherryWrapper = document.createElement('div');
    cherryWrapper.appendChild(cherryPreviewer);
    cherryWrapper.querySelector('.cherry').classList.remove('cherry');
    toggleBodyShow();
    document.body.appendChild(cherryWrapper);
    document.body.style.overflow = 'visible';
    window.print();
    toggleBodyShow(true);
    cherryWrapper.remove();
    document.body.style.overflow = '';
  }

  exportScreenShot() {
    const previewerClone = /** @type {HTMLElement}*/ (document.querySelector('.cherry-previewer').cloneNode(true));
    document.body.style.overflow = 'visible';
    window.scrollTo(0, 0);
    document.body.append(previewerClone);
    html2canvas(previewerClone, {
      allowTaint: true,
      height: previewerClone.clientHeight,
      width: previewerClone.clientWidth,
      scrollY: 0,
      scrollX: 0,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg');
      fileDownload(imgData);
      previewerClone.remove();
      document.body.style.overflow = '';
    });
  }
}
