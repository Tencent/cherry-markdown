/** Engine-only defaults. Editor, layout and preview defaults live in cherry-markdown. */
import cloneDeep from './utils/toolkit/cloneDeep';

const emptyAttributes = () => '';

const defaultConfig = {
  externals: {},
  engine: {
    global: {
      classicBr: false,
      htmlWhiteList: '',
      htmlBlackList: '',
      htmlAttrWhiteList: '',
      flowSessionContext: false,
      flowSessionCursor: '',
    },
    syntax: {
      link: { target: '', rel: '', attrRender: emptyAttributes, selfClosing: false },
      autoLink: {
        target: '', rel: '', enableShortLink: false, shortLinkLength: 20, attrRender: emptyAttributes, breakChars: [],
      },
      image: { selfClosing: false, selfClosingRender: () => '' },
      list: { listNested: false, indentSpace: 2 },
      table: { enableChart: false, selfClosing: false },
      space: false,
      inlineCode: { showColor: true, selfClosing: false },
      codeBlock: {
        wrap: true,
        lineNumber: true,
        copyCode: true,
        editCode: true,
        changeLang: true,
        expandCode: false,
        selfClosing: true,
        customRenderer: {},
        wrapperRender: (_language, _code, innerHTML) => innerHTML,
        mermaid: { svg2img: false, showSourceToolbar: false, src: '' },
        indentedCodeBlock: true,
        customBtns: [],
      },
      emoji: { useUnicode: true },
      fontEmphasis: { allowWhitespace: false, selfClosing: false },
      strikethrough: { needWhitespace: false },
      mathBlock: { selfClosing: false, engine: 'MathJax', src: '', css: '', plugins: true },
      inlineMath: { selfClosing: false, engine: 'MathJax', src: '' },
      toc: { allowMultiToc: false, showAutoNumber: false },
      header: { anchorStyle: 'default', selfClosing: true, strict: false },
      htmlBlock: { filterStyle: false, removeTrailingNewline: false },
      panel: {
        enableJustify: true,
        enableAlign: true,
        enablePanel: true,
        enableCols: true,
        enableTabs: true,
        enableTimeline: true,
      },
      footnote: {
        selfClosing: false,
        refNumber: { appendClass: '', render: (refNum) => `[${refNum}]`, clickRefNumberCallback: () => true },
        refList: {
          appendClass: '',
          title: { appendClass: '', render: () => '' },
          listItem: {
            appendClass: '',
            render: (refNum, refTitle, content, refNumberLinkRender) =>
              `${refNumberLinkRender(refNum, refTitle)}${content}`,
          },
        },
        bubbleCard: {
          appendClass: '',
          render: (refNum, refTitle, content) =>
            `<div class="cherry-ref-bubble-card__title">${refNum}. ${refTitle}</div>` +
            `<div class="cherry-ref-bubble-card__content">${content}</div>` +
            '<div class="cherry-ref-bubble-card__foot"></div>',
        },
      },
    },
  },
  callback: { urlProcessor: (url) => url, afterAsyncRender: undefined },
  locale: 'zh_CN',
  locales: {},
};

export default cloneDeep(defaultConfig);
