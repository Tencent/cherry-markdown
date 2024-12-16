/**
 * 自定义一个语法
 */
var CustomHookA = Cherry.createSyntaxHook('codeBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
  makeHtml(str) {
    console.warn('custom hook', 'hello');
    return str;
  },
  rule(str) {
    const regex = {
      begin: '',
      content: '',
      end: '',
    };
    regex.reg = new RegExp(regex.begin + regex.content + regex.end, 'g');
    return regex;
  },
});
/**
 * 自定义一个自定义菜单
 * 点第一次时，把选中的文字变成同时加粗和斜体
 * 保持光标选区不变，点第二次时，把加粗斜体的文字变成普通文本
 */
var customMenuA = Cherry.createMenuHook('加粗斜体',  {
  iconName: 'font',
  onClick: function(selection) {
    // 获取用户选中的文字，调用getSelection方法后，如果用户没有选中任何文字，会尝试获取光标所在位置的单词或句子
    let $selection = this.getSelection(selection) || '同时加粗斜体';
    // 如果是单选，并且选中内容的开始结束内没有加粗语法，则扩大选中范围
    if (!this.isSelections && !/^\s*(\*\*\*)[\s\S]+(\1)/.test($selection)) {
      this.getMoreSelection('***', '***', () => {
        const newSelection = this.editor.editor.getSelection();
        const isBoldItalic = /^\s*(\*\*\*)[\s\S]+(\1)/.test(newSelection);
        if (isBoldItalic) {
          $selection = newSelection;
        }
        return isBoldItalic;
      });
    }
    // 如果选中的文本中已经有加粗语法了，则去掉加粗语法
    if (/^\s*(\*\*\*)[\s\S]+(\1)/.test($selection)) {
      return $selection.replace(/(^)(\s*)(\*\*\*)([^\n]+)(\3)(\s*)($)/gm, '$1$4$7');
    }
    /**
     * 注册缩小选区的规则
     *    注册后，插入“***TEXT***”，选中状态会变成“***【TEXT】***”
     *    如果不注册，插入后效果为：“【***TEXT***】”
     */
    this.registerAfterClickCb(() => {
      this.setLessSelection('***', '***');
    });
    return $selection.replace(/(^)([^\n]+)($)/gm, '$1***$2***$3');
  }
});
/**
 * 定义一个空壳，用于自行规划cherry已有工具栏的层级结构
 */
var customMenuB = Cherry.createMenuHook('实验室',  {
  icon: {
    type: 'svg',
    content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>',
    iconStyle: 'width: 15px; height: 15px; vertical-align: middle;',
  },
});
/**
 * 定义一个自带二级菜单的工具栏
 */
var customMenuC = Cherry.createMenuHook('帮助中心',  {
  iconName: 'question',
  onClick: (selection, type) => {
    switch(type) {
      case 'shortKey':
        return `${selection}快捷键看这里：https://codemirror.net/5/demo/sublime.html`;
      case 'github':
        return `${selection}我们在这里：https://github.com/Tencent/cherry-markdown`;
      case 'release':
        return `${selection}我们在这里：https://github.com/Tencent/cherry-markdown/releases`;
      default:
        return selection;
    }
  },
  subMenuConfig: [
    { noIcon: true, name: '快捷键', onclick: (event)=>{cherry.toolbar.menus.hooks.customMenuCName.fire(null, 'shortKey')} },
    { noIcon: true, name: '联系我们', onclick: (event)=>{cherry.toolbar.menus.hooks.customMenuCName.fire(null, 'github')} },
    { noIcon: true, name: '更新日志', onclick: (event)=>{cherry.toolbar.menus.hooks.customMenuCName.fire(null, 'release')} },
  ]
});

/**
 * 定义带图表表格的按钮
 */
