# Cherry Markdown MiniProgram Demo

> **Warning / 警告**
>
> This package is in early development. Stability and completeness have not yet reached production level. Use with caution in production environments.
>
> 该包仍在早期开发中，稳定性和完备性尚未达到生产可用水平，请谨慎在生产环境中使用。

---

English | [简体中文](#简体中文)

## English

Minimal WeChat MiniProgram demo for stream rendering Markdown with `@cherry-markdown/miniProgram`.

### Run

```sh
yarn workspace @cherry-markdown/miniProgram build
cp packages/miniProgram/dist/miniProgram.esm.js examples/miniProgram/miniprogram/vendor/cherry-mini-program.js
```

Open `examples/miniProgram` in WeChat DevTools. Build npm is **not** required — the demo uses a local vendor bundle.

### What's Covered

- Paragraph, heading, list/task list, blockquote, table, code block, image, link — all rendered as native WXML components
- Streaming: chunks are accumulated, incomplete syntax normalized, images deferred until stream ends
- Streaming: the page accumulates Markdown strings and calls `CherryStream.setMarkdown`; local chunk simulation stays in Demo-only `utils/mock-stream.js`
- Interactions: code copy, image preview, link tap

### Stream Integration

```js
import CherryStream from '../../vendor/cherry-mini-program.js';

const cherry = new CherryStream();
let markdownContent = '';

const task = wx.request({ url: 'https://...', enableChunked: true, responseType: 'arraybuffer' });
// Extract a Markdown string from your transport, then append it.
onMarkdownChunk((chunk) => {
  markdownContent += chunk;
  this.setData({ blocks: cherry.setMarkdown(markdownContent) });
});
```

---

## 简体中文

使用 `@cherry-markdown/miniProgram` 在小程序中流式渲染 Markdown 的最小示例。

### 运行

```sh
yarn workspace @cherry-markdown/miniProgram build
cp packages/miniProgram/dist/miniProgram.esm.js examples/miniProgram/miniprogram/vendor/cherry-mini-program.js
```

在微信开发者工具中打开 `examples/miniProgram`。Demo 使用本地 vendor 文件，**无需 Build npm**。

### 覆盖能力

- 段落、标题、列表/任务列表、引用、表格、代码块、图片、链接 — 全部原生 WXML 组件渲染
- 流式：chunk 累积、不完整语法自动规整、流中图片延迟加载
- 流式：页面累积 Markdown 字符串并调用 `CherryStream.setMarkdown`；本地分片模拟仅在 Demo 的 `utils/mock-stream.js` 中实现
- 交互：代码复制、图片预览、链接跳转

### 流式接入示例

```js
import CherryStream from '../../vendor/cherry-mini-program.js';

const cherry = new CherryStream();
let markdownContent = '';

const task = wx.request({ url: 'https://...', enableChunked: true, responseType: 'arraybuffer' });
// 从传输层提取 Markdown 字符串后追加。
onMarkdownChunk((chunk) => {
  markdownContent += chunk;
  this.setData({ blocks: cherry.setMarkdown(markdownContent) });
});
```
