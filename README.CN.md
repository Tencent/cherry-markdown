<p align="center"><img src="logo/new_logo.png" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Writer

[![cnb 云原生开发](./logo/cnb-badge.svg)](https://cnb.cool/tencent/cherry-markdown/cherry-markdown) [![Cloud Studio Template](https://cs-res.codehub.cn/common/assets/icon-badge.svg)](https://cloudstudio.net#https://github.com/Tencent/cherry-markdown)

简体中文 | [English](./README.md)

## 介绍

Cherry Markdown Writer 是一款 JavaScript Markdown 编辑器，具有开箱即用、轻量简洁、易于扩展等特点。它可以运行在浏览器或服务端（Node.js）。

## 文档

- [初识 cherry-markdown 编辑器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [hello world](https://github.com/Tencent/cherry-markdown/wiki/hello-world)
- [配置图片&文件上传接口](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E5%9B%BE%E7%89%87&%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E6%8E%A5%E5%8F%A3)
- [调整工具栏](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)
- [配置项全解](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)
- [自定义语法](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)
- [配置主题](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E4%B8%BB%E9%A2%98)
- [扩展代码块语法](https://github.com/Tencent/cherry-markdown/wiki/%E6%89%A9%E5%B1%95%E4%BB%A3%E7%A0%81%E5%9D%97%E8%AF%AD%E6%B3%95)
- [事件 & 回调](https://github.com/Tencent/cherry-markdown/wiki/%E4%BA%8B%E4%BB%B6&%E5%9B%9E%E8%B0%83)
- [构建产物介绍（完整 / 核心 / 流式 / 引擎）](https://github.com/Tencent/cherry-markdown/wiki/%E6%9E%84%E5%BB%BA%E4%BA%A7%E7%89%A9%E4%BB%8B%E7%BB%8D)
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)

## 演示

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
- [流式输入模式 - 可选插件懒加载](https://tencent.github.io/cherry-markdown/examples/ai_chat_stream.html)
- [VIM 编辑模式](https://tencent.github.io/cherry-markdown/examples/vim.html)
- [使用自带或自定义的 Mermaid.js](https://tencent.github.io/cherry-markdown/examples/mermaid.html)
- [自定义代码块外层容器](https://tencent.github.io/cherry-markdown/examples/custom_codeblock_wrapper.html)

## 特性

- **开箱即用** — 简单一行即可实例化，默认支持标题、目录、流程图、公式等绝大多数常用 Markdown 语法。
- **易于扩展** — 纯 JavaScript 实现，不依赖 Angular / Vue / React 等框架（框架仅作为容器环境），支持自定义语法、工具栏按钮及主题。
- **流式渲染** — 为 AI Chat 场景专门优化，在流式输出过程中自动补全未闭合的 Markdown 片段，避免源码闪现。
- **丰富的编辑体验** — 多光标编辑、浮动工具栏与气泡工具栏、悬浮目录、输入联想、VIM 模式、快捷键自定义、主题切换等。
- **强大的图表与富媒体** — Mermaid 图表（支持拖拽缩放与对齐）、数学公式、表格转图表、图片缩放与对齐、音视频嵌入。
- **导出与互操作** — 支持从富文本粘贴为 Markdown、导出为图片 / PDF、图片与表格所见即所得编辑。
- **高性能与安全** — 局部渲染 + 局部更新；内置白名单过滤与 DomPurify，防止 XSS 攻击。

更多特性演示见 [demo](https://tencent.github.io/cherry-markdown/examples/index.html)。

## 下载与安装

### 桌面客户端

Cherry Markdown 提供基于 Tauri 构建的跨平台桌面客户端，支持 Windows、macOS 和 Linux。可直接打开、编辑本地的 `.md` / `.markdown` / `.txt` 文件，编辑体验与 Web 版一致。

👉 **[点此下载最新版客户端](https://github.com/Tencent/cherry-markdown/releases?q=client&expanded=true)**

### VSCode 插件

习惯在 VSCode 里写 Markdown？Cherry Markdown 也提供了官方 VSCode 插件，带来与 Web 版一致的富编辑与预览体验。

👉 **[前往 VSCode 应用市场安装](https://marketplace.visualstudio.com/items?itemName=cherryMarkdownPublisher.cherry-markdown)**

### 安装组件

通过 yarn

```bash
yarn add cherry-markdown
```

通过 npm

```bash
npm install cherry-markdown --save
```

### CDN 使用

普通 `<script>` 场景使用 UMD 产物，并固定版本号：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cherry-markdown@0.11.9/dist/cherry-markdown.min.css">
<script src="https://cdn.jsdelivr.net/npm/cherry-markdown@0.11.9/dist/cherry-markdown.js"></script>
```

UMD 产物会暴露全局变量 `Cherry`。需要使用原生 ESM 时：

```html
<script type="module">
  import Cherry from 'https://cdn.jsdelivr.net/npm/cherry-markdown@0.11.9/dist/cherry-markdown.esm.js';

  const cherry = new Cherry({ id: 'markdown-container' });
</script>
```


Cherry 提供多种构建产物（完整包 / 核心包 / 流式输出包 / 引擎包），以适配浏览器、Node.js、AI Chat 流式输出等不同场景。使用示例、构建包差异、mermaid 集成方式及异步动态加载等详细内容，请参考 **[构建产物介绍](https://github.com/Tencent/cherry-markdown/wiki/%E6%9E%84%E5%BB%BA%E4%BA%A7%E7%89%A9%E4%BB%8B%E7%BB%8D)**。

## 贡献指南

欢迎加入我们，一起打造强大的 Markdown 编辑器。在实现新功能或提交特性前，请先阅读：

- [初识 cherry markdown 编辑器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86-cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [贡献指南](https://github.com/Tencent/cherry-markdown/wiki/%E8%B4%A1%E7%8C%AE%E6%8C%87%E5%8D%97%20Contribution%20Guidelines)

## License

[Apache-2.0](./LICENSE)
