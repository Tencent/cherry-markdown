# @cherry-markdown/miniprogram

> [!WARNING]
>
> 该包仍在早期开发中，稳定性和完备性尚未达到生产可用水平，请谨慎在生产环境中使用。

[English](./README.md)

## 用途

`@cherry-markdown/miniprogram` 将 Cherry Markdown 转换为结构化、WXML 友好的视图数据。它不提供现成的 WXML 组件、样式或交互事件；接入方需要使用自己的小程序模板渲染返回的 blocks 和 runs。

核心 Markdown 结构可使用小程序原生组件渲染，无需 WebView 或 DOM。未知或复杂 HTML 会返回为 `html` block，接入方可选择用 `rich-text` 降级渲染。

## 使用方式

```sh
npm install @cherry-markdown/miniprogram
```

该包仅提供 ESM，并只公开 `CherryStream`，它会自行创建并持有 Cherry engine。其 `setMarkdown()` 输入模型与 Web CherryStream 一致，但返回小程序视图数据而不是更新 DOM Previewer。SSE 请求、分帧和内容提取由应用负责。

小程序原生运行时不能直接执行 ESM 包，需要将 import 该包的应用源码构建为小程序运行时格式；Demo 使用 Rollup 完成该构建步骤。

### 流式渲染

```js
import CherryStream from '@cherry-markdown/miniprogram';

const page = this;
const cherry = new CherryStream();
let markdownContent = '';
function render(streaming) {
  page.setData({
    blocks: cherry.setMarkdown(markdownContent, { deferImages: !streaming }),
    streaming,
  });
}

function finishStream() {
  render(false);
}

// 业务侧 SSE 客户端提取 Markdown 字符串后调用。
function onMarkdownChunk(chunk) {
  markdownContent += chunk;
  render(true);
}

function onStreamComplete() {
  finishStream();
}
```

将完整累积的 Markdown 传给 `setMarkdown()`，与 Web `CherryStream.setMarkdown()` 一致。它会重新渲染当前完整内容，以保证未闭合语法也能得到正确的当前视图；包不处理 SSE 请求、字节解码、分帧或不同服务端的 JSON 协议。

为了正确处理未闭合的 Markdown 语法，`setMarkdown()` 会重新渲染已累积的 Markdown。流式过程中传入 `deferImages: true` 会渲染图片占位；流完成后用 `deferImages: false` 再渲染一次真实图片。模型高频输出时，应由页面层合并 `setData` 更新（例如每 50-100 ms 一次），不要每个 chunk 都刷新。

## 模块格式

| 入口                           | ESM                       |
| ------------------------------ | ------------------------- |
| `@cherry-markdown/miniprogram` | `dist/miniProgram.esm.js` |

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
| 图片        | `![alt](src)`                   | 流中占位，完成后为原生 image run    | ✅   |
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

完整的微信小程序 Demo 在 `examples/miniProgram` 目录下。安装其依赖并运行 `yarn --cwd examples/miniProgram build` 后，再在微信开发者工具中打开 `examples/miniProgram`。本地包和预览 tarball 的验证方式见 [Demo README](../../examples/miniProgram/README.md)。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
