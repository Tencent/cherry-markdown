# Cherry Markdown MiniProgram Demo

> **Warning / 警告**
>
> This package is in early development. Stability and completeness have not yet reached production level. Use with caution in production environments.
>
> 该包仍在早期开发中，稳定性和完备性尚未达到生产可用水平，请谨慎在生产环境中使用。

---

English | [简体中文](#简体中文)

## English

Minimal WeChat MiniProgram demo for stream rendering Markdown with `@cherry-markdown/miniprogram`.

### Run

```sh
yarn --cwd examples/miniProgram install
yarn --cwd examples/miniProgram build
```

The Demo source imports `@cherry-markdown/miniprogram` directly. Its build script compiles that ESM source into the ignored `miniprogram/pages/index/index.js` runtime file because native MiniProgram runtime does not directly load ESM files. Open `examples/miniProgram` in WeChat DevTools and compile; **Build npm is not required**.

To use the local package source instead, replace the package dependency and rebuild:

```sh
yarn --cwd examples/miniProgram add "@cherry-markdown/miniprogram@file:../../packages/miniProgram"
yarn --cwd examples/miniProgram build
```

To verify a pkg-pr-new tarball instead, install it into this Demo project, then rebuild the MiniProgram runtime file:

```sh
yarn --cwd examples/miniProgram add "@cherry-markdown/miniprogram@https://pkg.pr.new/Tencent/cherry-markdown/@cherry-markdown/miniprogram@1827.tgz"
yarn --cwd examples/miniProgram build
```

### What's Covered

- Paragraph, heading, list/task list, blockquote, table, code block, image, link — all rendered as native WXML components
- Streaming: chunks are accumulated, incomplete syntax normalized, images deferred until stream ends
- Streaming: the page accumulates Markdown strings and calls `CherryStream.setMarkdown`; local chunk simulation stays in Demo-only `src/utils/mock-stream.js`
- Interactions: code copy, image preview, link tap

### Stream Integration

```js
import CherryStream from '@cherry-markdown/miniprogram';

const cherry = new CherryStream();
let markdownContent = '';

// Extract a Markdown string from your transport, then add it to markdownContent.
onMarkdownChunk((chunk) => {
  markdownContent += chunk;
  this.setData({ blocks: cherry.setMarkdown(markdownContent, { deferImages: true }) });
});

onStreamComplete(() => {
  this.setData({ blocks: cherry.setMarkdown(markdownContent, { deferImages: false }) });
});
```

---

## 简体中文

使用 `@cherry-markdown/miniprogram` 在小程序中流式渲染 Markdown 的最小示例。

### 运行

```sh
yarn --cwd examples/miniProgram install
yarn --cwd examples/miniProgram build
```

Demo 源码会直接 import 已安装的 `@cherry-markdown/miniprogram`。由于小程序原生运行时不能直接加载 ESM 文件，构建脚本会把 ESM 源码编译为被忽略的 `miniprogram/pages/index/index.js` 运行文件。在微信开发者工具中打开 `examples/miniProgram` 后直接编译，**无需构建 npm**。

若要使用本地包源码，替换依赖后重新构建：

```sh
yarn --cwd examples/miniProgram add "@cherry-markdown/miniprogram@file:../../packages/miniProgram"
yarn --cwd examples/miniProgram build
```

若要验证 pkg-pr-new tarball，在该 Demo 项目中安装预览包后重新生成小程序运行文件：

```sh
yarn --cwd examples/miniProgram add "@cherry-markdown/miniprogram@https://pkg.pr.new/Tencent/cherry-markdown/@cherry-markdown/miniprogram@1827.tgz"
yarn --cwd examples/miniProgram build
```

### 覆盖能力

- 段落、标题、列表/任务列表、引用、表格、代码块、图片、链接 — 全部原生 WXML 组件渲染
- 流式：chunk 累积、不完整语法自动规整、流中图片延迟加载
- 流式：页面累积 Markdown 字符串并调用 `CherryStream.setMarkdown`；本地分片模拟仅在 Demo 的 `src/utils/mock-stream.js` 中实现
- 交互：代码复制、图片预览、链接跳转

### 流式接入示例

```js
import CherryStream from '@cherry-markdown/miniprogram';

const cherry = new CherryStream();
let markdownContent = '';

// 从传输层提取 Markdown 字符串后累积到 markdownContent。
onMarkdownChunk((chunk) => {
  markdownContent += chunk;
  this.setData({ blocks: cherry.setMarkdown(markdownContent, { deferImages: true }) });
});

onStreamComplete(() => {
  this.setData({ blocks: cherry.setMarkdown(markdownContent, { deferImages: false }) });
});
```