var customMenuTable = Cherry.createMenuHook('图表',  {
  iconName: 'trendingUp',
  subMenuConfig: [
    { noIcon: true, name: '折线图', onclick: (event)=>{cherry.insert('\n| :line:{x,y} | Header1 | Header2 | Header3 | Header4 |\n| ------ | ------ | ------ | ------ | ------ |\n| Sample1 | 11 | 11 | 4 | 33 |\n| Sample2 | 112 | 111 | 22 | 222 |\n| Sample3 | 333 | 142 | 311 | 11 |\n');} },
    { noIcon: true, name: '柱状图', onclick: (event)=>{cherry.insert('\n| :bar:{x,y} | Header1 | Header2 | Header3 | Header4 |\n| ------ | ------ | ------ | ------ | ------ |\n| Sample1 | 11 | 11 | 4 | 33 |\n| Sample2 | 112 | 111 | 22 | 222 |\n| Sample3 | 333 | 142 | 311 | 11 |\n');} },
  ]
});

var basicConfig = {
  id: 'markdown',
  externals: {
    echarts: window.echarts,
    katex: window.katex,
    MathJax: window.MathJax,
  },
  isPreviewOnly: false,
  engine: {
    global: {
      urlProcessor(url, srcType) {
        console.log(`url-processor`, url, srcType);
        return url;
      },
    },
    syntax: {
      image: {
        videoWrapper: (link, type, defaultWrapper) => {
          console.log(type);
          return defaultWrapper;
        },
      },
      autoLink: {
        /** 生成的<a>标签追加target属性的默认值 空：在<a>标签里不会追加target属性， _blank：在<a>标签里追加target="_blank"属性 */
        target: '',
        /** 生成的<a>标签追加rel属性的默认值 空：在<a>标签里不会追加rel属性， nofollow：在<a>标签里追加rel="nofollow：在"属性*/
        rel: '',
        /** 是否开启短链接 */
        enableShortLink: true,
        /** 短链接长度 */
        shortLinkLength: 20,
      },
      codeBlock: {
        theme: 'twilight',
        lineNumber: true, // 默认显示行号
        expandCode: true,
        copyCode: true,
        editCode: true,
        changeLang: true,
        customBtns: [
          { html: '自定义按钮1', onClick: (event, code, lang)=>{console.log(`【${lang}】: ${code}`);} },
          { html: '自定义按钮2', onClick: (event, code, lang)=>{console.log(`【${lang}】: ${code}`);} },
        ],
      },
      table: {
        enableChart: true,
      },
      fontEmphasis: {
        allowWhitespace: false, // 是否允许首尾空格
      },
      strikethrough: {
        needWhitespace: false, // 是否必须有前后空格
      },
      mathBlock: {
        engine: 'MathJax', // katex或MathJax
        src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // 如果使用MathJax plugins，则需要使用该url通过script标签引入
      },
      inlineMath: {
        engine: 'MathJax', // katex或MathJax
      },
      emoji: {
        useUnicode: true,
        customResourceURL: 'https://github.githubassets.com/images/icons/emoji/unicode/${code}.png?v8',
        upperCase: false,
      },
      // htmlBlock: {
      //   filterStyle: true,
      // }
      // toc: {
      //     tocStyle: 'nested'
      // }
      // 'header': {
      //   strict: false
      // }
    },
    customSyntax: {
      // SyntaxHookClass
      CustomHook: {
        syntaxClass: CustomHookA,
        force: false,
        after: 'br',
      },
    },
  },
  multipleFileSelection: {
    video: true,
    audio: false,
    image: true,
    word: false,
    pdf: true,
    file: true,
  },
  toolbars: {
    toolbar: [
      'bold',
      'italic',
      {
        strikethrough: ['strikethrough', 'underline', 'sub', 'sup', 'ruby', 'customMenuAName'],
      },
      'size',
      '|',
      'color',
      'header',
      '|',
      'drawIo',
      '|',
      'ol',
      'ul',
      'checklist',
      'panel',
      'justify',
      'detail',
      '|',
      'formula',
      {
        insert: ['image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'inlineCode', 'formula', 'toc', 'table', 'pdf', 'word', 'file'],
      },
      'graph',
      'customMenuTable',
      'togglePreview',
      'codeTheme',
      'search',
      'shortcutKey',
      {
        customMenuBName: ['ruby', 'audio', 'video', 'customMenuAName'],
      },
      'customMenuCName',
    ],
    toolbarRight: ['fullScreen', '|', 'export', 'changeLocale', 'wordCount'],
    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', '|', 'size', 'color'], // array or false
    sidebar: ['mobilePreview', 'copy', 'theme'],
    toc: {
      updateLocationHash: false, // 要不要更新URL的hash
      defaultModel: 'full', // pure: 精简模式/缩略模式，只有一排小点； full: 完整模式，会展示所有标题
    },
    customMenu: {
      customMenuAName: customMenuA,
      customMenuBName: customMenuB,
      customMenuCName: customMenuC,
      customMenuTable,
    },
    shortcutKeySettings: {
      /** 是否替换已有的快捷键, true: 替换默认快捷键； false： 会追加到默认快捷键里，相同的shortcutKey会覆盖默认的 */
      isReplace: false,
      shortcutKeyMap: {
        'Alt-Digit1': {
          hookName: 'header',
          aliasName: '标题',
        },
        'Control-Shift-KeyX': {
          hookName: 'bold',
          aliasName: '加粗',
        },
      },
    },
    // config: {
    //   publish: [
    //     {
    //       name: '微信公众号',
    //       key: 'wechat',
    //       icon: `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E  %3Cg fill='none'%3E    %3Cpath fill='%23FFF' d='M0 0h80v80H0z' opacity='0'/%3E    %3Cpath fill='%2307C160' d='M60.962 22.753c-7.601-2.567-18.054-2.99-27.845 4.49-5.423 4.539-9.56 10.715-10.675 18.567-2.958-3.098-5.025-7.995-5.58-11.706-.806-5.403.483-10.82 4.311-15.45C26.906 11.724 34.577 10 39.6 10c9.57.001 18.022 5.882 21.363 12.753zm7.64 11.78c7.516 9.754 5.441 24.73-5.1 32.852-2.618 2.018-5.67 3.198-8.651 4.024a26.067 26.067 0 0 0 5.668-9.54c4.613-13.806-2.868-28.821-16.708-33.536-.3-.102-.601-.191-.903-.282 9.348-3.467 19.704-1.292 25.694 6.482zM39.572 59.37c6.403 0 11.474-1.49 16.264-5.013-.124 1.993-.723 4.392-1.271 5.805-4.509 11.633-17.56 16.676-31.238 12.183C11.433 68.438 4.145 54.492 7.475 42.851c.893-3.12 1.805-5.26 3.518-7.953 1.028 7.504 5.7 14.803 12.511 19.448.518.35.872.932.901 1.605a2.4 2.4 0 0 1-.08.653l-1.143 5.19c-.052.243-.142.499-.13.752.023.56.495.997 1.053.973.22-.01.395-.1.576-.215l6.463-4.143c.486-.312 1.007-.513 1.587-.538a3.03 3.03 0 0 1 .742.067c1.96.438 3.996.68 6.1.68z'/%3E  %3C/g%3E%3C/svg%3E`,
    //       serviceUrl: 'http://localhost:3001',
    //       injectPayload: {
    //         thumb_media_id: 'ft7IwCi1eukC6lRHzmkYuzeMmVXWbU3JoipysW2EZamblyucA67wdgbYTix4X377',
    //         author: 'Cherry Markdown',
    //       },
    //     }
    //   ],
    // },
  },
  drawioIframeUrl: './drawio_demo.html',
  previewer: {
    // 自定义markdown预览区域class
    // className: 'markdown'
    floatWhenClosePreviewer: true,
  },
  keydown: [],
  //extensions: [],
  callback: {
    changeString2Pinyin: pinyin,
    onClickPreview: (event) => {
      console.log("onClickPreview", event);
    },
  },
  editor: {
    id: 'cherry-text',
    name: 'cherry-text',
    autoSave2Textarea: true,
    defaultModel: 'edit&preview',
    showFullWidthMark: true, // 是否高亮全角符号 ·|￥|、|：|“|”|【|】|（|）|《|》
    showSuggestList: true, // 是否显示联想框
  },
  // cherry初始化后是否检查 location.hash 尝试滚动到对应位置
  autoScrollByHashAfterInit: true,
  // locale: 'en_US',
  themeSettings: {
    mainTheme: 'light',
  },
};

fetch('./markdown/basic.md').then((response) => response.text()).then((value) => {
  var config = Object.assign({}, basicConfig, { value: value });
  window.cherry = new Cherry(config);
});
