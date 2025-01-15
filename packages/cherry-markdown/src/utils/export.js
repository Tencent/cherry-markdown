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
import html2canvas from 'html2canvas';

/**
 * 先把body上的内容隐藏起来
 * @returns {Array} displayList 记录body子元素原始的显隐信息
 */
const hideBodyChildren = () => {
  const displayList = [];
  /** @type {HTMLElement[]}*/ (Array.from(document.body.children)).forEach((dom, index) => {
    displayList[index] = dom.style.display;
    dom.style.display = 'none';
  });
  return displayList;
};

/**
 * 复原body上被隐藏的内容
 * @param {Array} displayList 记录body子元素原始的显隐信息
 */
const undoHideBodyChildren = (displayList = []) => {
  /** @type {HTMLElement[]}*/ (Array.from(document.body.children)).forEach((dom, index) => {
    if (typeof displayList[index] !== 'undefined') {
      dom.style.display = displayList[index];
    }
  });
};

/**
 * 将预览区域的内容放在body上准备后续导出操作
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {function} cb 准备好导出后开始执行导出操作
 */
const getReadyToExport = (previewDom, cb) => {
  const cherryPreviewer = /** @type {HTMLElement}*/ (previewDom.cloneNode(true));
  // 强制去掉预览区的隐藏class
  cherryPreviewer.className = cherryPreviewer.className.replace('cherry-previewer--hidden', '');
  cherryPreviewer.style.width = '100%';
  const mmls = cherryPreviewer.querySelectorAll('mjx-assistive-mml');
  // a fix for html2canvas
  mmls.forEach((e) => {
    if (e instanceof HTMLElement) e.style.setProperty('visibility', 'hidden');
  });
  const cherryWrapper = document.createElement('div');
  cherryWrapper.appendChild(cherryPreviewer);
  const displayList = hideBodyChildren();
  document.body.appendChild(cherryWrapper);
  const bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'visible';
  cb(cherryPreviewer, () => {
    cherryWrapper.remove();
    undoHideBodyChildren(displayList);
    document.body.style.overflow = bodyOverflow;
  });
};

/**
 * 下载文件
 * @param {String} downloadUrl 图片本地地址
 * @param {String} fileName 导出图片文件名
 */
const fileDownload = (downloadUrl, fileName) => {
  const aLink = document.createElement('a');
  aLink.style.display = 'none';
  aLink.href = downloadUrl;
  aLink.download = `${fileName}.png`;
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
};

/**
 * 利用window.print导出成PDF
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {String} fileName 导出PDF文件名
 */
export function exportPDF(previewDom, fileName) {
  const oldTitle = document.title;
  document.title = fileName;
  getReadyToExport(previewDom, (/** @type {HTMLElement}*/ cherryPreviewer, /** @type {function}*/ thenFinish) => {
    // 强制展开所有代码块
    cherryPreviewer.innerHTML = cherryPreviewer.innerHTML.replace(
      /class="cherry-code-unExpand("| )/g,
      'class="cherry-code-expand$1',
    );
    window.print();
    thenFinish();
    document.title = oldTitle;
  });
}

/**
 * 利用canvas将html内容导出成图片
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {String} fileName 导出图片文件名
 */
export function exportScreenShot(previewDom, fileName) {
  getReadyToExport(previewDom, (/** @type {HTMLElement}*/ cherryPreviewer, /** @type {function}*/ thenFinish) => {
    window.scrollTo(0, 0);
    // 去掉audio和video标签
    cherryPreviewer.innerHTML = cherryPreviewer.innerHTML.replace(/<audio [^>]+?>([^\n]*?)<\/audio>/g, '$1');
    cherryPreviewer.innerHTML = cherryPreviewer.innerHTML.replace(/<video [^>]+?>([^\n]*?)<\/video>/g, '$1');
    // 强制展开所有代码块
    cherryPreviewer.innerHTML = cherryPreviewer.innerHTML.replace(
      /class="cherry-code-unExpand("| )/g,
      'class="cherry-code-expand$1',
    );
    html2canvas(cherryPreviewer, {
      allowTaint: true,
      height: cherryPreviewer.clientHeight,
      width: cherryPreviewer.clientWidth,
      scrollY: 0,
      scrollX: 0,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg');
      fileDownload(imgData, fileName);
      thenFinish();
    });
  });
}

/**
 * 导出 markdown 文件
 * @param {String} markdownText markdown文本
 * @param {String} fileName 导出markdown文件名
 */
export function exportMarkdownFile(markdownText, fileName) {
  const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
  const aLink = document.createElement('a');
  aLink.style.display = 'none';
  aLink.href = URL.createObjectURL(blob);
  aLink.download = `${fileName}.md`;
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
}

/**
 * 导出预览区 HTML 文件
 * @param {String} HTMLText HTML文本
 * @param {String} fileName 导出HTML文件名
 */
export function exportHTMLFile(HTMLText, fileName) {
  const blob = new Blob([HTMLText], { type: 'text/markdown;charset=utf-8' });
  const aLink = document.createElement('a');
  aLink.style.display = 'none';
  aLink.href = URL.createObjectURL(blob);
  aLink.download = `${fileName}.html`;
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
}
