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

| 功能 | 语法 | 渲染方式 | 状态 |
| 段落 | 普通文本 | 原生 `view` + `text` runs | ✅ |
| 标题 | `#` `##` `###` | 原生 `view`，按级别设 class | ✅ |
| 引用 | `>` | 原生 `view`，递归渲染子块 | ✅ |
| 列表 | `-` / `1.` | Flexbox + marker 文本 | ✅ |
| 任务列表 | `- [x]` / `- [ ]` | Flexbox，`☑`/`☐` 标记 | ✅ |
| 表格 | `\| 列1 \| 列2 \|` | Flexbox + 横向滚动，单元格可交互 | ✅ |
| 代码块 | ` ```语言 ``` ` | Token 级高亮，支持复制 | ✅ |
| 图片 | `![alt](src)` | 原生 `image`，点击预览 | ✅ |
| 链接 | `[text](url)` | 原生 `text` + `bindtap` | ✅ |
| 行内公式 | `$E=mc^2$` | 等宽 `text` + class | ✅ |
| 公式块 | `$$...$$` | 等宽 `text` + class | ✅ |
| Mermaid | ` ```mermaid ``` ` | 源码卡片，支持复制 | ✅ |
| 加粗 | `**文字**` | `class="md-strong"` | ✅ |
| 斜体 | `*文字*` | `class="md-em"` | ✅ |
| 行内代码 | `` `代码` `` | `class="md-inline-code"` | ✅ |
| 下划线 | `++文字++` | `class="md-underline"` | ✅ |
| 删除线 | `~~文字~~` | `class="md-strike"` | ✅ |
| 上标 / 下标 | `~上标~` / `^下标^` | 行内 text 带 class | ✅ |
| 换行 | 行尾两空格 | `\n` 文本 | ✅ |
| 自动链接 | `https://...` | 同链接处理 | ✅ |
| Emoji | `:smile:` | Image 组件 | ✅ |
| 流光标 | （流模式专用） | `|` 光标符 | ✅ |
| 脚注引用 | `[^key]` | Sup + link 渲染 | ✅ |
| Panel | `:::tip/warning/danger/success` | 普通段落，样式丢失 | ❌ |
| 脚注正文 | （自动生成） | 普通段落，样式丢失 | ❌ |
| 颜色 / 字号 | `==color=red text==` | Attribute 保留，WXML 忽略 | ❌ |
| 对齐 | `:::left/center/right` | CSS class 不被消费 | ❌ |
| 目录 | `[TOC]` | 列表结构正常，样式丢失 | ❌ |
| 分割线 | `---` | Rich-text 回退 | ❌ |
| 折叠详情 | `+++` | Rich-text 回退，静态展示 | ❌ |
| 注音 | `{ Ruby }` | Rich-text 回退 | ❌ |
| 原始 HTML | `<div>...</div>` | Rich-text 回退 | ❌ |
| 建议列表 | （编辑器专用） | 不参与渲染 | — |
| FrontMatter | `---yaml---` | 默认不渲染 | — |

核心 markdown 语法（标题、段落、列表、表格、代码块、图片、链接、数学公式、行内样式）全部原生 WXML 渲染，支持完整交互（代码复制、图片预览、链接跳转）。

## Demo

完整的微信小程序 Demo 在 `examples/miniProgram` 目录下。

```sh
cp node_modules/@cherry-markdown/miniProgram/dist/miniProgram-stream.js examples/miniProgram/miniprogram/vendor/cherry-mini-program-stream.js
```

在微信开发者工具中打开 `examples/miniProgram`。
