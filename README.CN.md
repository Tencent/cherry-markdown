<p align="center"><img src="logo/logo--color.svg" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Editor
[![Cloud Studio Template](https://cs-res.codehub.cn/common/assets/icon-badge.svg)](https://cloudstudio.net#https://github.com/Tencent/cherry-markdown)

### 文档
- [初识cherry markdown 编辑器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [hello world](https://github.com/Tencent/cherry-markdown/wiki/hello-world)
- [配置图片&文件上传接口](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E5%9B%BE%E7%89%87&%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E6%8E%A5%E5%8F%A3)
- [调整工具栏](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)
- [自定义语法](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)
- [配置项全解](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)
- [配置主题](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E4%B8%BB%E9%A2%98)
- [扩展代码块语法](https://github.com/Tencent/cherry-markdown/wiki/%E6%89%A9%E5%B1%95%E4%BB%A3%E7%A0%81%E5%9D%97%E8%AF%AD%E6%B3%95)
- [事件&回调](https://github.com/Tencent/cherry-markdown/wiki/%E4%BA%8B%E4%BB%B6&%E5%9B%9E%E8%B0%83)
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)

### 在线体验

- [全功能](https://tencent.github.io/cherry-markdown/examples/index.html)
- [基础版](https://tencent.github.io/cherry-markdown/examples/basic.html)
- [H5](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [多实例](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [无 toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [纯预览模式](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [注入](https://tencent.github.io/cherry-markdown/examples/xss.html)（默认防注入，需要配置才允许注入）
- [图片所见即所得编辑尺寸](https://tencent.github.io/cherry-markdown/examples/img.html)
- [表格编辑](https://tencent.github.io/cherry-markdown/examples/table.html)
- [标题自动序号](https://tencent.github.io/cherry-markdown/examples/head_num.html)
- [流式输入模式（AI chart场景）](https://tencent.github.io/cherry-markdown/examples/ai_chat.html)
- [VIM 编辑模式](https://tencent.github.io/cherry-markdown/examples/vim.html)


-----

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

这里可以看到特性的简短的演示 [screenshot](https://github.com/Tencent/cherry-markdown/wiki/%E7%89%B9%E6%80%A7%E5%B1%95%E7%A4%BA-features)

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

目前**Cherry**推荐的插件版本为`echarts@4.6.0`、`mermaid@9.4.3`

```bash
# 安装mermaid依赖开启mermaid画图功能
yarn add mermaid@9.4.3
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
import 'cherry-markdown/dist/cherry-markdown.css';
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
import 'cherry-markdown/dist/cherry-markdown.css';
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
import 'cherry-markdown/dist/cherry-markdown.css';
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
import 'cherry-markdown/dist/cherry-markdown.css';
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
所有的配置基本都在/src/Cherry.config.js里进行了标注，具体[看这里](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)


## 例子

点击查看 [各种例子](https://github.com/Tencent/cherry-markdown/wiki)

### 客户端

正在开发中... ，可见`/client`目录

## 拓展

### 自定义语法
可以看[这里](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)

### 自定义工具栏
cherry有**五种**工具栏位置，如下：
![cherry工具栏](https://github.com/Tencent/cherry-markdown/assets/998441/fecbc23c-5e85-4072-9dc5-8c71faa9d700)

每个位置都可以增加自定义工具栏，具体可以看[这里](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%B7%A5%E5%85%B7%E6%A0%8F%E6%8C%89%E9%92%AE)


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

欢迎加入我们打造强大的 Markdown 编辑器。当然你也可以给我们提交特性需求的 issue。 在写特性功能之前，你需要了解 [这些内容](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8#%E4%BB%8E%E5%BC%80%E5%A7%8B%E5%88%B0%E4%B8%8B%E7%8F%AD)

## License

Apache-2.0
