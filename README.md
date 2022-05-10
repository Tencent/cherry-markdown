<p align="center"><img src="logo/logo--color.svg" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Editor

English | [简体中文](./README.CN.md)

## Introduction

Cherry Markdown Editor is a Javascript Markdown editor. It has the advantages such as out-of-the-box, lightweight and easy to extend. It can run in browser or server(with NodeJs).

### **Out-of-the-box**

Developer can call and instantiate Cherry Markdown Editor in a very simple way. The instantiated Cherry Markdown Editor supports most commonly used markdown syntax (such as title, TOC, flowchart, formula, etc.) by default.

### **Easy to extend**

When the syntax that Cherry Markdown editor support can not meet your needs, secondary development or function extention can be carried out quickly. At the same time, Cherry Markdown editor should be implemented by pure JavaScript, and should not rely on framework technology such as angular, vue and react. Framework only provide a container environment.

## Feature

### Syntax Feature

1. Image zoom, alignment and reference
2. Generate a chart based on the content of the table
3. Adjust font color and size
4. Font background color, superscript and subscript
5. Insert checklist
6. Insert audio or video

### Multiple modes

1. Live preview with Scroll Sync
2. Preview-only mode
3. No toolbar mode (minimalist editing mode)
4. Mobile preview mode

### Functional Feature

1. Copy from rich text and paste as markdown text
2. Classic line feed & regular line feed
3. Multi-cursor editing
4. Image size editing
5. Export as image or pdf
6. Float toolbar: appears at the beginning of a new line
7. Bubble toolbar: appears when text is selected

### Performance Feature

1. partial rendering
2. partial update

### Security

Cherry Markdown has a built-in security Hook, by filtering the whitelist and DomPurify to do scan filter.

### Style theme

Cherry Markdown has a variety of style themes to choose from.


### Features show
click [here](./docs/features.md) for more details

