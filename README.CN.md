<p align="center"><img src="logo/logo--color.svg" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Editor

## 介绍

Cherry Markdown Editor 是一款 Javascript Markdown 编辑器，具有开箱即用、轻量简洁、易于扩展等特点. 它可以运行在浏览器或服务端(NodeJs).

### **开箱即用**

开发者可以使用非常简单的方式调用并实例化 Cherry Markdown 编辑器，实例化的编辑器默认支持大部分常用的 markdown 语法（如标题、目录、流程图、公式等）。

### **易于拓展**

当 Cherry Markdown 编辑器支持的语法不满足开发者需求时，可以快速的进行二次开发或功能扩展。同时，CherryMarkdown 编辑器应该由纯 JavaScript 实现，不应该依赖 angular、vue、react 等框架技术，框架只提供容器环境即可。

## 特性

### 语法特性

1. 图片缩放、对齐、引用
2. 根据表格内容生成图表
3. 字体颜色、字体大小
4. 字体背景颜色、上标、下标
5. checklist
6. 音视频

### 多种模式

1. 双栏编辑预览模式（支持同步滚动）
2. 纯预览模式
3. 无工具栏模式（极简编辑模式）
4. 移动端预览模式

### 功能特性

1. 复制 Html 粘贴成 MD 语法
2. 经典换行&常规换行
3. 多光标编辑
4. 图片尺寸
5. 导出长图、pdf
6. float toolbar 在新行行首支持快速工具栏
7. bubble toolbar 选中文字时联想出快速工具栏

### 性能特性

1. 局部渲染
2. 局部更新

### 安全

Cherry Markdown 有内置的安全 Hook，通过过滤白名单以及 DomPurify 进行扫描过滤.

### 样式主题

Cherry Markdown 有多种样式主题选择

### 特性展示

这里可以看到特性的简短的演示 [screenshot](./docs/features.md)

### 在线体验

