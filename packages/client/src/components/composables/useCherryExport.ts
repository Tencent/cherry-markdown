import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import html2canvas from 'html2canvas';
import { dismissNotify, notifyError, notifyInfo, notifyLoading, notifySuccess } from '../../utils/notifications';
import { useFileStore } from '../../store/modal/file';

/**
 * Tauri (WebView2/WKWebView) 环境下，浏览器原生的 <a download> 语义
 * 不会触发系统下载器，主包 utils/export.js 里那套 Blob + a.click 的方案
 * 全部会静默失效；window.print 在 Tauri 里也没有真正的打印对话框。
 *
 * 因此客户端需要自实现导出：
 * - 文本类（markdown / html）走 dialog.save + fs.writeTextFile
 * - 图片长图走 html2canvas 出 Blob，再 fs.writeFile（Uint8Array）
 * - PDF 目前 Tauri 没有稳定的原生 PDF 打印，先降级为导出为 HTML，
 *   并提示用户可用系统浏览器打开后另存为 PDF
 * - Word 复用主包剪贴板方案的思路：写 text/html 到剪贴板，让用户 Ctrl+V
 */

export type ExportType = 'pdf' | 'screenShot' | 'markdown' | 'html' | 'word';

interface CherryLikePreviewer {
  options: { previewerCache: { html: string } };
  lazyLoadImg: { changeDataSrc2Src(html: string): string };
  isPreviewerHidden(): boolean;
  getDomContainer(): HTMLElement;
  refresh(html: string): void;
  getValue(): string;
}

interface CherryLikeInstance {
  previewer: CherryLikePreviewer;
  getMarkdown(): string;
  getFirstLineText?(fallback?: string): string;
}

