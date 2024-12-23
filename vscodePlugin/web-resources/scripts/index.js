import 'mathjax/es5/tex-svg.js';
import path from 'path-browserify';
// import md5 from 'md5';

/**
 * 在侧边栏增加编辑/预览入口
 */
// eslint-disable-next-line no-undef
const customMenuChangeModule = Cherry.createMenuHook('编辑', {
  iconName: 'pen',
  onClick(selection) {
    if (window.isDisableEdit) {
      vscode.postMessage({
        type: 'tips',
        data: 'can\'t edit presently  当前文档已失焦点，编辑后无法保存',
      });
      return selection;
    }
    const pen = document.getElementsByClassName('cherry-toolbar-pen')[0];
    const markdown = document.getElementById('markdown');
    const isPreviewOnly = !/active/.test(pen.className);
    if (isPreviewOnly) {
      markdown.className = 'markdown-edit-preview';
      pen.className = `${pen.className} active`;
      pen.innerHTML = '<i class="ch-icon ch-icon-pen-fill"></i>';
    } else {
      markdown.className = 'markdown-preview-only';
      pen.className = pen.className.replace(' active', '');
      pen.innerHTML = '<i class="ch-icon ch-icon-pen"></i>';
    }
    return selection;
  },
});

// eslint-disable-next-line no-undef
const customMenuFont = Cherry.createMenuHook('字体样式', {
  iconName: 'font',
});

// eslint-disable-next-line no-undef
// const customMenuPublish = Cherry.createMenuHook('发布',  {
//   iconName: 'publish',
//   onClick: (selection, type) => {
//     publish(type);
//   },
//   subMenuConfig: [
//     { noIcon: true, name: '发布到Iwiki', onclick: () => {
//       cherry.toolbar.menus.hooks.customMenuChangeTheme.fire(null, 'iwiki');
//     } },
//     { noIcon: true, name: '发布到KM', onclick: () => {
//       cherry.toolbar.menus.hooks.customMenuChangeTheme.fire(null, 'km');
//     } },
//     { noIcon: true, name: '发布到简书', onclick: () => {
//       cherry.toolbar.menus.hooks.customMenuChangeTheme.fire(null, 'jianshu');
//     } },
//   ],
// });


/** 处理 a 链接跳转问题 */
const onClickLink = (e, target) => {
  // 这里不能直接使用 target.href，因为本地相对文件地址会被vscode转成`webview://`协议
  const href = target.attributes?.href.value;

  const hrefValidation = href ? href : 'href-invalid';
  if (isHttpUrl(hrefValidation) || hrefValidation) {
    // 阻止a链接在webview的默认跳转行为
    e.preventDefault();
    vscode.postMessage({
      type: 'open-url',
      data: href,
    });
    return;
  }
  vscode.postMessage({
    type: 'open-url',
    data: 'href-invalid',
  });
};

const basicConfig = {
  id: 'markdown',
  externals: {
    echarts: window.echarts,
    MathJax: window.MathJax,
  },
  isPreviewOnly: false,
  engine: {
    global: {
      // eslint-disable-next-line no-unused-vars
      urlProcessor(url, srcType) {
        // console.log('url-processor', url, srcType);
        // if (srcType === 'image') {
        //   loadOneImg({ src: url });
        // }
        return url;
      },
    },
    syntax: {
      codeBlock: {
        theme: 'twilight',
      },
      table: {
        enableChart: false,
        // chartEngine: Engine Class
      },
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
        customMenuFont: [
          'italic',
          'strikethrough',
          'underline',
          'sub',
          'sup',
          'ruby',
        ],
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
          // 'audio',
          // 'video',
          'link',
          'hr',
          'br',
          'code',
          'formula',
          'toc',
          'table',
          // 'pdf',
          // 'word',
        ],
      },
      // 'graph',
      'togglePreview',
    ],
    bubble: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'sub',
      'sup',
      'quote',
      'ruby',
      '|',
      'size',
      'color',
    ], // array or false
    sidebar: [
      'customMenuChangeModule',
      'mobilePreview',
      'copy',
      'theme',
    ],
    customMenu: {
      customMenuChangeModule,
      customMenuFont,
    },
    toc: true,
  },
  editor: {
    /**
     * @typedef {Object} fileUploadParams
     * @property {string=} name 文件名
     * @property {string=} poster 封面
     * @property {boolean=} isBorder 是否有边框
     * @property {boolean} isShadow 是否有阴影
     * @property {boolean} isRadius 是否圆角
     */
    /**
     * @callback fileUploadCallback 回填回调函数
     * @param {string} url 回填的url
     * @param {fileUploadParams} params 回填的参数
     */
    /**
     * 文件上传逻辑（涉及到文件上传均会调用此处）
     * @param {File} file 具体文件
     * @param {fileUploadCallback=} callback
     */
    fileUpload: (file, callback) => {
      vscode.postMessage({
        type: 'upload-file',
        data: {
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type,
        },
      });
      window.uploadFileCallback = callback;
    },
  },
  event: {
    // 当编辑区内容有实际变化时触发
    changeMainTheme: (theme) => {
      vscode.postMessage({
        type: 'change-theme',
        data: theme,
      });
    },
  },
  previewer: {
    // 自定义markdown预览区域class
    // className: 'markdown'
    lazyLoadImg: {
      // afterLoadOneImgCallback: loadOneImg,
    },
  },
  keydown: [],
  // extensions: [],
  callback: {
    // eslint-disable-next-line no-undef
    changeString2Pinyin: pinyin,
    beforeImageMounted(srcProp, srcValue) {
      const { _activeTextEditorPath } = window;

      //  http路径 或 data路径
      if (isHttpUrl(srcValue) || isDataUrl(srcValue)) {
        return {
          src: srcValue,
        };
      }
      // TODO: 绝对路径(如windows上D:\GithubDesktop\cherry-markdown\README.md)

      // 相对路径
      const absolutePath = new URL(srcValue, _activeTextEditorPath).href;
      return {
        src: absolutePath,
      };
    },
    onClickPreview: (e) => {
      const { target } = e;
      switch (target?.nodeName) {
        case 'SPAN':
          if (target?.parentElement?.nodeName === 'A') {
            onClickLink(e, target?.parentElement);
          }
          break;
        case 'A':
          onClickLink(e, target);
          break;
      };
    },
  },
};

