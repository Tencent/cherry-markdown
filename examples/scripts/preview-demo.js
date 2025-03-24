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

var cherryConfig = {
  id: 'markdown',
  externals: {
    echarts: window.echarts,
    katex: window.katex,
    MathJax: window.MathJax,
  },
  engine: {
    global: {
      urlProcessor(url, srcType) {
        console.log(`url-processor`, url, srcType);
        return url;
      },
    },
    syntax: {
      fontEmphasis: {
        allowWhitespace: true, // 是否允许首尾空格
      },
      mathBlock: {
        engine: 'MathJax', // katex或MathJax
        src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // 如果使用MathJax将js在此处引入，katex则需要将js提前引入
      },
      inlineMath: {
        engine: 'MathJax', // katex或MathJax
      },
      emoji: {
        useUnicode: false,
        customResourceURL: 'https://github.githubassets.com/images/icons/emoji/unicode/${code}.png?v8',
        upperCase: true,
      },
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
  toolbars: {
    toolbar: false,
    // 配置目录
    toc: {
      updateLocationHash: true, // 要不要更新URL的hash
      defaultModel: 'full', // pure: 精简模式/缩略模式，只有一排小点； full: 完整模式，会展示所有标题
      position: 'fixed', // 悬浮目录的悬浮方式。当滚动条在cherry内部时，用absolute；当滚动条在cherry外部时，用fixed
      cssText: 'right: 20px;',
    },
  },
  editor: {
    defaultModel: 'previewOnly',
    keepDocumentScrollAfterInit: true,
  },
  autoScrollByHashAfterInit: true,
  callback: {
    onClickPreview: function(e) {
      const {target} = e;
      if(target.tagName === 'IMG') {
        console.log('click img', target);
        const tmp = new Viewer(target, {
            button: false,
            navbar: false,
            title: [1, (image, imageData) => `${image.alt.replace(/#.+$/, '')} (${imageData.naturalWidth} × ${imageData.naturalHeight})`],
            hidden(){
              tmp.destroy()
            },
          });
        tmp.show();
      }
    }
  },
  previewer: {
    // 自定义markdown预览区域class
    // className: 'markdown'
  },
  keydown: [],
  //extensions: [],
};

fetch('./markdown/basic.md').then((response) => response.text()).then((value) => {
  var config = Object.assign({}, cherryConfig, { value: value });
  window.cherry = new Cherry(config);
});
