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

### 原生 WXML 渲染

- 段落、标题 (h1-h6)、引用、列表、任务列表
- 表格（flexbox，支持横向滚动，单元格可交互）
- 代码块（token 级语法高亮，支持复制）
- 图片（原生 `<image>`，点击预览）
- 链接（原生 `<text>`，点击处理）
- 数学公式（行内 & 块级，等宽字体）
- Mermaid 图表（源码卡片）
- 加粗、斜体、行内代码、下划线、删除线、sub、sup、br
- 自动链接、Emoji

### `<rich-text>` 回退（内容可见，无交互）

- 分割线、Detail/Details、Ruby 注音、原始 HTML

### 内容可见但样式/语义丢失

- Panel（`:::tip/warning/danger/success`）— 内容渲染为普通段落，panel 样式丢失
- Color / BackgroundColor / Size — attribute 保留，但 WXML `<text>` 不支持 `style`
- 脚注列表 — 脚注容器样式丢失（行内引用正常渲染为 sup + link）
- 对齐 / 两端对齐 — CSS class 不被 WXML 消费
- 目录 Toc — 列表结构正常，容器样式丢失

### 编辑器特性（非渲染范畴）

- SuggestList、Suggester、FrontMatter、CommentReference

## Demo

完整的微信小程序 Demo 在 `examples/miniProgram` 目录下。

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

在微信开发者工具中打开 `examples/miniProgram`。
