import Cherry from 'cherry-markdown';
import 'cherry-markdown/dist/cherry-markdown.min.css';
import type { CherryTheme } from '../../src/config';
import type {
  EditorState,
  ExtensionToWebviewMessage,
  WebviewLabels,
  WebviewToExtensionMessage,
} from '../../src/protocol';
import type { UploadFileResult } from '../../src/types/upload';

interface PersistedState {
  editMode?: boolean;
  scrollTop?: number;
}

interface VSCodeApi<State> {
  getState(): State | undefined;
  setState(state: State): void;
  postMessage(message: WebviewToExtensionMessage): void;
}

interface CherryInstance {
  options: { externals: { MathJax?: unknown } };
  previewer: {
    getDom(): HTMLElement;
    scrollToLineNumWithOffset(line: number, offset: number): void;
  };
  onChange(callback: (value: string | { markdown?: string }) => void): void;
  setTheme(theme: CherryTheme): void;
  setValue(value: string): void;
}

interface CherryConstructor {
  new (config: Record<string, unknown>): CherryInstance;
  createMenuHook(name: string, config: Record<string, unknown>): unknown;
}

interface UploadFileWithPath extends File {
  path?: string;
}

type UploadCallback = (url: string, properties: Omit<UploadFileResult, 'requestId' | 'url'>) => void;

declare function acquireVsCodeApi<State>(): VSCodeApi<State>;

declare global {
  interface Window {
    disableScrollListener?: boolean;
    echarts?: unknown;
    isDisableEdit?: boolean;
    MathJax?: unknown;
    pinyin?: (value: string) => string;
  }
}

const CherryEditor = Cherry as unknown as CherryConstructor;

const vscode = acquireVsCodeApi<PersistedState>();
const persistedState = vscode.getState() ?? {};

let cherry: CherryInstance | undefined;
let editorState: EditorState | undefined;
let suppressEditMessage = false;
let suppressThemeMessage = false;
let editRequestId = 0;
let uploadRequestId = 0;
  let editInFlight: { requestId: number; markdown: string } | undefined;
  let pendingMarkdown: string | undefined;
  let stateGeneration = 0;
let editDebounceTimer: ReturnType<typeof setTimeout> | undefined;
const uploadCallbacks = new Map<number, UploadCallback | undefined>();

/**
 * 在侧边栏增加编辑/预览入口
 */
function createCustomMenus(labels: WebviewLabels) {
  const customMenuChangeModule = CherryEditor.createMenuHook(labels.edit, {
    iconName: 'pen',
    onClick(selection: unknown) {
      if (window.isDisableEdit) {
        vscode.postMessage({ type: 'show-message', data: labels.editDisabled });
        return selection;
      }
      setEditMode(!isEditMode());
      return selection;
    },
  });

  const customMenuFont = CherryEditor.createMenuHook(labels.fontStyle, { iconName: 'font' });
  const customMenuExport = CherryEditor.createMenuHook(labels.save, {
    iconName: 'export',
    subMenuConfig: [
      {
        noIcon: true,
        name: labels.savePng,
        onclick: async () => {
          const cherrymarkdown = document.querySelector<HTMLElement>('.cherry-previewer');
          if (!cherrymarkdown) {
            vscode.postMessage({ type: 'export-png', data: 'export-fail' });
            return;
          }
          try {
            const mod = await import(/* webpackChunkName: "html-to-image" */ 'html-to-image');
            const toPng = mod.toPng || mod.default?.toPng;
            if (!toPng) throw new Error('html-to-image unavailable');
            vscode.postMessage({ type: 'export-png', data: await toPng(cherrymarkdown) });
          } catch (error) {
            console.error('toPng error:', error);
            vscode.postMessage({ type: 'export-png', data: 'export-fail' });
          }
        },
      },
    ],
  });
  return { customMenuChangeModule, customMenuFont, customMenuExport };
}

function isEditMode() {
  const pen = document.getElementsByClassName('cherry-toolbar-pen')[0];
  return Boolean(pen && /active/.test(pen.className));
}

