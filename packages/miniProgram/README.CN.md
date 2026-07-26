# @cherry-markdown/miniProgram

> [!WARNING]
>
> 该包仍在早期开发中，稳定性和完备性尚未达到生产可用水平，请谨慎在生产环境中使用。

[English](./README.md)

## 用途

`@cherry-markdown/miniProgram` 提供 Cherry Markdown 在微信小程序中的原生渲染适配器。它将 Markdown 转换为结构化、WXML 友好的视图数据，全部使用小程序原生组件渲染——无需 WebView、无需 DOM，核心特性不依赖 `rich-text`。

## 使用方式

```sh
npm install @cherry-markdown/miniProgram
```

安装后构建产物在 `node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js`。
拷贝到小程序项目：

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js <your-miniprogram>/vendor/
```

### 流式渲染

```js
const { createMiniProgramStreamAdapter, createSseParser } = require('./vendor/miniProgram');

const adapter = createMiniProgramStreamAdapter();
const parser = createSseParser({
  onMessage: (event) => {
    const state = adapter.appendSseEvent(event);
    this.setData({ blocks: state.blocks, streaming: true });
  },
  onDone: () => {
    const state = adapter.finish();
    this.setData({ blocks: state.blocks, streaming: false });
  },
});

wx.request({
  url: 'https://your-llm-endpoint',
  enableChunked: true,
  responseType: 'arraybuffer',
  success(res) {
    parser.push(res.data);
  },
});
```

### 静态渲染

```js
const MiniProgramStream = require('./vendor/miniProgram').default;
const stream = new MiniProgramStream();
this.setData({ blocks: stream.setMarkdownView('# Hello\nMarkdown content') });
```

## 支持功能

- **段落、标题 (h1-h6)、引用、列表、任务列表** — 原生 view 组件
- **表格** — flexbox 布局支持横向滚动，单元格内链接/图片可交互
- **代码块** — token 级语法高亮，支持复制
- **图片** — 原生 `<image>` 组件，点击预览
- **链接** — 原生 `<text>` + 点击处理
- **数学公式（行内 & 块级）** — 等宽字体渲染
- **Mermaid 图表** — 源码卡片
- **流式渲染** — chunk 累积、不完整语法自动规整、流中图片延迟加载
- **SSE 集成** — 内置 `createSseParser` 解析 `text/event-stream`

> 部分 Cherry 语法特性（Panel、Color、Detail、Ruby）会降级为 `<rich-text>` 渲染，详见 PR 评论中的完整兼容性表格。

## Demo

完整的微信小程序 Demo 在 `examples/miniProgram` 目录下。

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

在微信开发者工具中打开 `examples/miniProgram`。