/** 文件名清洗：去掉 Windows/Unix 非法字符、限制长度、去首尾空白 */
const sanitizeFileName = (raw: string): string => {
  const trimmed = raw.trim().replace(/[\\/:*?"<>|]/g, '_');
  return trimmed.slice(0, 80);
};

/** 从完整路径中提取不含扩展名的 basename，例如 `D:/foo/bar.md` → `bar` */
const basenameWithoutExt = (fullPath: string): string => {
  const base = fullPath.split(/[\\/]/).pop() ?? '';
  // 只剥离最后一个 `.` 之后的扩展名，且必须存在名字部分（避免 `.gitignore` 变成空串）
  const dotIndex = base.lastIndexOf('.');
  if (dotIndex > 0) return base.slice(0, dotIndex);
  return base;
};

/**
 * 推断默认导出文件名，按优先级：
 * 1. 当前已打开文件的 basename（去掉扩展名）—— 最贴合用户预期
 * 2. Cherry 提供的 getFirstLineText（若可用）
 * 3. Markdown 首行去掉 `#` 后的内容
 * 4. 兜底 `cherry-export`
 */
const inferFileName = (cherry: CherryLikeInstance): string => {
  // 1) 已打开文件：直接用文件名
  try {
    const fileStore = useFileStore();
    const currentPath = fileStore.currentFilePath;
    if (currentPath) {
      const name = sanitizeFileName(basenameWithoutExt(currentPath));
      if (name) return name;
    }
  } catch {
    // pinia 未初始化或非 vue 上下文，忽略并回退到首行内容
  }

  // 2) Cherry 首行 API
  try {
    if (typeof cherry.getFirstLineText === 'function') {
      const name = sanitizeFileName(cherry.getFirstLineText('') || '');
      if (name) return name;
    }
  } catch {
    // ignore
  }

  // 3) Markdown 首行（去掉标题符号）
  const md = cherry.getMarkdown?.() ?? '';
  const firstLine = md.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const cleaned = sanitizeFileName(firstLine.replace(/^#+\s*/, ''));
  if (cleaned) return cleaned;

  // 4) 兜底
  return 'cherry-export';
};

/**
 * 与主包 hooks/Export.js 一致的预处理：
 * 关闭时用缓存 HTML，否则取当前预览 DOM，并把 data-src 还原为 src，
 * 最后刷新一次预览，避免懒加载图片被导出为占位图。
 */
const preparePreviewer = (previewer: CherryLikePreviewer): void => {
  let html = previewer.isPreviewerHidden()
    ? previewer.options.previewerCache.html
    : previewer.getDomContainer().innerHTML;
  html = previewer.lazyLoadImg.changeDataSrc2Src(html);
  previewer.refresh(html);
};

const askSavePath = async (fileName: string, ext: string, description: string): Promise<string | null> => {
  const path = await save({
    defaultPath: `${fileName}.${ext}`,
    filters: [{ name: description, extensions: [ext] }],
  });
  return path ?? null;
};

/**
 * 收集当前文档里所有 <style>/<link rel=stylesheet> 的 CSS 文本。
 * - 同源样式表：通过 cssRules 拿到规则文本，直接内联到导出的 <style>；
 * - 跨域样式表（例如 CDN 的 KaTeX）：访问 cssRules 会抛 SecurityError，
 *   降级为一条 <link href="...">，让离线打开时至少浏览器可以尝试联网拉取。
 *
 * 这样导出的 HTML 是「自包含」的：拷给别人在任意浏览器直接打开都是 Cherry 的观感。
 */
const collectDocumentStyles = (): string => {
  const chunks: string[] = [];
  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      const cssText = Array.from(rules)
        .map((rule) => rule.cssText)
        .join('\n');
      if (cssText) chunks.push(`<style>\n${cssText}\n</style>`);
    } catch {
      // 跨域样式表：cssRules 不可读，降级为外链 <link>
      if (sheet.href) {
        chunks.push(`<link rel="stylesheet" href="${sheet.href}">`);
      }
    }
  }
  return chunks.join('\n');
};

const buildFullHtmlDocument = (bodyHtml: string, title: string, previewDom?: HTMLElement | null): string => {
  const lang = typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en';
  const styles = collectDocumentStyles();

  // 保留 previewer 及其 .cherry 祖先容器上的类名（主题、宽度模式等），
  // 否则 .cherry .cherry-previewer xxx 这种带祖先选择器的规则会全部失效，
  // 导出的 HTML 主题（暗色/自定义主题）也会掉。
  //
  // 特别注意：当预览区在编辑器里被隐藏（纯编辑模式）时，previewDom.className 会带上
  // `cherry-previewer--hidden`，而主包 CSS 对这个类是 `width:0; display:none`，
  // 直接写进导出的 HTML 会导致用户打开就是白屏 —— 必须剔除。
  // 顺带把 `cherry-previewer--full` 也去掉（半屏/全屏切换的运行时状态），避免样式漂移。
  const rawPreviewerClass = previewDom?.className ?? 'cherry-previewer';
  const previewerClass =
    rawPreviewerClass
      .replace(/\bcherry-previewer--hidden\b/g, '')
      .replace(/\bcherry-previewer--full\b/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'cherry-previewer';
  const cherryRoot = previewDom?.closest('.cherry');
  const cherryClass = cherryRoot?.className ?? 'cherry';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${styles}
<style>
  /* 导出后没有编辑器双栏布局，让预览区自适应全宽并撑开高度 */
  html, body { margin: 0; padding: 0; background: #fff; }
  body { display: flex; justify-content: center; overflow-y: auto; }
  .${cherryClass.split(/\s+/).join('.')} { width: 100%; max-width: 960px; margin: 0 auto; }
  .${previewerClass.split(/\s+/).filter(Boolean).join('.') || 'cherry-previewer'} {
    width: 100% !important;
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    padding: 24px !important;
    box-sizing: border-box;
    position: static !important;
    transform: none !important;
  }
</style>
</head>
<body>
<div class="${cherryClass}">
  <div class="${previewerClass}">
${bodyHtml}
  </div>
</div>
</body>
</html>`;
};

const exportMarkdown = async (cherry: CherryLikeInstance, fileName: string): Promise<void> => {
  const path = await askSavePath(fileName, 'md', 'Markdown');
  if (!path) return;
  await writeTextFile(path, cherry.getMarkdown());
  notifySuccess(`已导出 Markdown：${path}`);
};

const exportHtml = async (cherry: CherryLikeInstance, fileName: string): Promise<void> => {
  const path = await askSavePath(fileName, 'html', 'HTML');
  if (!path) return;
  // collectDocumentStyles 会遍历所有 styleSheet.cssRules，大文档 + 主题较多时可能耗时 100~500ms，
  // 加 loading 避免用户以为按钮没响应；快时 toast 一闪而过也不影响体验。
  const loadingId = notifyLoading('正在生成 HTML…');
  try {
    const previewDom = cherry.previewer.getDomContainer();
    const fullHtml = buildFullHtmlDocument(cherry.previewer.getValue(), fileName, previewDom);
    await writeTextFile(path, fullHtml);
    notifySuccess(`已导出 HTML：${path}`);
  } finally {
    dismissNotify(loadingId);
  }
};

/**
 * PDF：Tauri 使用系统 WebView（Windows=WebView2、macOS=WKWebView），
 * 二者都支持 window.print()，会弹出原生打印对话框，用户可选择「Microsoft Print to PDF」
 * 或「另存为 PDF」。因此这里直接复用主包 exportPDF 的实现思路，不做落盘。
 */
const exportPdf = (cherry: CherryLikeInstance, fileName: string): void => {
  const previewDom = cherry.previewer.getDomContainer();
  if (!previewDom) {
    notifyError('未找到预览区域，无法打印');
    return;
  }

  const oldTitle = document.title;
  document.title = fileName;

  // 克隆预览区到 body，保证打印时的完整布局
  // 纯编辑模式下 `cherry-previewer--hidden` 会把预览设为 display:none，必须剔除
  const clone = previewDom.cloneNode(true) as HTMLElement;
  clone.className = clone.className
    .replace(/\bcherry-previewer--hidden\b/g, '')
    .replace(/\bcherry-previewer--full\b/g, '')
    .trim();
  clone.style.setProperty('display', 'block', 'important');
  clone.style.setProperty('visibility', 'visible', 'important');
  clone.style.width = '100%';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';

  const mmls = clone.querySelectorAll('mjx-assistive-mml');
  mmls.forEach((el) => {
    if (el instanceof HTMLElement) el.style.setProperty('visibility', 'hidden');
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'cherry-export-wrapper';
  const cherryInstance = previewDom.closest('.cherry');
  if (cherryInstance) {
    wrapper.className = `${wrapper.className} ${cherryInstance.className}`;
  }
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'visible';

  // 开启打印专用样式（主包 CSS 里 cherry-export-only 类下会隐藏非导出内容）
  const htmlEl = document.documentElement;
  const hadExportOnly = htmlEl.classList.contains('cherry-export-only');
  if (!hadExportOnly) htmlEl.classList.add('cherry-export-only');

  // 强制展开所有折叠代码块
  clone.innerHTML = clone.innerHTML.replace(/class="cherry-code-unExpand("| )/g, 'class="cherry-code-expand$1');

  // ── 去掉打印 PDF 的页眉/页脚 ──
  // 系统打印对话框默认会在页边加页眉（标题、URL、日期）和页脚（页码），
  // 前端唯一能主动控制的手段就是 @page { margin: 0 } —— 把纸张边距压到 0，
  // 浏览器就没有位置渲染页眉页脚，最终 PDF 里也就看不见。
  // 内容紧贴纸边不美观，用 .cherry-export-wrapper 的内边距代替原本的页边距。
  const printStyle = document.createElement('style');
  printStyle.id = 'cherry-print-page-style';
  printStyle.textContent = `
    @media print {
      @page { margin: 0; size: auto; }
      html, body { margin: 0 !important; padding: 0 !important; }
      .cherry-export-wrapper { padding: 12mm 14mm !important; box-sizing: border-box; }
    }
  `;
  document.head.appendChild(printStyle);

  try {
    window.print();
  } finally {
    wrapper.remove();
    document.body.style.overflow = bodyOverflow;
    if (!hadExportOnly) htmlEl.classList.remove('cherry-export-only');
    printStyle.remove();
    document.title = oldTitle;
  }
};

const canvasToUint8Array = (canvas: HTMLCanvasElement): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('canvas.toBlob 返回空'));
        return;
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch((err: unknown) => reject(err instanceof Error ? err : new Error(String(err))));
    }, 'image/png');
  });

/**
 * 把 Blob 读成 data URL（base64），用于替换跨域 <img> 的 src。
 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader 读取失败'));
    reader.readAsDataURL(blob);
  });

/**
 * 用 <img> 加载图片，然后画到 canvas 上转成 data URL。
 * 前提：图片必须能通过 CORS，否则 canvas 会被 taint，toDataURL 也会抛。
 * 作为 fetch 失败后的兜底 —— 有些服务器不支持 fetch 的 CORS 预检，
 * 但对 <img crossorigin="anonymous"> 的直接请求会返回 Access-Control-Allow-Origin。
 */
const imgToDataUrlViaCanvas = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('2d ctx 创建失败'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        // 若图片跨域且服务器没返回 CORS 头，这里会抛 SecurityError
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error(`<img> 加载失败: ${src}`));
    img.src = src;
  });

/**
 * 把单张图片抓成 data URL，按可靠性从高到低尝试多种策略：
 *
 *   ① fetch(mode:'cors')  —— 服务器支持 CORS 时最快，能保留原始 MIME
 *   ② fetch(mode:'no-cors') —— 对方不支持 CORS 预检时的兜底（能拿 blob 但 type 可能为空）
 *   ③ <img crossorigin> + canvas.toDataURL —— 部分服务器只对 <img> 的 CORS 请求友好
 *
 * 说明：
 * - GitHub 用户附件（github.com/user-attachments/...）会 302 到 objects.githubusercontent.com，
 *   两跳都不带 Access-Control-Allow-Origin，所以 ① 大概率失败；
 * - ② 拿到的是 opaque response，某些浏览器 blob() 结果可用、type 为空，转成 dataURL 后仍能被 <img> 加载；
 * - ③ 兜底能覆盖对 <img crossorigin> 友好但对 fetch CORS 不友好的极少数场景；
 * - 三条都不行时保留原 src，让 html2canvas 用 useCORS 二次尝试（大概率仍失败但至少不阻断）。
 */
const fetchImageAsDataUrl = async (src: string): Promise<string | null> => {
  // ① 标准 CORS fetch
  try {
    const resp = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (resp.ok) {
      const blob = await resp.blob();
      if (blob.size > 0) return await blobToDataUrl(blob);
    }
  } catch {
    // 静默降级
  }

  // ② no-cors fetch：拿到 opaque response，body 不可读但某些浏览器仍能 .blob()
  try {
    const resp = await fetch(src, { mode: 'no-cors', credentials: 'omit' });
    const blob = await resp.blob();
    // opaque response 的 type 常为 ''、size 可能为 0；size>0 时可用
    if (blob.size > 0) {
      const dataUrl = await blobToDataUrl(blob);
      // 若原 blob type 为空，dataUrl 会是 "data:application/octet-stream;base64,..."
      // 浏览器一般能自动嗅探，但为了 html2canvas 稳妥，改写 mime 为通用图片类型
      if (dataUrl.startsWith('data:application/octet-stream') || dataUrl.startsWith('data:;')) {
        return dataUrl.replace(/^data:[^;]*/, 'data:image/png');
      }
      return dataUrl;
    }
  } catch {
    // 静默降级
  }

  // ③ <img crossorigin> + canvas 兜底
  try {
    return await imgToDataUrlViaCanvas(src);
  } catch {
    return null;
  }
};

/**
 * 把 clone 内所有 <img> 的远程/asset 图片抓成 data URL，塞回 src。
 * 这样 html2canvas 绘制时全部走 same-origin 的 data URI，不会污染 canvas，
 * 后续 toBlob 才能成功。
 *
 * 注意：
 * - 已是 data:/blob: 协议的 <img> 直接跳过；
 * - 抓取失败的图片保留原 src，让 html2canvas 走 useCORS 兜底（大不了留白但不会中断整个导出）。
 */
const inlineImagesAsDataURL = async (root: HTMLElement): Promise<void> => {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (!src) return;
      if (src.startsWith('data:') || src.startsWith('blob:')) return;
      const dataUrl = await fetchImageAsDataUrl(src);
      if (dataUrl) {
        img.setAttribute('src', dataUrl);
        // 移除 crossorigin，避免 html2canvas 再次以 cors 模式加载 data URL 反而报错
        img.removeAttribute('crossorigin');
      }
      // 抓取失败则保留原 src，html2canvas 侧走 useCORS 兜底
    }),
  );
};

const exportScreenShot = async (cherry: CherryLikeInstance, fileName: string): Promise<void> => {
  const previewDom = cherry.previewer.getDomContainer();
  if (!previewDom) {
    notifyError('未找到预览区域，无法截图');
    return;
  }

  const path = await askSavePath(fileName, 'png', 'PNG');
  if (!path) return;

  // 长图导出主要慢在：图片跨域抓取（inlineImagesAsDataURL）+ 分片 html2canvas 渲染；
  // 长文档可能 5~30s。用持久 toast 提示，finally 里主动关闭。
  const loadingId = notifyLoading('正在生成长图，请稍候…');

  // 克隆一份预览区到 body，避免影响原始 DOM 布局
  const clone = previewDom.cloneNode(true) as HTMLElement;
  // 预览区在纯编辑模式下会带上 `cherry-previewer--hidden`（CSS: width:0; display:none），
  // 克隆后必须先剔除该类，否则 clone 依然是 display:none，html2canvas 什么都截不到。
  // 同时剔除 `--full` 避免运行时状态干扰。
  clone.className = clone.className
    .replace(/\bcherry-previewer--hidden\b/g, '')
    .replace(/\bcherry-previewer--full\b/g, '')
    .trim();
  // 必须用 setProperty(..., 'important')，否则会被主包 `.cherry .cherry-previewer { max-height: ... }` 覆盖
  // 显式 display:block 兜底：万一父级还有其他隐藏样式选择器（如 [hidden] 属性），保证 clone 可见
  clone.style.setProperty('display', 'block', 'important');
  clone.style.setProperty('visibility', 'visible', 'important');
  clone.style.setProperty('width', '100%', 'important');
  clone.style.setProperty('height', 'auto', 'important');
  clone.style.setProperty('max-height', 'none', 'important');
  clone.style.setProperty('min-height', 'auto', 'important');
  clone.style.setProperty('overflow', 'visible', 'important');

  const wrapper = document.createElement('div');
  wrapper.className = 'cherry-export-wrapper';
  const cherryInstance = previewDom.closest('.cherry');
  if (cherryInstance) {
    wrapper.className = `${wrapper.className} ${cherryInstance.className}`;
  }

  // ── wrapper 宽度计算 ──
  // 纯编辑模式下 previewDom 是 display:none + width:0，clientWidth/offsetWidth 都是 0，
  // 若直接用 0 会让 clone 缩成极窄单列，导出图变成一条几像素宽的图。
  // 按优先级降级：
  //   1. previewer 自身尺寸（默认场景，双栏模式下总是有效）
  //   2. .cherry 容器宽度的一半（双栏布局下预览区约占一半）
  //   3. .cherry 容器全宽（若容器本身也很窄则整片使用）
  //   4. 兜底 800px（合理的可读宽度）
  const previewerWidth = previewDom.clientWidth || previewDom.offsetWidth;
  const cherryWidth =
    cherryInstance instanceof HTMLElement ? cherryInstance.clientWidth || cherryInstance.offsetWidth : 0;
  const wrapperWidth =
    previewerWidth || (cherryWidth ? Math.max(Math.floor(cherryWidth / 2), 480) : 0) || cherryWidth || 800;

  // 让 wrapper 脱离常规布局：绝对定位到视口外，不影响页面且不受父容器高度约束，
  // 这样 clone 展开成完整内容高度时不会被裁到视口，也不会撑大页面滚动。
  // 注意：不能用 visibility:hidden / display:none，否则 html2canvas 会跳过内容绘制导致纯白图；
  // 用 left:-99999px 把它挪到屏幕外，DOM 依然是"可见的"，html2canvas 才能正确拿到布局与样式。
  wrapper.style.setProperty('position', 'absolute');
  wrapper.style.setProperty('left', '-99999px');
  wrapper.style.setProperty('top', '0');
  wrapper.style.setProperty('width', `${wrapperWidth}px`);
  wrapper.style.setProperty('height', 'auto');
  wrapper.style.setProperty('max-height', 'none');
  wrapper.style.setProperty('overflow', 'visible');
  wrapper.style.setProperty('pointer-events', 'none');
  wrapper.style.setProperty('z-index', '-1');
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'visible';

  try {
    // 展开所有折叠代码块，去掉 audio/video 标签，避免 html2canvas 报 taint
    clone.innerHTML = clone.innerHTML
      .replace(/<audio [^>]+?>([^\n]*?)<\/audio>/g, '$1')
      .replace(/<video [^>]+?>([^\n]*?)<\/video>/g, '$1')
      .replace(/class="cherry-code-unExpand("| )/g, 'class="cherry-code-expand$1');

    // ── 让代码块自动换行 ──
    // 长图导出时不存在横向滚动，超宽的代码会被右侧裁掉。
    // 主包 markdown.scss 里对 code[class*="language-"].wrap 定义了 white-space: pre-wrap，
    // 给 <code> 加上 wrap 类即可复用主包换行样式；同时把外层 codeBlock 容器/pre 的 overflow-x
    // 覆盖为 visible、white-space 兜底为 pre-wrap，保证不同主题下都能正确折行。
    clone.querySelectorAll<HTMLElement>('code[class*="language-"]').forEach((code) => {
      code.classList.add('wrap');
      code.style.setProperty('white-space', 'pre-wrap', 'important');
      code.style.setProperty('word-break', 'break-word', 'important');
    });
    clone.querySelectorAll<HTMLElement>('div[data-type="codeBlock"], pre').forEach((el) => {
      el.style.setProperty('overflow-x', 'visible', 'important');
      el.style.setProperty('white-space', 'pre-wrap', 'important');
      el.style.setProperty('word-break', 'break-word', 'important');
    });

    // ── 修正行内代码在长图中的错位 ──
    // 行内 <code> 默认是 inline 元素，padding/border/background 不会计入行高，
    // html2canvas 对这种「视觉溢出行盒」的行内元素渲染不精确，会出现背景比字高、
    // 位置偏移的问题。把行内代码在 clone 上改成 inline-block + 显式 line-height，
    // 让 padding/背景框与文字一体渲染，同时用 vertical-align:middle 与相邻文字对齐。
    // 注意：只处理 :not(pre) > code，避免影响代码块内部的 <code>。
    clone.querySelectorAll<HTMLElement>('code').forEach((code) => {
      // 跳过代码块内部的 code（父级是 pre）
      if (code.parentElement?.tagName === 'PRE') return;
      code.style.setProperty('display', 'inline-block', 'important');
      code.style.setProperty('line-height', '1.4', 'important');
      code.style.setProperty('vertical-align', 'middle', 'important');
      code.style.setProperty('padding', '0 0.3em', 'important');
      code.style.setProperty('box-sizing', 'border-box', 'important');
    });

    // 强制回流，确保 scrollWidth/scrollHeight 反映的是「已展开完整内容」的尺寸
    void clone.offsetHeight;

    // 用 scrollWidth/scrollHeight（完整内容尺寸）而不是 clientWidth/clientHeight（可视区尺寸），
    // 否则超出视口的部分会被 html2canvas 直接裁掉。
    const fullWidth = Math.max(clone.scrollWidth, clone.clientWidth);
    const fullHeight = Math.max(clone.scrollHeight, clone.clientHeight);

    // 先把所有跨域图片转成 data URL，避免 canvas 被污染（tainted），
    // 否则后续 canvas.toBlob 会抛 SecurityError: Tainted canvases may not be exported。
    await inlineImagesAsDataURL(clone);

    // ── 分片截图 + 主画布拼接 ──
    // 单张 canvas 存在硬性单边像素上限（约 32767，保守取 16384），
    // 内容很长时，无论怎么调 scale 都会撞墙 —— 若把 scale 压低到 <1，
    // 导出图的分辨率甚至低于原始 CSS 像素，放大就会模糊。
    //
    // 解决办法：把长内容按高度切成 N 段，每段单独 html2canvas（保持高 scale），
    // 再画到一张主 canvas 上。这样任意长度文档都能保持稳定的清晰度。
    const MAX_CANVAS_SIDE = 16384;
    const MAX_CANVAS_AREA = 250_000_000;
    const TARGET_SCALE_RAW = Math.max(window.devicePixelRatio || 1, 2);

    // 主画布也受面积上限约束：若 fullWidth*fullHeight*scale² 超过 MAX_CANVAS_AREA，
    // 需要整体压低 scale。宽度还需 ≤ MAX_CANVAS_SIDE。
    const maxScaleByWidth = MAX_CANVAS_SIDE / fullWidth;
    const maxScaleByArea = Math.sqrt(MAX_CANVAS_AREA / (fullWidth * fullHeight));
    const scale = Math.max(1, Math.min(TARGET_SCALE_RAW, maxScaleByWidth, maxScaleByArea));

    // 每片在 CSS 像素下的最大高度：sliceHeight * scale ≤ MAX_CANVAS_SIDE
    // 留一点余量避免边界舍入；如果单片就够放整个内容则只截一片。
    const sliceHeight = Math.max(1, Math.floor(MAX_CANVAS_SIDE / scale) - 4);
    const sliceCount = Math.ceil(fullHeight / sliceHeight);

    // 主 canvas 用来拼接所有片段
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = Math.round(fullWidth * scale);
    mainCanvas.height = Math.round(fullHeight * scale);
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) throw new Error('无法创建 2d 上下文');

    const commonOptions = {
      allowTaint: false,
      useCORS: true,
      backgroundColor: null,
      scale,
      width: fullWidth,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    } as const;

    for (let i = 0; i < sliceCount; i += 1) {
      const y = i * sliceHeight;
      const h = Math.min(sliceHeight, fullHeight - y);
      // html2canvas 的 y/height 用于从源 DOM 裁切该段区域，
      // 每一片单独渲染，output canvas 尺寸约为 fullWidth*scale × h*scale，
      // 保证在单边上限内。
      const sliceCanvas = await html2canvas(clone, {
        ...commonOptions,
        y,
        height: h,
      });
      // 把片段贴到主 canvas 的对应位置
      ctx.drawImage(sliceCanvas, 0, Math.round(y * scale));
    }

    const bytes = await canvasToUint8Array(mainCanvas);
    await writeFile(path, bytes);
    notifySuccess(`已导出长图：${path}`);
  } finally {
    wrapper.remove();
    document.body.style.overflow = bodyOverflow;
    dismissNotify(loadingId);
  }
};

/**
 * 通过 document.execCommand('copy') + copy 事件劫持写富文本到剪贴板。
 * 这是老 API，但在 Tauri WebView 里比 navigator.clipboard.write 可靠得多：
 *   - 不受「页面必须 focused」限制（execCommand 是同步 API）
 *   - 不依赖 tauri-plugin-clipboard-manager 权限
 *   - Chromium/WebKit 全支持
 *
 * 关键：在 copy 事件内 setData('text/html', ...) + preventDefault()，
 * 浏览器会把 text/html 写入系统剪贴板，Word 粘贴时会识别为富文本。
 * 同时写一份 text/plain 兜底，避免某些应用只识别纯文本。
 */
const copyHtmlViaExecCommand = (html: string): boolean => {
  // 用一个隐藏的 contenteditable 元素承载 selection，
  // 触发 copy 事件时才有有效的选区可以复制。
  const container = document.createElement('div');
  container.setAttribute('contenteditable', 'true');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  const savedRanges: Range[] = [];
  if (selection) {
    for (let i = 0; i < selection.rangeCount; i += 1) savedRanges.push(selection.getRangeAt(i));
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection.addRange(range);
  }

  // 临时监听 copy 事件，把 HTML 写入 clipboardData
  const onCopy = (event: ClipboardEvent) => {
    if (event.clipboardData) {
      event.clipboardData.setData('text/html', html);
      event.clipboardData.setData('text/plain', container.innerText);
      event.preventDefault();
    }
  };
  document.addEventListener('copy', onCopy, true);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }

  document.removeEventListener('copy', onCopy, true);
  // 还原原有选区
  if (selection) {
    selection.removeAllRanges();
    savedRanges.forEach((r) => selection.addRange(r));
  }
  container.remove();
  return ok;
};

/**
 * 通过剪贴板方式复制富文本 HTML —— 作为 .docx 落盘失败时的兜底路径。
 * 按优先级降级：
 *   1. navigator.clipboard.write([ClipboardItem])：新 API，对权限/焦点敏感
 *   2. document.execCommand('copy') + copy 事件劫持：老 API，Tauri WebView 里最稳
 *   3. navigator.clipboard.writeText：兜底纯文本
 */
const copyWordHtmlToClipboard = async (html: string): Promise<boolean> => {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([html], { type: 'text/plain' });
      const item = new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob });
      await navigator.clipboard.write([item]);
      return true;
    } catch (error) {
      console.warn('[exportWord] clipboard.write failed, fallback to execCommand', error);
    }
  }
  if (copyHtmlViaExecCommand(html)) return true;
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch {
    return false;
  }
};

/** 把 asBlob 返回的产物（浏览器 Blob 或 Node Buffer）统一转成 Uint8Array，方便 fs.writeFile 落盘。 */
const docxResultToUint8Array = async (result: unknown): Promise<Uint8Array> => {
  if (typeof Blob !== 'undefined' && result instanceof Blob) {
    return new Uint8Array(await result.arrayBuffer());
  }
  if (result instanceof Uint8Array) return result;
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  // Node Buffer：runtime 是浏览器 (Vite + Tauri WebView) 不会走到这里，
  // 但 asBlob 声明返回类型是 Blob | Buffer，为类型收敛还是覆盖一下。
  if (result && typeof (result as { buffer?: ArrayBufferLike }).buffer === 'object') {
    const b = result as { buffer: ArrayBufferLike; byteOffset?: number; byteLength?: number };
    return new Uint8Array(b.buffer, b.byteOffset ?? 0, b.byteLength);
  }
  throw new Error('asBlob 返回了无法识别的类型');
};

/**
 * Word 导出：方案 B2 - html-docx-js-typescript.asBlob
 *
 * 流程：
 *   1. 克隆 previewer HTML 到临时容器，把跨域图片抓成 data URL
 *      （Word 加载远程图会走系统代理/防火墙，data URL 最稳）
 *   2. buildFullHtmlDocument 生成带完整 <style> 的独立 HTML
 *   3. askSavePath → asBlob(html) → fs.writeFile 落盘
 *
 * 兜底：
 * - 用户取消：直接 return（不再骚扰用户）
 * - asBlob 抛错：退回剪贴板方案（老流程），并提示错误原因
 */
const exportWord = async (cherry: CherryLikeInstance, fileName: string): Promise<void> => {
  const rawHtml = cherry.previewer.getValue();
  const previewDom = cherry.previewer.getDomContainer();

  // 克隆一份 HTML 片段，用来把跨域图片抓成 data URL
  const temp = document.createElement('div');
  temp.innerHTML = rawHtml;
  try {
    await inlineImagesAsDataURL(temp);
  } catch {
    // 图片抓取失败不阻断整体流程；未抓到的图会在 Word 里显示占位
  }
  // 生成"自包含"的完整 HTML（含 <style>，让 Word 侧尽量还原 Cherry 预览观感）
  const fullHtml = buildFullHtmlDocument(temp.innerHTML, fileName, previewDom);

  const path = await askSavePath(fileName, 'docx', 'Word Document');
  if (!path) return;

  // asBlob 内部要把整份 HTML 打包成 MHT + zip，大文档 1~5s；
  // 首次调用还需动态 import jszip（~100KB），加 loading 提示。
  const loadingId = notifyLoading('正在生成 Word 文档…');
  try {
    // 动态 import 减小首屏体积；html-docx-js-typescript 纯浏览器实现，Vite 直接可用
    const { asBlob } = await import('html-docx-js-typescript');
    const result = await asBlob(fullHtml, {
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // twips，1 inch
    });
    const bytes = await docxResultToUint8Array(result);
    await writeFile(path, bytes);
    notifySuccess(`已导出 Word：${path}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[exportWord] asBlob failed, fallback to clipboard', error);
    const ok = await copyWordHtmlToClipboard(rawHtml);
    if (ok) {
      notifyInfo(`生成 .docx 失败（${message}），已改为复制富文本到剪贴板，请在 Word 中按 Ctrl+V 粘贴`);
    } else {
      notifyError(`生成 .docx 失败：${message}`);
    }
  } finally {
    dismissNotify(loadingId);
  }
};

export const runCherryExport = async (cherry: CherryLikeInstance, type: ExportType): Promise<void> => {
  if (!cherry?.previewer) {
    notifyError('Cherry 实例未就绪，无法导出');
    return;
  }

  // 关闭下拉，避免遮挡后续对话框
  const dropdown = document.querySelector<HTMLElement>('.cherry-dropdown[name=customExport]');
  if (dropdown) dropdown.style.display = 'none';

  preparePreviewer(cherry.previewer);
  const fileName = inferFileName(cherry);

  try {
    switch (type) {
      case 'markdown':
        await exportMarkdown(cherry, fileName);
        break;
      case 'html':
        await exportHtml(cherry, fileName);
        break;
      case 'pdf':
        await exportPdf(cherry, fileName);
        break;
      case 'screenShot':
        await exportScreenShot(cherry, fileName);
        break;
      case 'word':
        await exportWord(cherry, fileName);
        break;
      default:
        notifyError(`未知导出类型：${type}`);
        return;
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('cherry:export:done', { detail: { type } }));
    }
  } catch (error) {
    notifyError(`导出失败：${error instanceof Error ? error.message : String(error)}`);
  }
};