function setEditMode(enabled: boolean) {
  const editEnabled = enabled && !window.isDisableEdit;
  const pen = document.getElementsByClassName('cherry-toolbar-pen')[0];
  const markdown = document.getElementById('markdown');
  if (!pen || !markdown) return;
  markdown.className = editEnabled ? 'markdown-edit-preview' : 'markdown-preview-only';
  pen.className = editEnabled ? `${pen.className.replace(' active', '')} active` : pen.className.replace(' active', '');
  pen.innerHTML = `<i class="ch-icon ${editEnabled ? 'ch-icon-pen-fill' : 'ch-icon-pen'}"></i>`;
  vscode.setState({ ...vscode.getState(), editMode: editEnabled, scrollTop: cherry?.previewer.getDom().scrollTop || 0 });
}

/** 处理 a 链接跳转问题 */
const onClickLink = (event: MouseEvent, target: HTMLAnchorElement) => {
  // 这里不能直接使用 target.href，因为本地相对文件地址会被vscode转成`webview://`协议
  const href = target.getAttribute('href');

  event.preventDefault();
  vscode.postMessage({ type: 'open-url', data: href || '' });
};

function createBasicConfig(state: EditorState): Record<string, unknown> {
  const { customMenuChangeModule, customMenuFont, customMenuExport } = createCustomMenus(state.labels);
  return {
    id: 'markdown',
    externals: {
      echarts: window.echarts,
      MathJax: window.MathJax,
    },
    isPreviewOnly: false,
    themeSettings: {
      mainTheme: state.theme,
    },
    engine: {
      global: {
        urlProcessor(url: string, _srcType: string) {
          return url;
        },
      },
      syntax: {
        table: { enableChart: false },
        fontEmphasis: {
          allowWhitespace: false, // 是否允许首尾空格
        },
        strikethrough: {
          needWhitespace: false, // 是否必须有前后空格
        },
        mathBlock: {
          engine: 'MathJax', // katex或MathJax
        },
        inlineMath: {
          engine: 'MathJax', // katex或MathJax
        },
        emoji: {
          useUnicode: true,
        },
        header: {
          anchorStyle: 'none',
        },
        codeBlock: {
          theme: 'twilight',
          mermaid: {
            svg2img: false, // 是否将mermaid生成的画图变成img格式
          },
        },
      },
    },
    toolbars: {
      toolbar: [
        'bold',
        {
          customMenuFont: ['italic', 'strikethrough', 'underline', 'sub', 'sup', 'ruby'],
        },
        'size',
        'color',
        '|',
        'header',
        'list',
        '|',
        'panel',
        'justify',
        'detail',
        '|',
        {
          insert: [
            'image',
            'link',
            'hr',
            'br',
            'code',
            'formula',
            'toc',
            'table',
          ],
        },
        'togglePreview',
      ],
      bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', '|', 'size', 'color'], // array or false
      sidebar: ['customMenuChangeModule', 'mobilePreview', 'copy', 'theme', 'customMenuExport'],
      customMenu: {
        customMenuChangeModule,
        customMenuFont,
        customMenuExport,
      },
      toc: true,
    },
    editor: {},
    event: {
      // 当编辑区内容有实际变化时触发
      changeMainTheme: (theme: CherryTheme) => {
        if (suppressThemeMessage) return;
        vscode.postMessage({
          type: 'change-theme',
          data: theme,
        });
      },
    },
    previewer: {
      lazyLoadImg: {},
    },
    keydown: [],
    callback: {
      fileUpload: (file: UploadFileWithPath, callback?: UploadCallback) => {
        uploadRequestId += 1;
        const requestId = uploadRequestId;
        uploadCallbacks.set(requestId, callback);
        vscode.postMessage({
          type: 'upload-file',
          data: {
            requestId,
            name: file.name,
            path: file.path || '',
            size: file.size,
            type: file.type,
          },
        });
      },
      changeString2Pinyin: window.pinyin,
      beforeImageMounted(_srcProp: unknown, srcValue: string) {
        if (isHttpUrl(srcValue) || isDataUrl(srcValue)) {
          return {
            src: srcValue,
          };
        }
        const resourceUri = editorState?.resourceUri;
        if (!resourceUri) return { src: srcValue };
        const absolutePath = new URL(srcValue, resourceUri).href;
        return {
          src: absolutePath,
        };
      },
      onClickPreview: (event: MouseEvent) => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest<HTMLAnchorElement>('a');
        if (link) onClickLink(event, link);
      },
    },
  };
}

