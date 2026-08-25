<p align="center"><img src="logo/new_logo.png" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Writer

[![cnb 云原生开发](./logo/cnb-badge.svg)](https://cnb.cool/tencent/cherry-markdown/cherry-markdown) [![Cloud Studio Template](https://cs-res.codehub.cn/common/assets/icon-badge.svg)](https://cloudstudio.net#https://github.com/Tencent/cherry-markdown)

English | [简体中文](./README.CN.md)

## Introduction

Cherry Markdown Writer is a JavaScript Markdown editor. It has the advantages such as out-of-the-box, lightweight and easy to extend. It can run in browser or server(with Node.js).

## Document

- [Getting Started with Cherry Markdown Editor](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [hello world](https://github.com/Tencent/cherry-markdown/wiki/hello-world)
- [Configuring Image & File Upload Interfaces](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E5%9B%BE%E7%89%87&%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E6%8E%A5%E5%8F%A3)
- [Adjusting the Toolbar](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)
- [Comprehensive Configuration Options](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)
- [Custom Syntax](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)
- [Configuring Themes](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E4%B8%BB%E9%A2%98)
- [Extending Code Block Syntax](https://github.com/Tencent/cherry-markdown/wiki/%E6%89%A9%E5%B1%95%E4%BB%A3%E7%A0%81%E5%9D%97%E8%AF%AD%E6%B3%95)
- [Events & Callbacks](https://github.com/Tencent/cherry-markdown/wiki/%E4%BA%8B%E4%BB%B6&%E5%9B%9E%E8%B0%83)
- [Build Artifacts (Full / Core / Stream / Engine)](https://github.com/Tencent/cherry-markdown/wiki/%E6%9E%84%E5%BB%BA%E4%BA%A7%E7%89%A9%E4%BB%8B%E7%BB%8D)
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)

## Demos

- [Full Mode](https://tencent.github.io/cherry-markdown/examples/index.html)
- [Basic](https://tencent.github.io/cherry-markdown/examples/basic.html)
- [Mobile](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [Multiple Instances](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [Editor Without Toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [Pure Preview](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS](https://tencent.github.io/cherry-markdown/examples/xss.html) (Disabled by default; requires configuration to enable XSS)
- [IMG WYSIWYG](https://tencent.github.io/cherry-markdown/examples/img.html)
- [Table WYSIWYG](https://tencent.github.io/cherry-markdown/examples/table.html)
- [Headers with Auto Num](https://tencent.github.io/cherry-markdown/examples/head_num.html)
- [Streaming rendering Mode (AI chat scenario)](https://tencent.github.io/cherry-markdown/examples/ai_chat.html)
- [Streaming Mode - Lazy Loading Plugins](https://tencent.github.io/cherry-markdown/examples/ai_chat_stream.html)
- [VIM Editing Mode](https://tencent.github.io/cherry-markdown/examples/vim.html)
- [Utilize Your Own Mermaid.js](https://tencent.github.io/cherry-markdown/examples/mermaid.html)
- [Custom Code Block Wrapper](https://tencent.github.io/cherry-markdown/examples/custom_codeblock_wrapper.html)

## Features

- **Out-of-the-box** — Instantiate with a single call; most common Markdown syntax (headings, TOC, flowcharts, formulas, etc.) works by default.
- **Easy to extend** — Pure JavaScript implementation, no framework dependency (Angular/Vue/React only serve as container environments). Custom syntax, toolbar buttons and themes are all supported.
- **Streaming rendering** — Purpose-built for AI Chat scenarios. Auto-completes unfinished Markdown fragments during token streaming to prevent raw source flashing.
- **Rich editing experience** — Multi-cursor editing, floating & bubble toolbars, floating TOC, input autocomplete, VIM mode, shortcut key customization, and theme switching.
- **Powerful diagrams & media** — Mermaid diagrams (with drag-to-resize and alignment), math formulas, table-to-chart, image resize & alignment, audio/video embedding.
- **Export & interoperability** — Paste from rich text as Markdown, export to Image / PDF, WYSIWYG editing for images and tables.
- **High performance & secure** — Partial rendering & partial update; built-in whitelist filtering and DomPurify to prevent XSS.

For a visual walkthrough, see the [demo](https://tencent.github.io/cherry-markdown/examples/index.html).

## Downloads

### Desktop Client

Cherry Markdown ships a cross-platform desktop client (built with Tauri) for Windows, macOS and Linux. It supports opening / editing local `.md` / `.markdown` / `.txt` files with the same editing experience as the web version.

👉 **[Download the latest release](https://github.com/Tencent/cherry-markdown/releases?q=client&expanded=true)**

### VSCode Extension

Prefer editing Markdown right inside VSCode? Cherry Markdown also provides an official VSCode extension with the same rich editing & preview experience.

👉 **[Install from VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=cherryMarkdownPublisher.cherry-markdown)**

### Install as a package

Via yarn

```bash
yarn add cherry-markdown
```

Via npm

```bash
npm install cherry-markdown --save
```

### CDN usage

Use the UMD artifact for a regular `<script>` tag, and pin the package version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cherry-markdown@0.11.9/dist/cherry-markdown.min.css">
<script src="https://cdn.jsdelivr.net/npm/cherry-markdown@0.11.9/dist/cherry-markdown.js"></script>
```

The UMD artifact exposes the global `Cherry` variable. For native ESM:

```html
<script type="module">
  import Cherry from 'https://cdn.jsdelivr.net/npm/cherry-markdown@0.11.9/dist/cherry-markdown.esm.js';

  const cherry = new Cherry({ id: 'markdown-container' });
</script>
```


Cherry provides multiple build artifacts (Full / Core / Stream / Engine) to fit different scenarios such as browser, Node.js, and AI Chat streaming. For usage examples, bundle differences, mermaid integration and dynamic import, please refer to **[Build Artifacts Guide](https://github.com/Tencent/cherry-markdown/wiki/%E6%9E%84%E5%BB%BA%E4%BA%A7%E7%89%A9%E4%BB%8B%E7%BB%8D)**.

## Contribution Guidelines

Welcome to join us in building a powerful Markdown editor. Before implementing new features or submitting a pull request, please read:

- [Introduction to cherry-markdown editor](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86-cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [Contribution Guidelines](./CONTRIBUTING.md)

## License

[Apache-2.0](./LICENSE)
