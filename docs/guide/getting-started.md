# 快速开始

## 安装

###### 通过 yarn

```bash
yarn add cherry-markdown
```

###### 通过 npm

```bash
npm install cherry-markdown --save
```

如果需要开启 `mermaid` 画图、表格自动转图表功能，需要同时添加`mermaid` 与`echarts`包。

目前 Cherry 推荐的插件版本为`echarts@4.6.0`、`mermaid@8.11.1`

```bash
# 安装mermaid依赖开启mermaid画图功能
yarn add mermaid@8.11.1
# 安装echarts依赖开启表格自动转图表功能
yarn add echarts@4.6.0
```

## 使用

::: tip
如果你想了解详细配置选项？跳至 [基础配置](../configuration/base)。
:::


### Browser - UMD

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

### Browser - ESM

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

因 `mermaid` 库尺寸非常大，Cherry 构建产物中包含了不内置 mermaid 的核心构建包，可按以下方式引入核心构建。

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

### 关于 mermaid <Badge type="warning">⚠️警告</Badge>

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