- [basic](https://tencent.github.io/cherry-markdown/examples/index.html)
- [H5](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [多实例](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [无 toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [纯预览模式](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [注入](https://tencent.github.io/cherry-markdown/examples/xss.html)（默认防注入，需要配置才允许注入）
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)
- [图片所见即所得编辑尺寸](https://tencent.github.io/cherry-markdown/examples/img.html)
- [表格编辑](https://tencent.github.io/cherry-markdown/examples/table.html)
- [标题自动序号](https://tencent.github.io/cherry-markdown/examples/head_num.html)

## 安装

通过 yarn

```bash
yarn add cherry-markdown
```

通过 npm

```bash
npm install cherry-markdown --save
```

如果需要开启 `mermaid` 画图、表格自动转图表功能，需要同时添加`mermaid` 与`echarts`包。

目前**Cherry**推荐的插件版本为`echarts@4.6.0`、`mermaid@8.11.1`

```bash
# 安装mermaid依赖开启mermaid画图功能
yarn add mermaid@8.11.1
# 安装echarts依赖开启表格自动转图表功能
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

## 使用轻量版本

因 mermaid 库尺寸非常大，Cherry 构建产物中包含了不内置 mermaid 的核心构建包，可按以下方式引入核心构建。

### 完整模式 (图形界面)

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### 引擎模式 (语法编译)

```javascript
// 引入Cherry引擎核心构建
// 引擎配置项与Cherry通用，以下文档内容仅介绍Cherry核心包
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');

// --> <h1>welcome to cherry editor!</h1>
```

### ⚠️ 关于 mermaid

核心构建包不包含 mermaid 依赖，需要手动引入相关插件。

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// 插件注册必须在Cherry实例化之前完成
Cherry.usePlugin(CherryMermaidPlugin, {
  mermaid, // 传入mermaid引用
  // mermaidAPI: mermaid.mermaidAPI, // 也可以传入mermaid API
  // 同时可以在这里配置mermaid的行为，可参考mermaid官方文档
  // theme: 'neutral',
  // sequence: { useMaxWidth: false, showSequenceNumbers: true }
});

const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### 异步加载

**recommend** 使用异步引入，以下为 webpack 异步引入样例。

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';

const registerPlugin = async () => {
  const [{ default: CherryMermaidPlugin }, mermaid] = await Promise.all([
    import('cherry-markdown/src/addons/cherry-code-block-mermaid-plugin'),
    import('mermaid'),
  ]);
  Cherry.usePlugin(CherryMermaidPlugin, {
    mermaid, // 传入mermaid引用
  });
};

registerPlugin().then(() => {
  // 插件注册必须在Cherry实例化之前完成
  const cherryInstance = new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
});
```

## 配置

### 默认配置

````javascript
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
      autoLink: {
        /** 是否开启短链接 */
        enableShortLink: true,
        /** 短链接长度 */
        shortLinkLength: 20,
      },
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
    codemirror: {
      // depend on codemirror theme name: https://codemirror.net/demo/theme.html
      // 自行导入主题文件: `import 'codemirror/theme/<theme-name>.css';`
      theme: 'default',
    },
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
````

### 关闭浮动菜单和气泡菜单

```javascript
  toolbars: {
    ... // other config
    bubble: false, // array or false
    float: false, // array or false
  },

```

### 更多信息

如果你想自定义配置信息，可以看这里 [Configuration](./docs/configuration.CN.md)

## 例子

点击查看 [examples](./examples/)

### 客户端

[cherry-markdown 桌面客户端](./docs/cherry_editor_client.CN.md)

## 拓展

### 自定义语法

#### sentence Syntax

如果编译内容没有额外特殊要求，使用普通语法

```javascript
/*
 * 生成一个屏蔽敏感词汇的hook
 * 名字叫blockSensitiveWords
 * 匹配规则会挂载到实例的RULE属性上
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', Cherry.constants.HOOKS_TYPE_LIST.SEN, {
  makeHtml(str) {
    return str.replace(this.RULE.reg, '***');
  },
  rule(str) {
    return {
      reg: /敏感词汇/g,
    };
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  engine: {
    customSyntax: {
      // 注入编辑器的自定义语法中
      BlockSensitiveWordsHook: {
        syntaxClass: BlockSensitiveWordsHook,
        // 有同名hook则强制覆盖
        force: true,
        // 在处理图片的hook之前调用
        // before: 'image',
      },
    },
  },
});
```

#### paragraph Syntax

如果编译内容要求不受外界影响，则使用段落语法

```javascript
/*
 * 生成一个屏蔽敏感词汇的hook
 * 名字叫blockSensitiveWords
 * 匹配规则会挂载到实例的RULE属性上
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
  // 开启缓存，用于保护内容
  needCache: true,
  // 预处理文本，避免受影响
  beforeMakeHtml(str) {
    return str.replace(this.RULE.reg, (match, code) => {
      const lineCount = (match.match(/\n/g) || []).length;
      const sign = this.$engine.md5(match);
      const html = `<div data-sign="${sign}" data-lines="${lineCount + 1}" >***</div>`;
      return this.pushCache(html, sign, lineCount);
    });
  },
  makeHtml(str, sentenceMakeFunc) {
    return str;
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
      // 注入编辑器的自定义语法中
      BlockSensitiveWordsHook: {
        syntaxClass: BlockSensitiveWordsHook,
        // 有同名hook则强制覆盖
        force: true,
        // 在处理图片的hook之前调用
        // before: 'image',
      },
    },
  },
});
```

### 自定义工具栏

```javascript
/*
 * 生成一个添加前缀模板的hook
 * 名字叫AddPrefixTemplate
 * 图标类名icon-add-prefix
 */
let AddPrefixTemplate = Cherry.createMenuHook('AddPrefixTemplate', 'icon-add-prefix', {
  onClick(selection) {
    return 'Prefix-' + selection;
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  toolbars: {
    toolbar: [
      'bold',
      // ...其他菜单项
      // @see src/Cherry.config.js
      'settings',
      'addPrefix', // 在顶部菜单栏的尾部添加自定义菜单项
    ],
    bubble: [
      'bold' /** ...其他菜单项 */,
      ,
      'color',
      'addPrefix', // 在气泡菜单（选中文本时出现）的尾部添加自定义菜单项
    ], // array or false
    float: [
      'h1' /** ...其他菜单项 */,
      ,
      'code',
      'addPrefix', // 在浮动菜单（在新的空行出现）的尾部添加自定义菜单项
    ], // array or false
    customMenu: {
      // 注入编辑器的菜单中
      // 对象 key 可以作为菜单项的名字（需要保证唯一），在上方的配置中使用
      addPrefix: AddPrefixTemplate,
    },
  },
});
```

如果你想看更多有关 cherry markdown 的拓展信息，可以看这里 [extensions](./docs/extensions.CN.md).

## 单元测试

选用 Jest 作为单元测试工具，主要看好其断言、支持异步和快照测试等功能。单元测试分为两个部分，CommonMark 用例测试和快照测试。

### CommonMark 测试用例

运行 `yarn run test:commonmark` 测试 CommonMark 官方用例，运行速度较快。

用例位于 `test/suites/commonmark.spec.json`， 比如：

```json
{
  "markdown": "  \tfoo\tbaz\t\tbim\n",
  "html": "<pre><code>foo\tbaz\t\tbim\n</code></pre>\n",
  "example": 2,
  "start_line": 363,
  "end_line": 368,
  "section": "Tabs"
},
```

对于这个测试点，Jest 会比对 `Cherry.makeHtml(" \tfoo\tbaz\t\tbim\n")` 生成的 html 与用例中的预期结果 `"<pre><code>foo\tbaz\t\tbim\n</code></pre>\n"`。Cherry Markdown 的匹配器已忽略 `data-line` 等私有属性。

CommonMark 规范及测试用例可参考：https://spec.commonmark.org/ 。

### 快照测试

调用 `yarn run test:snapshot` 运行快照测试，书写用例可参考 `test/core/hooks/List.spec.ts`，新用例第一次运行会自动生成快照，第二次会将生成内容与快照进行比对。如果需要重新生成快照，将 `test/core/hooks/__snapshots__` 下对应的旧快照删除再运行一次即可。

快照测试运行速度较慢，仅在易出错且包含 Cherry 特色语法的 Hook 上使用。

## Contributing

欢迎加入我们打造强大的 Markdown 编辑器。当然你也可以给我们提交特性需求的 issue。 在写特性功能之前，你需要了解 [extensions](./docs/extensions.CN.md) 以及 [commit_convention](./docs/commit_convention.CN.md).

## License

Apache-2.0