function isDataUrl(url: string): boolean {
  return /^data:image\//i.test(url);
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * [vscode language](https://code.visualstudio.com/docs/getstarted/locales#_available-locales);
 * [cherry language](https://github.com/Tencent/cherry-markdown/wiki/%E5%A4%9A%E8%AF%AD%E8%A8%80);
 * */
const languageIdentifiers: Record<string, string> = {
  en: 'en_US', // English (US)
  'zh-cn': 'zh_CN', // Simplified Chinese
  ru: 'ru_RU', // Russian
};

function needsMathJax(markdown: string): boolean {
  return /(\$\$|\\\[|\\\(|(^|[^\\])\$[^$\n]+\$)/m.test(markdown);
}

async function ensureMathJax(markdown: string): Promise<void> {
  if (!needsMathJax(markdown) || window.MathJax) return;
  await import(/* webpackChunkName: "mathjax" */ 'mathjax/es5/tex-svg.js').catch((error) => {
    console.error('MathJax load failed:', error);
  });
  if (cherry && window.MathJax) cherry.options.externals.MathJax = window.MathJax;
}

async function initializeCherry(state: EditorState, generation: number): Promise<void> {
  await ensureMathJax(state.text);
  if (generation !== stateGeneration) return;
  editorState = state;
  const locale = languageIdentifiers[state.vscodeLanguage] || 'zh_CN';
  const instance = new CherryEditor({ ...createBasicConfig(state), value: state.text, locale });
  cherry = instance;
  bindCherryEvents(instance);
  setEditMode(Boolean(persistedState.editMode) && !window.isDisableEdit);
  requestAnimationFrame(() => {
    instance.previewer.getDom().scrollTop = Number(persistedState.scrollTop) || 0;
  });
}

async function applyEditorState(state: EditorState): Promise<void> {
  stateGeneration += 1;
  const generation = stateGeneration;
  if (!cherry) {
    await initializeCherry(state, generation);
    return;
  }
  const preserveUnacknowledgedEdit =
    editorState?.documentUri === state.documentUri &&
    editorState.documentVersion === state.documentVersion &&
    (editInFlight !== undefined || pendingMarkdown !== undefined);
  await ensureMathJax(state.text);
  if (generation !== stateGeneration) return;
  if (!preserveUnacknowledgedEdit) {
    editorState = state;
    editInFlight = undefined;
    pendingMarkdown = undefined;
    clearTimeout(editDebounceTimer);
    suppressEditMessage = true;
    cherry.setValue(state.text);
    suppressEditMessage = false;
  } else {
    editorState = { ...state, text: editorState?.text ?? state.text };
  }
  suppressThemeMessage = true;
  cherry.setTheme(state.theme);
  suppressThemeMessage = false;
}

function scheduleEditorChange(markdown: string): void {
  pendingMarkdown = markdown;
  if (editInFlight) return;
  clearTimeout(editDebounceTimer);
  editDebounceTimer = setTimeout(sendPendingEditorChange, 120);
}

function sendPendingEditorChange() {
  if (!editorState || editInFlight || pendingMarkdown === undefined) return;
  editRequestId += 1;
  const requestId = editRequestId;
  const markdown = pendingMarkdown;
  pendingMarkdown = undefined;
  editInFlight = { requestId, markdown };
  vscode.postMessage({
    type: 'editor-change',
    data: {
      documentUri: editorState.documentUri,
      baseVersion: editorState.documentVersion,
      requestId,
      markdown,
    },
  });
}

function acknowledgeEditorChange(
  data: Extract<ExtensionToWebviewMessage, { cmd: 'editor-ack' }>['data'],
): void {
  if (!editorState || editInFlight?.requestId !== data.requestId) return;
  editorState.documentVersion = data.documentVersion;
  editorState.text = data.text;
  editInFlight = undefined;
  if (pendingMarkdown !== undefined && pendingMarkdown !== data.text) {
    scheduleEditorChange(pendingMarkdown);
  } else {
    pendingMarkdown = undefined;
  }
}

function bindCherryEvents(instance: CherryInstance): void {
  const previewDom = instance.previewer.getDom();
  let scrollFrame: number | undefined;
  previewDom.addEventListener('scroll', () => {
    vscode.setState({ ...vscode.getState(), editMode: isEditMode(), scrollTop: previewDom.scrollTop });
    if (window.disableScrollListener || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = undefined;
      postScrollPosition(previewDom);
    });
  });

  instance.onChange((newValue) => {
    if (suppressEditMessage) return;
    const markdown = typeof newValue === 'string' ? newValue : newValue?.markdown;
    if (typeof markdown === 'string' && markdown !== editorState?.text) scheduleEditorChange(markdown);
  });
}

function postScrollPosition(domContainer: HTMLElement): void {
  if (domContainer.scrollTop <= 0) {
    postScrollMessage(0);
    return;
  }
  if (domContainer.scrollTop + domContainer.offsetHeight >= domContainer.scrollHeight) {
    postScrollMessage(-1);
    return;
  }

  const basePoint = domContainer.getBoundingClientRect();
  const targetElements = document.elementsFromPoint(basePoint.left + basePoint.width / 2, basePoint.top + 1);
  const targetElement = targetElements.find((element) => domContainer.contains(element));
  if (!targetElement || targetElement === domContainer) return;

  let mdElement = targetElement.closest('[data-sign]');
  while (mdElement?.parentElement && mdElement.parentElement !== domContainer) {
    mdElement = mdElement.parentElement.closest('[data-sign]');
  }
  if (!mdElement) return;

  let lines = 0;
  let element: Element | null = mdElement;
  while (element) {
    lines += Number(element.getAttribute('data-lines')) || 0;
    element = element.previousElementSibling;
  }
  const style = getComputedStyle(mdElement);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const rectangle = mdElement.getBoundingClientRect();
  const actualHeight = rectangle.height + marginTop + marginBottom;
  const lineCount = Number(mdElement.getAttribute('data-lines')) || 1;
  const percentage = actualHeight > 0 ? Math.abs(rectangle.y - marginTop - basePoint.y) / actualHeight : 0;
  postScrollMessage(lines - lineCount + Math.trunc(lineCount * percentage));
}

function postScrollMessage(line: number): void {
  vscode.postMessage({ type: 'preview-scroll', data: line });
}

function applyUploadResult(data: UploadFileResult): void {
  if (!cherry) return;
  const { requestId, url, ...rest } = data;
  const callback = uploadCallbacks.get(requestId);
  uploadCallbacks.delete(requestId);
  callback?.(url, rest);
  const images = cherry.previewer.getDom().querySelectorAll('img');
  images.forEach((image) => {
    if (image.getAttribute('src') !== url) return;
    image.classList.remove('ch-image-border', 'ch-image-no-border', 'ch-image-shadow', 'ch-image-radius');
    if (rest.isNotBorder) image.classList.add('ch-image-no-border');
    else if (rest.isBorder) image.classList.add('ch-image-border');
    if (rest.isShadow) image.classList.add('ch-image-shadow');
    if (rest.isRadius) image.classList.add('ch-image-radius');
  });
}

let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('message', (event: MessageEvent<ExtensionToWebviewMessage>) => {
  const { cmd, data } = event.data;
  switch (cmd) {
    case 'editor-init':
    case 'editor-change':
      void applyEditorState(data);
      break;
    case 'editor-ack':
      acknowledgeEditorChange(data);
      break;
    case 'editor-scroll':
      if (!cherry) break;
      window.disableScrollListener = true;
      cherry.previewer.scrollToLineNumWithOffset(data, 0);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        window.disableScrollListener = false;
      }, 150);
      break;
    case 'disable-edit':
      window.isDisableEdit = true;
      setEditMode(false);
      break;
    case 'enable-edit':
      window.isDisableEdit = false;
      break;
    case 'upload-file-result':
      if (cherry) applyUploadResult(data);
      break;
    case 'operation-error':
      if (data?.operation === 'editor-change') {
        editInFlight = undefined;
        pendingMarkdown = undefined;
        clearTimeout(editDebounceTimer);
      }
      if (data?.operation === 'upload-file') {
        if (data.requestId === undefined) uploadCallbacks.clear();
        else uploadCallbacks.delete(data.requestId);
      }
      vscode.postMessage({ type: 'show-message', data: data?.message || 'Cherry Markdown operation failed.' });
      break;
  }
});

vscode.postMessage({ type: 'ready' });