function isDataUrl(url) {
  return /^data:/.test(url);
}

function isHttpUrl(url) {
  return /https?:\/\//.test(url);
}

/**
 * [vscode language](https://code.visualstudio.com/docs/getstarted/locales#_available-locales);
 * [cherry language](https://github.com/Tencent/cherry-markdown/wiki/%E5%A4%9A%E8%AF%AD%E8%A8%80);
 * */
const languageIdentifiers = {
  en: 'en_US', // English (US)
  'zh-cn': 'zh_CN', // Simplified Chinese
  // 'zh-tw': '繁体中文', // Traditional Chinese
  // fr: '法语', // French
  // de: '德语', // German
  // it: '意大利语', // Italian
  // es: '西班牙语', // Spanish
  // ja: '日语', // Japanese
  // ko: '韩国人', // Korean
  ru: 'ru_RU', // Russian
  // 'pt-br': '葡萄牙语（巴西）', // Portuguese (Brazil)
  // tr: '土耳其', // Turkish
  // pl: '波兰', // Polish
  // cs: '捷克语', // Czech
  // hu: '匈牙利', // Hungarian
};

const mdInfo = JSON.parse(document.getElementById('markdown-info').value);
const locale = languageIdentifiers[mdInfo.vscodeLanguage] || 'zh_CN';

const config = Object.assign({}, basicConfig, { value: mdInfo.text, locale });
// eslint-disable-next-line new-cap, no-undef
const cherry = new Cherry(config);
// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();
// 图片缓存
// const imgCache = {};

// function afterInit() {
//   setTimeout(() => {
//     const imgs = cherry.previewer.getDom().querySelectorAll('img');
//     imgs.forEach((img) => {
//       loadOneImg(img);
//     });
//   }, 100);
// }

// function loadOneImg(img) {
//   const { src } = img;
//   const sign = md5(src);
//   if (typeof imgCache[sign] !== 'undefined') {
//     return true;
//   }
//   imgCache[sign] = true;
//   vscode.postMessage({
//     type: 'cherry-load-img',
//     data: src,
//   });
// }

