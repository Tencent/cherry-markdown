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
cp packages/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

Open `examples/miniProgram` in WeChat DevTools. Build npm is **not** required — the demo uses a local vendor bundle.

### What's Covered

- Paragraph, heading, list/task list, blockquote, table, code block, image, link — all rendered as native WXML components
- Streaming: chunks are accumulated, incomplete syntax normalized, images deferred until stream ends
- SSE: `createSseParser` + `createMiniProgramStreamAdapter` for real-time streaming
- Interactions: code copy, image preview, link tap

### SSE Integration

```js
const { createMiniProgramStreamAdapter, createSseParser } = require('../../vendor/cherry-mini-program-stream');

const adapter = createMiniProgramStreamAdapter();
const parser = createSseParser({
  onMessage: (event) => this.setData(adapter.appendSseEvent(event)),
  onDone: () => this.setData(adapter.finish()),
});

const task = wx.request({ url: 'https://...', enableChunked: true, responseType: 'arraybuffer' });
task.onChunkReceived((res) => parser.push(res.data));
```

---

## 简体中文

使用 `@cherry-markdown/miniProgram` 在小程序中流式渲染 Markdown 的最小示例。

### 运行

```sh
yarn workspace @cherry-markdown/miniProgram build
cp packages/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

在微信开发者工具中打开 `examples/miniProgram`。Demo 使用本地 vendor 文件，**无需 Build npm**。

### 覆盖能力

- 段落、标题、列表/任务列表、引用、表格、代码块、图片、链接 — 全部原生 WXML 组件渲染
- 流式：chunk 累积、不完整语法自动规整、流中图片延迟加载
- SSE：`createSseParser` + `createMiniProgramStreamAdapter` 对接实时流
- 交互：代码复制、图片预览、链接跳转

### SSE 接入示例

```js
const { createMiniProgramStreamAdapter, createSseParser } = require('../../vendor/cherry-mini-program-stream');

const adapter = createMiniProgramStreamAdapter();
const parser = createSseParser({
  onMessage: (event) => this.setData(adapter.appendSseEvent(event)),
  onDone: () => this.setData(adapter.finish()),
});

const task = wx.request({ url: 'https://...', enableChunked: true, responseType: 'arraybuffer' });
task.onChunkReceived((res) => parser.push(res.data));
```
