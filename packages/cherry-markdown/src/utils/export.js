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
import html2canvas from 'html2canvas';

/**
 * 将预览区域的内容放在body上准备后续导出操作
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {function} cb 准备好导出后开始执行导出操作
 */
const getReadyToExport = (previewDom, cb) => {
  const cherryPreviewer = /** @type {HTMLElement}*/ (previewDom.cloneNode(true));
  // 当预览区被隐藏时，cherryPreviewer会有cherry-previewer--hidden类，此行用于恢复预览区
  cherryPreviewer.className = cherryPreviewer.className.replace('cherry-previewer--hidden', '');

  cherryPreviewer.style.width = '100%';
  cherryPreviewer.style.height = 'auto';
  cherryPreviewer.style.maxHeight = 'none';

  const mmls = cherryPreviewer.querySelectorAll('mjx-assistive-mml');
  // a fix for html2canvas
  mmls.forEach((e) => {
    if (e instanceof HTMLElement) e.style.setProperty('visibility', 'hidden');
  });

  const cherryWrapper = document.createElement('div');
  cherryWrapper.className = 'cherry-export-wrapper';

  // 复制主题相关的类名，确保CSS变量能够正确应用
  const cherryInstance = previewDom.closest('.cherry');
  if (cherryInstance) {
    cherryWrapper.className = `${cherryWrapper.className} ${cherryInstance.className}`;
  }

  cherryWrapper.appendChild(cherryPreviewer);
  document.body.appendChild(cherryWrapper);

  const bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'visible';
  cb(cherryPreviewer, () => {
    cherryWrapper.remove();
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

/**
 * 导出到 Word (通过复制 HTML 到剪贴板)
 * @param {String} HTMLText HTML文本
 * @param {String} fileName 文件名
 */
export async function exportWordFile(HTMLText, fileName) {
  // 创建完整的HTML文档结构，包含样式，确保在Word中有更好的显示效果
  const fullHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${fileName}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: none;
            margin: 0;
            padding: 20px;
        }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
        code { 
            background-color: #f4f4f4; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
        pre { 
            background-color: #f4f4f4; 
            padding: 10px; 
            border-radius: 5px; 
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 16px;
            color: #666;
        }
    </style>
</head>
<body>
${HTMLText}
</body>
</html>`;

  if (navigator.clipboard && navigator.clipboard.write) {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([fullHTML], { type: 'text/html' }),
    });
    await navigator.clipboard.write([clipboardItem]);
    showExportWordTip(fileName);
  } else {
    throw new Error('浏览器未授权粘贴板或不支持剪贴板写入');
  }
}

/**
 * 显示导出 Word 的操作提示
 * @param {String} fileName 文件名
 */
function showExportWordTip(fileName) {
  const tipHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--base-editor-bg);
      border: 1px solid var(--base-border-color);
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-md);
      z-index: 99999;
      max-width: 400px;
      text-align: center;
      font-family: var(--font-family-base, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    ">
      <h3 style="margin: 0 0 var(--spacing-md) 0; color: var(--base-font-color);">内容已复制到剪贴板</h3>
      <p style="margin: 0 0 var(--spacing-md) 0; color: var(--base-sub-font-color); line-height: var(--line-height-relaxed);">
        请打开 Microsoft Word，然后按 <strong>Ctrl+V</strong>（Windows）或 <strong>Cmd+V</strong>（Mac）粘贴内容。
      </p>
      <p style="margin: 0 0 var(--spacing-lg) 0; color: var(--base-sub-font-color); font-size: var(--font-size-sm);">
        公式、mermaid 图表等可能无法正确显示
      </p>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: var(--secondary-color);
        color: var(--primary-color);
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        height: var(--height-button);
      ">了解</button>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      z-index: 99998;
    " onclick="this.parentElement.remove();"></div>
  `;

  const tipElement = document.createElement('div');
  tipElement.className = 'cherry';
  tipElement.innerHTML = tipHTML;
  document.body.appendChild(tipElement);
}