// 预览区域滚动的时候发送事件
cherry.previewer.getDom().addEventListener('scroll', () => {
  const domContainer = cherry.previewer.getDom();
  if (window.disableScrollListener) {
    return true;
  }
  if (domContainer.scrollTop <= 0) {
    postScrollMessage(0);
    return true;
  }
  if (
    domContainer.scrollTop + domContainer.offsetHeight
    > domContainer.scrollHeight
  ) {
    postScrollMessage(-1);
    return true;
  }
  // 获取预览容器基准坐标
  const basePoint = domContainer.getBoundingClientRect();
  // 观察点坐标，取容器中轴线
  const watchPoint = {
    x: basePoint.left + basePoint.width / 2,
    y: basePoint.top + 1,
  };
  // 获取观察点处的DOM
  const targetElements = elementsFromPoint(watchPoint.x, watchPoint.y);
  let targetElement;
  for (let i = 0; i < targetElements.length; i++) {
    if (domContainer.contains(targetElements[i])) {
      targetElement = targetElements[i];
      break;
    }
  }
  if (!targetElement || targetElement === domContainer) {
    return;
  }
  // 获取观察点处最近的markdown元素
  let mdElement = targetElement.closest('[data-sign]');
  // 由于新增脚注，内部容器也有可能存在data-sign，所以需要循环往父级找
  while (
    mdElement
    && mdElement.parentElement
    && mdElement.parentElement !== domContainer
  ) {
    mdElement = mdElement.parentElement.closest('[data-sign]');
  }
  if (!mdElement) {
    return;
  }
  // 计算当前焦点容器的所在行数
  let lines = 0;
  let element = mdElement;
  while (element) {
    lines += +element.getAttribute('data-lines');
    element = element.previousElementSibling; // 取上一个兄弟节点，直到为null
  }
  // markdown元素存在margin，getBoundingRect不能获取到margin
  const mdElementStyle = getComputedStyle(mdElement);
  const marginTop = parseFloat(mdElementStyle.marginTop);
  const marginBottom = parseFloat(mdElementStyle.marginBottom);
  // markdown元素基于当前页面的矩形模型
  const mdRect = mdElement.getBoundingClientRect();
  const mdActualHeight = mdRect.height + marginTop + marginBottom;
  // (mdRect.y - marginTop)为顶部触达区域，basePoint.y为预览区域的顶部，故可视范围应减去预览区域的偏移
  const mdOffsetTop = mdRect.y - marginTop - basePoint.y;
  const lineNum = +mdElement.getAttribute('data-lines'); // 当前markdown元素所占行数
  const percent = Math.abs(mdOffsetTop) / mdActualHeight;
  postScrollMessage(lines - lineNum + parseInt(lineNum * percent, 10));
});

function postScrollMessage(line) {
  vscode.postMessage({
    type: 'preview-scroll',
    data: line,
  });
}

cherry.onChange((newValue) => {
  if (window.disableEditListener) {
    return true;
  }
  vscode.postMessage({
    type: 'cherry-change',
    data: newValue,
  });
});

let scrollTimeOut;
let editTimeOut;
window.addEventListener('message', (e) => {
  const { cmd, data } = e.data;
  switch (cmd) {
    case 'editor-change':
      window.disableEditListener = true;
      cherry.setValue(data.text);
      editTimeOut && clearTimeout(editTimeOut);
      editTimeOut = setTimeout(() => {
        window.disableEditListener = false;
      }, 500);
      break;
    case 'editor-scroll':
      window.disableScrollListener = true;
      cherry.previewer.scrollToLineNumWithOffset(data, 0);
      scrollTimeOut && clearTimeout(scrollTimeOut);
      scrollTimeOut = setTimeout(() => {
        window.disableScrollListener = false;
      }, 500);
      break;
    case 'disable-edit':
      // 强制进入预览模式
      window.isDisableEdit = true;
      // eslint-disable-next-line no-case-declarations
      const pen = document.getElementsByClassName('cherry-toolbar-pen')[0];
      // eslint-disable-next-line no-case-declarations
      const markdown = document.getElementById('markdown');
      markdown.className = 'markdown-preview-only';
      pen.className = pen.className.replace(' active', '');
      pen.innerHTML = '<i class="ch-icon ch-icon-pen"></i>';
      break;
    case 'enable-edit':
      window.isDisableEdit = false;
      break;
    case 'upload-file-callback': {
      const { url, ...rest } = data;
      window.uploadFileCallback(url, rest);
      break;
    }
  }
});

/**
 * document.elementsFromPoint polyfill
 * ref: https://github.com/JSmith01/elementsfrompoint-polyfill/blob/master/index.js
 * @param {number} x
 * @param {number} y
 */
function elementsFromPoint(x, y) {
  // see https://caniuse.com/#search=elementsFromPoint
  if (typeof document.elementsFromPoint === 'function') {
    return document.elementsFromPoint(x, y);
  }

  if (
    typeof (/** @type {any}*/ (document).msElementsFromPoint) === 'function'
  ) {
    const nodeList = /** @type {any}*/ (document).msElementsFromPoint(x, y);
    return nodeList !== null ? Array.from(nodeList) : nodeList;
  }
  const elements = [];
  const pointerEvents = [];
  /** @type {HTMLElement} */
  let ele;
  do {
    const currentElement = /** @type {HTMLElement} */ (
      document.elementFromPoint(x, y)
    );
    if (ele !== currentElement) {
      ele = currentElement;
      elements.push(ele);
      pointerEvents.push(ele.style.pointerEvents);
      ele.style.pointerEvents = 'none';
    } else {
      ele = null;
    }
  } while (ele);
  elements.forEach((e, index) => {
    e.style.pointerEvents = pointerEvents[index];
  });
  return elements;
}
