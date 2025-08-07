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
 * 检查是否支持window.print方法
 * @returns {boolean} 是否支持打印功能
 */
export function supportsPrint() {
  return typeof window !== 'undefined' && typeof window.print === 'function';
}

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
  if (!supportsPrint()) {
    console.warn('当前环境不支持打印功能，无法导出PDF');
    return;
  }

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

    // 设置元素样式以确保完整渲染
    cherryPreviewer.style.position = 'relative';
    cherryPreviewer.style.overflow = 'visible';
    cherryPreviewer.style.height = 'auto';
    cherryPreviewer.style.maxHeight = 'none';

    html2canvas(cherryPreviewer, {
      allowTaint: true,
      useCORS: true,
      scale: 2, // 提高图片质量
      height: cherryPreviewer.scrollHeight,
      width: cherryPreviewer.clientWidth,
      scrollY: 0,
      scrollX: 0,
      logging: false,
      backgroundColor: '#ffffff',
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        fileDownload(imgData, fileName);
        thenFinish();
      })
      .catch((error) => {
        console.error('导出长图失败:', error);
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
 * 导出Word文档
 * @param {HTMLElement} previewDom 预览区域的dom
 * @param {String} fileName 导出Word文件名
 */
export function exportWordFile(previewDom, fileName) {
  getReadyToExport(previewDom, (/** @type {HTMLElement}*/ cherryPreviewer, /** @type {function}*/ thenFinish) => {
    // 创建Word兼容的HTML内容
    const wordCompatibleHTML = createWordCompatibleHTML(cherryPreviewer, fileName);

    // 使用Blob创建Word文件
    const blob = new Blob([wordCompatibleHTML], {
      type: 'application/msword;charset=utf-8',
    });

    // 创建下载链接
    const aLink = document.createElement('a');
    aLink.style.display = 'none';
    aLink.href = URL.createObjectURL(blob);
    aLink.download = `${fileName}.doc`; // 使用.doc格式，Word可以直接打开
    document.body.appendChild(aLink);
    aLink.click();
    document.body.removeChild(aLink);

    thenFinish();
  });
}

/**
 * 创建Word兼容的HTML内容
 */
function createWordCompatibleHTML(cherryPreviewer, fileName) {
  // Word兼容的HTML模板
  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>90</w:Zoom>
      <w:DoNotPromptForConvert/>
      <w:DoNotShowInsertionsAndDeletions/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* 基础样式 */
    body { 
      font-family: "Times New Roman", "宋体", serif; 
      font-size: 12pt;
      line-height: 1.6;
      margin: 1in;
      color: #000;
    }
    
    /* 标题样式 */
    h1 { font-size: 18pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    h2 { font-size: 16pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    h3 { font-size: 14pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    h4 { font-size: 13pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    h5 { font-size: 12pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    h6 { font-size: 11pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    
    /* 段落样式 */
    p { margin: 6pt 0; text-align: justify; }
    
    /* 列表样式 */
    ul, ol { margin: 6pt 0; padding-left: 24pt; }
    li { margin: 3pt 0; }
    
    /* 表格样式 */
    table { 
      border-collapse: collapse; 
      width: 100%; 
      margin: 12pt 0;
      border: 1pt solid #000;
    }
    th, td { 
      border: 1pt solid #000; 
      padding: 6pt; 
      text-align: left;
      vertical-align: top;
    }
    th { 
      background-color: #f0f0f0; 
      font-weight: bold; 
    }
    
    /* 代码样式 */
    code { 
      font-family: "Courier New", monospace; 
      background-color: #f5f5f5;
      padding: 2pt;
      border: 1pt solid #ddd;
    }
    pre { 
      font-family: "Courier New", monospace; 
      background-color: #f5f5f5;
      padding: 12pt;
      border: 1pt solid #ddd;
      margin: 12pt 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    /* 引用样式 */
    blockquote {
      border-left: 4pt solid #ddd;
      margin: 12pt 0 12pt 24pt;
      padding: 0 12pt;
      color: #666;
      font-style: italic;
    }
    
    /* 链接样式 */
    a { color: #0000ff; text-decoration: underline; }
    
    /* 图片样式 */
    img { 
      max-width: 100%; 
      height: auto;
      margin: 6pt 0;
    }
    
    /* 手风琴样式 */
    details { 
      margin: 12pt 0; 
      border: 1pt solid #ddd;
      padding: 6pt;
    }
    summary { 
      font-weight: bold; 
      cursor: pointer;
      margin-bottom: 6pt;
    }
    
    /* 隐藏Cherry特有的元素 */
    .cherry-mask-code-block,
    .expand-btn,
    .ch-icon {
      display: none !important;
    }
    
    /* 强制展开的代码块 */
    .cherry-code-expand pre {
      display: block !important;
    }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 24pt;">
    <h1>${fileName}</h1>
    <p style="font-size: 10pt; color: #666;">
      导出时间: ${new Date().toLocaleString('zh-CN')}
    </p>
    <hr style="border: none; border-top: 1pt solid #ddd; margin: 12pt 0;">
  </div>
  
  ${cleanHTMLForWord(cherryPreviewer.innerHTML)}
</body>
</html>`;
}

/**
 * 清理HTML内容，使其更适合Word
 */
function cleanHTMLForWord(html) {
  return (
    html
      // 移除Cherry特有的类和属性
      .replace(/class="cherry-[^"]*"/g, '')
      .replace(/data-[^=]*="[^"]*"/g, '')
      // 强制展开所有手风琴
      .replace(/<details([^>]*)>/g, '<details$1 open>')
      // 清理代码块，确保内容可见
      .replace(/class="cherry-code-unExpand"/g, 'class="cherry-code-expand"')
      // 移除多余的空行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 确保图片有alt属性
      .replace(/<img([^>]*?)>/g, (match, attrs) => {
        if (!attrs.includes('alt=')) {
          return `<img${attrs} alt="图片">`;
        }
        return match;
      })
  );
}
