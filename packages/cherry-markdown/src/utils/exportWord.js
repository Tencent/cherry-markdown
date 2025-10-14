/**
 * 导出 Word 文件
 */
import { getSvgString } from './svgUtils';
import Logger from '@/Logger';

// 统一创建图片节点
function createImg(dataUrl, width, height, display = 'block') {
  const img = document.createElement('img');
  img.src = dataUrl;
  img.width = width;
  img.height = height;
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  img.style.display = display;
  return img;
}

/**
 * 仅处理 mermaid 与数学块两类容器
 * - Mermaid: [data-type="mermaid"]
 * - 数学块: [data-type="mathBlock"]
 */
const TARGET_SELECTORS = ['[data-type="mermaid"]', '[data-type="mathBlock"]'];

/**
 * SVG 栅格化
 * @param {SVGSVGElement} svg
 * @param {number} width
 * @param {number} height
 * @returns {Promise<string>} dataURL
 */
function rasterizeSVGToPNG(svg, width, height) {
  return new Promise((resolve, reject) => {
    try {
      const svgString = getSvgString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const img = new Image();
      img.onload = () => {
        try {
          ctx && ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          Logger.log('SVG 绘制到 Canvas 失败：', err);
          reject(err);
        }
      };
      img.onerror = (e) => {
        Logger.log('SVG 图片加载失败：', e);
        reject(e);
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 将容器内的 <svg> 转换为 PNG 图片
 * @param {Element} el - 包含 svg 的节点
 * @param {('block'|'inline-block'|'inline')} display - 生成 img 的 display
 * @returns {Promise<boolean>} - 是否成功
 */
async function replaceSvgContainerWithImage(el, display) {
  const svg = el.querySelector('svg');
  if (!(svg instanceof SVGSVGElement)) return false;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dataUrl = await rasterizeSVGToPNG(svg, width, height);
  const img = createImg(dataUrl, width, height, display);
  el.replaceWith(img);
  return true;
}

/**
 * 在隐藏容器中渲染 HTML，并将指定元素转为 base64 图片
 * @param {string} htmlString - 需要处理的 HTML 片段（预览区的 innerHTML）
 * @returns {Promise<string>} - 处理后的 HTML 字符串
 */
export async function preprocessHTMLForWord(htmlString) {
  const wrapper = document.createElement('div');

  // 将容器放到视窗外
  Object.assign(wrapper.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    width: `${document.documentElement.clientWidth || document.body.clientWidth || 1000}px`,
  });

  const container = document.createElement('div');
  container.className = 'cherry-export-word-container';
  container.innerHTML = htmlString;
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  const nodes = Array.from(container.querySelectorAll(TARGET_SELECTORS.join(',')));

  // 逐个替换图片
  for (const el of nodes) {
    try {
      const dataType = el.getAttribute('data-type');
      // 公式 `inline-block` ; Mermaid `block`
      const display = dataType === 'mathBlock' ? 'inline-block' : 'block';
      await replaceSvgContainerWithImage(el, display);
    } catch (err) {
      // 单个节点失败不影响整体导出，跳过
      Logger.log('[exportWord] 处理节点失败，已跳过该节点：', err);
    }
  }

  const processed = container.innerHTML;
  wrapper.remove();

  return processed;
}

/**
 * 导出到 Word (通过复制 HTML 到剪贴板)
 * @param {String} HTMLText HTML文本
 * @param {String} fileName 文件名
 */
export async function exportWordFile(HTMLText, fileName) {
  // 创建完整的HTML文档结构，包含样式，确保在Word中有更好的显示效果
  // 导出前对特殊元素进行位图化处理（mermaid、公式等）
  let processedHTML = HTMLText;
  try {
    processedHTML = await preprocessHTMLForWord(HTMLText);
  } catch (e) {
    // 预处理失败不影响整体导出，降级为原始 HTML
    Logger.warn('[exportWord] 预处理失败，降级为原始 HTML：', e);
  }

  const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
${processedHTML}
</body>
</html>`;

  if (navigator.clipboard && navigator.clipboard.write) {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([fullHTML], { type: 'text/html' }),
    });
    await navigator.clipboard.write([clipboardItem]);
    showExportWordTip();
  } else {
    throw new Error('浏览器未授权粘贴板或不支持剪贴板写入');
  }
}

// 显示导出 Word 的操作提示
function showExportWordTip() {
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
      box-shadow: var(--shadow-lg);
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
        部分样式可能会丢失或变更
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

export default { preprocessHTMLForWord, exportWordFile };
