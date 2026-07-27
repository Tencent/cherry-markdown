# @cherry-markdown/miniProgram

> [!WARNING]
>
> 该包仍在早期开发中，稳定性和完备性尚未达到生产可用水平，请谨慎在生产环境中使用。

[English](./README.md)

## 用途

`@cherry-markdown/miniProgram` 将 Cherry Markdown 转换为结构化、WXML 友好的视图数据。它不提供现成的 WXML 组件、样式或交互事件；接入方需要使用自己的小程序模板渲染返回的 blocks 和 runs。

核心 Markdown 结构可使用小程序原生组件渲染，无需 WebView 或 DOM。未知或复杂 HTML 会返回为 `html` block，接入方可选择用 `rich-text` 降级渲染。

## 使用方式

```sh
npm install @cherry-markdown/miniProgram
```

根据渲染流程选择入口。两个构造入口都会自行创建并持有 Cherry engine，正常使用不需要调用 `createMiniProgramEngine`。

一次性渲染使用 `MiniProgramStream`，持续累积流内容使用 `createMiniProgramStreamAdapter`。适配器在包内处理 SSE 分帧和不完整 Markdown 的兜底。

### 流式渲染

```js
import { createMiniProgramStreamAdapter } from '@cherry-markdown/miniProgram';

const page = this;
const adapter = createMiniProgramStreamAdapter();
let finished = false;

function applyState(state) {
  if (state) {
    page.setData({ blocks: state.blocks, streaming: state.streaming });
  }
}

function finishStream() {
  if (finished) return;
  finished = true;
  applyState(adapter.complete());
}

const requestTask = wx.request({
  url: 'https://your-llm-endpoint',
  enableChunked: true,
  responseType: 'arraybuffer',
  success() {
    // 响应分块已由 onChunkReceived 接收。
  },
  fail(error) {
    wx.showToast({ title: error.errMsg || '请求失败', icon: 'none' });
  },
  complete() {
    finishStream();
  },
});

requestTask.onChunkReceived(({ data }) => {
  const state = adapter.appendSseChunk(data);
  applyState(state);
  if (state?.done) {
    finished = true;
  }
});
```

`onChunkReceived` 会在每个 `ArrayBuffer` 到达时调用。`appendSseChunk()` 在包内处理 UTF-8 边界、SSE 帧、JSON 的 `content`/`delta`/`text` 字段和 `[DONE]`；`complete()` 用于刷新尾部帧，并在服务端未发送 `[DONE]` 时结束适配器。

为了正确处理未闭合的 Markdown 语法，`append()` 会重新渲染已累积的 Markdown。模型高频输出时，应由页面层合并 `setData` 更新（例如每 50-100 ms 一次），不要每个 chunk 都刷新。

### 静态渲染

```js
import CherryMiniProgramStream from '@cherry-markdown/miniProgram';

const stream = new CherryMiniProgramStream();
this.setData({ blocks: stream.setMarkdownView('# Hello\nMarkdown content') });
```

## 模块格式

| 入口                           | ESM                       |
| ------------------------------ | ------------------------- |
| `@cherry-markdown/miniProgram` | `dist/miniProgram.esm.js` |

## 支持功能

| 功能        | 语法                            | 渲染方式                            | 状态 |
| ----------- | ------------------------------- | ----------------------------------- | ---- |
| 段落        | 普通文本                        | 原生 `view` + `text` runs           | ✅   |
| 标题        | `#` `##` `###`                  | 原生 `view`，按级别设 class         | ✅   |
| 引用        | `>`                             | 原生子 block 数据                   | ✅   |
| 列表        | `-` / `1.`                      | Flexbox + marker 文本               | ✅   |
| 任务列表    | `- [x]` / `- [ ]`               | Flexbox，`☑`/`☐` 标记               | ✅   |
| 表格        | `\| 列1 \| 列2 \|`              | 原生表格行和单元格 runs             | ✅   |
| 代码块      | ` ```语言 ``` `                 | 高亮 runs，模板负责复制             | ✅   |
| 图片        | `![alt](src)`                   | 原生 image run，模板负责预览        | ✅   |
| 链接        | `[text](url)`                   | 含 `href` 的 text run，模板绑定点击 | ✅   |
| 行内公式    | `$E=mc^2$`                      | 文本 run 中保留公式源码             | ✅   |
| 公式块      | `$$...$$`                       | 公式源码 block，不做数学排版        | ✅   |
| Mermaid     | ` ```mermaid ``` `              | Mermaid 源码 block，不绘制图形      | ✅   |
| 加粗        | `**文字**`                      | `class="md-strong"`                 | ✅   |
| 斜体        | `*文字*`                        | `class="md-em"`                     | ✅   |
| 行内代码    | `` `代码` ``                    | `class="md-inline-code"`            | ✅   |
| 下划线      | `++文字++`                      | `class="md-underline"`              | ✅   |
| 删除线      | `~~文字~~`                      | `class="md-strike"`                 | ✅   |
| 上标 / 下标 | `~上标~` / `^下标^`             | 行内 text 带 class                  | ✅   |
| 换行        | 行尾两空格                      | `\n` 文本                           | ✅   |
| 自动链接    | `https://...`                   | 同链接处理                          | ✅   |
| Emoji       | `:smile:`                       | Image 组件                          | ✅   |
| 流光标      | （流模式专用）                  | `\|` 光标符                         | ✅   |
| 脚注引用    | `[^key]`                        | Sup/link 数据，模板负责跳转         | ✅   |
| Panel       | `:::tip/warning/danger/success` | 普通段落，样式丢失                  | ❌   |
| 脚注正文    | （自动生成）                    | 普通段落，样式丢失                  | ❌   |
| 颜色 / 字号 | `==color=red text==`            | Attribute 保留，WXML 忽略           | ❌   |
| 对齐        | `:::left/center/right`          | CSS class 不被消费                  | ❌   |
| 目录        | `[TOC]`                         | 列表结构正常，样式丢失              | ❌   |
| 分割线      | `---`                           | Rich-text 回退                      | ❌   |
| 折叠详情    | `+++`                           | Rich-text 回退，静态展示            | ❌   |
| 注音        | `{ Ruby }`                      | Rich-text 回退                      | ❌   |
| 原始 HTML   | `<div>...</div>`                | Rich-text 回退                      | ❌   |
| 建议列表    | （编辑器专用）                  | 不参与渲染                          | —    |
| FrontMatter | `---yaml---`                    | 默认不渲染                          | —    |

该包只返回 WXML 友好的数据。随包 Demo 展示了一种常用 block 模板实现，包括代码复制、图片预览、链接处理和 `html` 降级；应用需要自行提供模板、样式和事件处理。

## Demo

完整的微信小程序 Demo 在 `examples/miniProgram` 目录下。

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram.esm.js examples/miniProgram/miniprogram/vendor/cherry-mini-program.js
```

在微信开发者工具中打开 `examples/miniProgram`。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
