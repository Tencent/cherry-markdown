<p align="center"><img src="logo/logo--color.svg" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Editor

## 介绍

Cherry Markdown Editor 是一款 Javascript Markdown 编辑器，具有开箱即用、轻量简洁、易于扩展等特点. 它可以运行在浏览器或服务端(NodeJs).

### **开箱即用**

开发者可以使用非常简单的方式调用并实例化Cherry Markdown编辑器，实例化的编辑器默认支持大部分常用的markdown语法（如标题、目录、流程图、公式等）。

### **易于拓展**

当 Cherry Markdown 编辑器支持的语法不满足开发者需求时，可以快速的进行二次开发或功能扩展。同时，CherryMarkdown编辑器应该由纯JavaScript实现，不应该依赖angular、vue、react等框架技术，框架只提供容器环境即可。

DEMO **Coming soon**

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

1. 复制Html粘贴成MD语法
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

Cherry Markdown 有内置的安全 Hook，通过过滤白名单以及DomPurify进行扫描过滤.

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
<link href="cheery-editor.min.css" />
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
const { default: Cherry } = require('cherry-markdown');
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
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

### 引擎模式  (语法编译)

```javascript
// 引入Cherry引擎核心构建
// 引擎配置项与Cherry通用，以下文档内容仅介绍Cherry核心包
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine({
  value: '# welcome to cherry editor!',
});
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

```javascript
  {
    editor: {
      theme: 'default'
    },
    toolbars:{
      theme: 'dark'
      toolbar : ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'insert', 'graph', 'togglePreview'],
      bubble : ['bold', 'italic', 'strikethrough', 'sub', 'sup', '|', 'size'],
      float : ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'],
      customMenu: []
    },
    engine: {
      syntax: {
        table: {
          enableChart: false,
          externals: [ 'echarts' ]
        },
      },
      customSyntax: {}
    },
    externals: {},
    fileUpload(file, callback) {
      // api.post(file).then(url => {
      //   callback(url)
      // })
    }
  }
```

### 更多信息

如果你想自定义配置信息，可以看这里 [Configuration](./docs/configuration.CN.md)

## 例子

点击查看 [examples](./examples/)

## 拓展

### 自定义语法

```javascript
/*
 * 生成一个屏蔽敏感词汇的hook
 * 名字叫blockSensitiveWords
 * 范围是整个页面
 * 匹配规则会挂载到实例的RULE属性上
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', 'page', {
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

### 自定义工具栏

```javascript
/*
  * 生成一个添加前缀模板的hook
  * 名字叫AddPrefixTemplate
  * 图标类名icon-add-prefix
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
      // 注入编辑器的菜单中
      AddPrefixTemplate,
    },
  },
});
```

如果你想看更多有关 cherry markdown 的拓展信息，可以看这里 [extensions](./docs/extensions.CN.md).

## Contributing

欢迎加入我们打造强大的 Markdown 编辑器。当然你也可以给我们提交特性需求的 issue。 在写特性功能之前，你需要了解 [extensions](./docs/extensions.CN.md) 以及  [commit_convention](./docs/commit_convention.CN.md).

## License

Apache-2.0