### Demos
- [basic](https://tencent.github.io/cherry-markdown/examples/index.html)
- [mobile](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [multiple instances](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [editor without toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [pure preview](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS](https://tencent.github.io/cherry-markdown/examples/xss.html)（Not allowed by default）
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)
- [img wysiwyg](https://tencent.github.io/cherry-markdown/examples/img.html)
- [table wysiwyg](https://tencent.github.io/cherry-markdown/examples/table.html)
- [headers with auto num](https://tencent.github.io/cherry-markdown/examples/head_num.html)


## Install

Via yarn

```bash
yarn add cherry-markdown
```

Via npm

```bash
npm install cherry-markdown --save
```

If you need to enable the functions of `mermaid` drawing and table-to-chart, you need to add `mermaid` and `echarts` packages at the same time.

Currently, the plug-in version **Cherry** recommend is `echarts@4.6.0` `mermaid@8.11.1`.

```bash
# Install mermaid, enable mermaid and drawing function
yarn add mermaid@8.11.1
# Install echarts, turn on the table-to-chart function
yarn add echarts@4.6.0
```

## Quick start

### Browser

#### UMD

```html
<link href="cherry-editor.min.css" />
<div id="markdown-container"></div>
<script src="cherry-editor.min.js"></script>
<script>
    new Cherry({
      id: 'markdown-container',
      value: '# welcome to cherry editor!',
    });
</script>
```

#### ESM

```javascript
import Cherry from 'cherry-markdown';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Node

```javascript
const { default: CherryEngine } = require('cherry-markdown/dist/cherry-markdown.engine.core.common');
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');
```

## Lite Version

Because the size of the mermaid library is very large, the cherry build product contains a core build package without built-in Mermaid. The core build can be imported in the following ways.

### Full mode (With UI Interface)

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Engine Mode  (Just Syntax Compile)

```javascript
// Import Cherry engine core construction
// Engine configuration items are the same as Cherry configuration items, the following document content only introduces the Cherry core package
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!')

// --> <h1>welcome to cherry editor!</h1>
```

### ⚠️ About mermaid

The core build package does not contain mermaid dependency, should import related plug-ins manually.

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// Plug-in registration must be done before Cherry is instantiated
Cherry.usePlugin(CherryMermaidPlugin, {
  mermaid, // pass in mermaid object
  // mermaidAPI: mermaid.mermaidAPI, // Can also be passed in mermaid API
  // At the same time, you can configure mermaid's behavior here, please refer to the official mermaid document
  // theme: 'neutral',
  // sequence: { useMaxWidth: false, showSequenceNumbers: true }
});

const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Dynamic import

**recommend**  Using Dynamic import, the following is an example of webpack Dynamic import.

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';

const registerPlugin = async () => {
  const [{ default: CherryMermaidPlugin }, mermaid] = await Promise.all([
    import('cherry-markdown/src/addons/cherry-code-block-mermaid-plugin'),
    import('mermaid'),
  ]);
  Cherry.usePlugin(CherryMermaidPlugin, {
    mermaid, // pass in mermaid object
  });
};

registerPlugin().then(() => {
  //  Plug-in registration must be done before Cherry is instantiated
  const cherryInstance = new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
});
```

## Configuration

### Default configuration

```javascript
{
  // 第三方包
  externals: {
    // externals
  },
  // 解析引擎配置
  engine: {
    // 全局配置
    global: {
      // 是否启用经典换行逻辑
      // true：一个换行会被忽略，两个以上连续换行会分割成段落，
      // false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
      classicBr: false,
      /**
       * 全局的URL处理器
       * @param {string} url 来源url
       * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
       * @returns
       */
      urlProcessor: callbacks.urlProcessor,
      /**
       * 额外允许渲染的html标签
       * 标签以英文竖线分隔，如：htmlWhiteList: 'iframe|script|style'
       * 默认为空，默认允许渲染的html见src/utils/sanitize.js whiteList 属性
       * 需要注意：
       *    - 启用iframe、script等标签后，会产生xss注入，请根据实际场景判断是否需要启用
       *    - 一般编辑权限可控的场景（如api文档系统）可以允许iframe、script等标签
       */
      htmlWhiteList: '',
    },
    // 内置语法配置
    syntax: {
      // 语法开关
      // 'hookName': false,
      // 语法配置
      // 'hookName': {
      //
      // }
      list: {
        listNested: false, // 同级列表类型转换后变为子级
        indentSpace: 2, // 默认2个空格缩进
      },
      table: {
        enableChart: false,
        // chartRenderEngine: EChartsTableEngine,
        // externals: ['echarts'],
      },
      inlineCode: {
        theme: 'red',
      },
      codeBlock: {
        theme: 'dark', // 默认为深色主题
        wrap: true, // 超出长度是否换行，false则显示滚动条
        lineNumber: true, // 默认显示行号
        customRenderer: {
          // 自定义语法渲染器
        },
        /**
         * indentedCodeBlock是缩进代码块是否启用的开关
         *
         *    在6.X之前的版本中默认不支持该语法。
         *    因为cherry的开发团队认为该语法太丑了（容易误触）
         *    开发团队希望用```代码块语法来彻底取代该语法
         *    但在后续的沟通中，开发团队发现在某些场景下该语法有更好的显示效果
         *    因此开发团队在6.X版本中才引入了该语法
         *    已经引用6.x以下版本的业务如果想做到用户无感知升级，可以去掉该语法：
         *        indentedCodeBlock：false
         */
        indentedCodeBlock: true,
      },
      emoji: {
        useUnicode: true, // 是否使用unicode进行渲染
      },
      fontEmphasis: {
        allowWhitespace: false, // 是否允许首尾空格
      },
      strikethrough: {
        needWhitespace: false, // 是否必须有首位空格
      },
      mathBlock: {
        engine: 'MathJax', // katex或MathJax
        src: '',
        plugins: true, // 默认加载插件
      },
      inlineMath: {
        engine: 'MathJax', // katex或MathJax
        src: '',
      },
      toc: {
        /** 默认只渲染一个目录 */
        allowMultiToc: false,
      },
      header: {
        /**
         * 标题的样式：
         *  - default       默认样式，标题前面有锚点
         *  - autonumber    标题前面有自增序号锚点
         *  - none          标题没有锚点
         */
        anchorStyle: 'default',
      },
    },
  },
  editor: {
    theme: 'default', // depend on codemirror theme name: https://codemirror.net/demo/theme.htm
    // 编辑器的高度，默认100%，如果挂载点存在内联设置的height则以内联样式为主
    height: '100%',
    // defaultModel 编辑器初始化后的默认模式，一共有三种模式：1、双栏编辑预览模式；2、纯编辑模式；3、预览模式
    // edit&preview: 双栏编辑预览模式
    // editOnly: 纯编辑模式（没有预览，可通过toolbar切换成双栏或预览模式）
    // previewOnly: 预览模式（没有编辑框，toolbar只显示“返回编辑”按钮，可通过toolbar切换成编辑模式）
    defaultModel: 'edit&preview',
    // 粘贴时是否自动将html转成markdown
    convertWhenPaste: true,
  },
  toolbars: {
    theme: 'dark', // light or dark
    showToolbar: true, // false：不展示顶部工具栏； true：展示工具栏; toolbars.showToolbar=false 与 toolbars.toolbar=false 等效
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
        insert: [
          'image',
          'audio',
          'video',
          'link',
          'hr',
          'br',
          'code',
          'formula',
          'toc',
          'table',
          'line-table',
          'bar-table',
          'pdf',
          'word',
        ],
      },
      'graph',
      'settings',
    ],
    sidebar: [],
    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'], // array or false
    float: ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'], // array or false
  },
  fileUpload: callbacks.fileUpload,
  callback: {
    afterChange: callbacks.afterChange,
    afterInit: callbacks.afterInit,
    beforeImageMounted: callbacks.beforeImageMounted,
  },
  previewer: {
    dom: false,
    className: 'cherry-markdown',
    // 是否启用预览区域编辑能力（目前支持编辑图片尺寸、编辑表格内容）
    enablePreviewerBubble: true,
  },
  // 预览页面不需要绑定事件
  isPreviewOnly: false,
  // 预览区域跟随编辑器光标自动滚动
  autoScrollByCursor: true,
  // 外层容器不存在时，是否强制输出到body上
  forceAppend: true,
}
```

### More Information

Click [here](./docs/configuration.md) for the full documentation of Cherry configuration.

## Example

Click [here](./examples/) for more examples.
### Client
[cherry-markdown client](./docs/cherry_editor_client.md)

## Extension

### Customize Syntax

```javascript
/*
 * Generate a hook to block sensitive words
 * named blockSensitiveWords
 * The scope is the entire page
 * The matching rules will be attached to the RULE attribute of the instance
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', 'page', {
  makeHtml(str) {
    return str.replace(this.RULE.reg, '***');
  },
  rule(str) {
    return {
      reg: /sensitive words/g,
    };
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  engine: {
    customSyntax: {
      // Inject into the editor's custom grammar
      BlockSensitiveWordsHook: {
      syntaxClass: BlockSensitiveWordsHook,
      // If there is a Hook with the same name and it will be Forcibly covered 
      force: true,
      // Called before the hook for processing the picture
      // before: 'image',
      },
    },
  },
});
```

### Customize Toolbar

```javascript
/*
  * generate a hook with prefix template
  * named AddPrefixTemplate
  * Icon css class icon-add-prefix
  */
let AddPrefixTemplate = Cherry.createSyntaxHook('AddPrefixTemplate', 'icon-add-prefix', {
  onClick(selection) {
    return 'Prefix-' + selection;
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  toolbars: {
    customMenu: {
      // Inject into the editor's menu
      AddPrefixTemplate,
    },
  },
});
```

Click [extensions](./docs/extensions.md) if you want knoe more extension about cherry markdown.

## Contributing

Welcome to join us to build a more powerful Markdown editor. Of course you can submit feature request to us. Please read[extensions](./docs/extensions.md) and [commit_convention](./docs/commit_convention.md) before you working on it.


## Stargazers over time

[![Stargazers over time](https://starchart.cc/Tencent/cherry-markdown.svg)](https://starchart.cc/Tencent/cherry-markdown)


## License

Apache-2.0
