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
var suggest = [];
var list = ['barryhu', 'ivorwei', 'sunsunliu', 'jiaweicui', 'other', 'new'];
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
      table: {
        enableChart: false,
        // chartEngine: Engine Class
      },
      fontEmphasis: {
        allowWhitespace: true, // 是否允许首尾空格
      },
      mathBlock: {
        engine: 'MathJax', // katex或MathJax
        src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // 如果使用MathJax plugins，则需要使用该url通过script标签引入
      },
      inlineMath: {
        engine: 'MathJax', // katex或MathJax
      },
      emoji: {
        useUnicode: false,
        customResourceURL: 'https://github.githubassets.com/images/icons/emoji/unicode/${code}.png?v8',
        upperCase: true,
      },
      suggester: {
        suggester: [
          {
            // 获取 列表
            suggestList(word, callback) {
              suggest.push(list[Math.floor(Math.random() * 6)]);
              if (suggest.length >= 6) {
                suggest.shift();
              }
              callback(suggest);
            },
            // 唤醒关键字
            // default '@'
            keyword: '@',
            // 建议模板
            suggestListRender(valueArray) {
              return '';
            },
            // 回填回调
            echo(value) {
              return '';
            },
          },
          {
            keyword: '/',
            suggestList(word, callback) {
              callback([
                {
                  type: 'header',
                  icon: 'h1',
                  sub: 'h1',
                  text: 'H1 一级标题',
                },
                {
                  type: 'header',
                  icon: 'h2',
                  sub: 'h2',
                  text: 'H2 二级标题',
                },
                {
                  type: 'header',
                  icon: 'h3',
                  sub: 'h3',
                  text: 'H3 三级标题',
                },
                {
                  type: 'quickTable',
                  icon: 'table',
                  text: '快捷表格',
                },
                {
                  type: 'codeBlock',
                  icon: 'code',
                  text: '代码块',
                },
                {
                  type: 'graph',
                  sub: 'insertFlow',
                  icon: 'insertFlow',
                  text: '流程图',
                },
                {
                  type: 'formula',
                  icon: 'insertFormula',
                  text: '公式',
                },
              ]);
            },
          },
        ],
      },
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
  toolbars: {
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'color',
      'header',
      '|',
      'list',
      {
        insert: ['image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'pdf', 'word'],
      },
      'graph',
      'togglePreview',
      'settings',
      'switchModel',
      'codeTheme',
      'export',
    ],
    sidebar: ['mobilePreview', 'copy'],
  },
  editor: {
    defaultModel: 'edit&preview',
  },
  previewer: {
    // 自定义markdown预览区域class
    // className: 'markdown'
  },
  keydown: [],
  //extensions: [],
};

fetch('./markdown/basic.md')
  .then((response) => response.text())
  .then((value) => {
    var config = Object.assign({}, basicConfig, { value });
    window.cherry = new Cherry(config);
  });
