<p align="center"><img src="logo/new_logo.png" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Writer

[![Cloud Studio Template](https://cs-res.codehub.cn/common/assets/icon-badge.svg)](https://cloudstudio.net#https://github.com/Tencent/cherry-markdown)

简体中文 | [English](./README.md)

## 介绍

Cherry Markdown Writer 是一款 Javascript Markdown 编辑器，具有开箱即用、轻量简洁、易于扩展等特点。它可以运行在浏览器或服务端（NodeJs）。

### 文档

- [初识 cherry-markdown 编辑器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [hello world](https://github.com/Tencent/cherry-markdown/wiki/hello-world)
- [配置图片&文件上传接口](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E5%9B%BE%E7%89%87&%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E6%8E%A5%E5%8F%A3)
- [调整工具栏](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)
- [配置项全解](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)
- [自定义语法](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)
- [配置主题](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E4%B8%BB%E9%A2%98)
- [扩展代码块语法](https://github.com/Tencent/cherry-markdown/wiki/%E6%89%A9%E5%B1%95%E4%BB%A3%E7%A0%81%E5%9D%97%E8%AF%AD%E6%B3%95)
- [事件 & 回调](https://github.com/Tencent/cherry-markdown/wiki/%E4%BA%8B%E4%BB%B6&%E5%9B%9E%E8%B0%83)
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)

### 演示

- [完整版](https://tencent.github.io/cherry-markdown/examples/index.html)
- [基础](https://tencent.github.io/cherry-markdown/examples/basic.html)
- [移动端](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [多实例](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [无工具栏](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [纯预览模式](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS 测试](https://tencent.github.io/cherry-markdown/examples/xss.html)（默认禁用，需配置后允许）
- [IMG WYSIWYG](https://tencent.github.io/cherry-markdown/examples/img.html)
- [表格编辑](https://tencent.github.io/cherry-markdown/examples/table.html)
- [自动编号标题](https://tencent.github.io/cherry-markdown/examples/head_num.html)
- [流式输入模式（AI chat 场景）](https://tencent.github.io/cherry-markdown/examples/ai_chat.html)
- [VIM 编辑模式](https://tencent.github.io/cherry-markdown/examples/vim.html)
- [使用自带或自定义的 Mermaid.js](https://tencent.github.io/cherry-markdown/examples/mermaid.html)
- [自定义代码块外层容器](https://tencent.github.io/cherry-markdown/examples/custom_codeblock_wrapper.html)

-----

### 开箱即用

开发者可以用非常简单的方式调用并实例化 Cherry Markdown 编辑器，实例化的编辑器默认支持绝大多数常用的 markdown 语法（例如标题、目录、流程图、公式等）。

### 易于扩展

当 Cherry Markdown 编辑器默认支持的语法无法满足需求时，可以进行二次开发或功能扩展。Cherry 基于纯 JavaScript 实现，不依赖 Angular、Vue、React 等框架（框架仅作为容器环境）。

### 流式渲染

开启流式渲染后，cherry会对以下语法进行**自动补全**，避免出现Markdown源码，以达到在流式输出过程中稳定输出的效果（[demo](https://tencent.github.io/cherry-markdown/examples/ai_chat.html)）：

- 标题
- 加粗、斜体
- 超链接
- 图片、音视频
- 行内代码块
- 段落代码块
- 行内公式
- 段落公式
- 无序列表
- 表格
- mermaid画图
- 脚注

## 功能

### 语法功能

1. 图片缩放、对齐与引用
2. 根据表格内容生成图表
3. 字体颜色与字号调整
4. 字体背景色、上标与下标
5. 插入清单（checklist）
6. 插入音视频
7. 流程图（mermaid）、公式（数学）
8. 信息面板

### 功能特性

1. 从富文本复制并粘贴为 Markdown
2. 经典换行与常规换行支持
3. 多光标编辑
4. 图片尺寸编辑
5. 表格编辑
6. 根据表格内容生成图表（表格 -> 图表）
7. 导出为图片或 PDF
8. 浮动工具栏：在新行行首出现
9. 气泡工具栏：选中文本时出现
10. 设置快捷键
11. 悬浮目录
12. 主题切换
13. 输入联想
14. AI Chat场景流式输出场景特别支持

### 性能特性

1. 局部渲染
2. 局部更新

### 安全

Cherry Markdown 内置安全钩子，通过白名单过滤和 DomPurify 进行扫描过滤。

### 样式主题

提供多种主题样式可选。

### 功能示例

点击查看功能演示 [Features demo](https://github.com/Tencent/cherry-markdown/wiki/%E7%89%B9%E6%80%A7%E5%B1%95%E7%A4%BA-features)

## 安装

通过 yarn

```bash
yarn add cherry-markdown
```

通过 npm

```bash
npm install cherry-markdown --save
```

如果需要启用 mermaid 绘图和表格转图表功能，需要同时安装 `mermaid` 与 `echarts`。

Cherry Markdown 内置了 mermaid，如果希望使用指定版本的 mermaid，可以参考 [wiki](https://github.com/Tencent/cherry-markdown/wiki/%E6%9E%84%E5%BB%BA%E4%BA%A7%E7%89%A9%E4%BB%8B%E7%BB%8D)

## 快速开始

### 浏览器

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

## 轻量版本

由于 mermaid 库体积较大，cherry 提供了不内置 mermaid 的核心构建包，可按需引入。

### 完整模式 (图形界面)

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### 引擎模式（语法编译）

```javascript
// 导入 Cherry 引擎核心构建包
// 引擎的配置项与 Cherry 相同，以下内容仅介绍 Cherry 核心包的用法
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');

// --> <h1>welcome to cherry editor!</h1>
```

### 关于 mermaid ⚠️

核心构建包不包含 mermaid 依赖，需要手动引入相关插件。

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// 插件注册必须在 Cherry 实例化之前完成
Cherry.usePlugin(CherryMermaidPlugin, {
  mermaid, // 传入 mermaid 对象
  // mermaidAPI: mermaid.mermaidAPI, // 也可以传入 mermaid API
  // 同时可以在这里配置 mermaid 的行为，参考 mermaid 官方文档
  // theme: 'neutral',
  // sequence: { useMaxWidth: false, showSequenceNumbers: true }
});

const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

从 mermaid v10.0.0 开始，渲染逻辑由同步改为异步，`afterChange` 或 `afterInit` 事件后，mermaid 代码块先渲染为占位符，再异步渲染替换。

如果需要在异步渲染完成后获取渲染结果，可以参考如下示例：

````javascript
const cherryInstance = new Cherry({
  id: 'markdown-container',
  // 使用模板字符串，内部直接包含 mermaid 的代码块
  value: `
    ```mermaid
    graph LR
        A[公司] -->| 下 班 | B(菜市场)
        B --> C{看见<br>卖西瓜的}
        C -->|Yes| D[买一个包子]
        C -->|No| E[买一斤包子]
    ```
  `,
  callback: {
    afterAsyncRender: (md, html) => {
      // md 是 markdown 源码，html 是渲染结果
    }
  }
});
````

### 异步加载

强烈推荐使用动态引入（Dynamic import），下面给出 webpack 动态引入的示例。

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
  // 插件注册必须在 Cherry 实例化之前完成
  const cherryInstance = new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
});
```

## 配置

所有配置项基本都在 `/src/Cherry.config.js` 中进行了标注，详见：[配置项全解](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)

## 示例

点击查看 [Wiki 示例](https://github.com/Tencent/cherry-markdown/wiki)

### 客户端

正在开发中，可查看 `packages/client/` 目录。

## 扩展

### 自定义语法

详见 [自定义语法文档](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)

### 自定义工具栏

cherry 支持五种工具栏位置，每个位置都可以扩展自定义工具按钮，详情见： [自定义工具栏按钮](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%B7%A5%E5%85%B7%E6%A0%8F%E6%8C%89%E9%92%AE)。

## 单元测试

已经添加了基础的 `Vitest` 配置,但是相关测试用例还未完善，欢迎大家提交提供丰富的测试用例。

## 贡献指南

欢迎加入我们，一起打造强大的 Markdown 编辑器。在实现新功能或提交特性前，请先阅读：

- [初识 cherry markdown 编辑器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86-cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [贡献指南](https://github.com/Tencent/cherry-markdown/wiki/%E8%B4%A1%E7%8C%AE%E6%8C%87%E5%8D%97%20Contribution%20Guidelines)

<a href="https://openomy.com/Tencent/cherry-markdown" target="_blank" style="display: block; width: 100%;" align="center">
  <img src="https://openomy.com/svg?repo=Tencent/cherry-markdown&chart=bubble&latestMonth=3" target="_blank" alt="Contribution Leaderboard" style="display: block; width: 100%;" />
</a>

## License

[Apache-2.0](./LICENSE)
