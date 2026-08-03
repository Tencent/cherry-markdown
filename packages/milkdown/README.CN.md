# @cherry-markdown/milkdown

> [!WARNING]
>
> 该包仍在早期开发中。目前会从 `cherry-markdown/dist` 私有路径导入 CherryEngine，请保持两个包的版本兼容。

[English](./README.md)

这是一个框架无关的 Milkdown 与 Cherry Markdown 适配包。CommonMark/GFM 使用 Milkdown 原生文档模型，Cherry 独有语法以 raw 原子节点保留，并统一交给 CherryEngine 渲染。

## 安装

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown
```

全局引入一次基础样式：

```js
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
```

## 使用

```js
import { createCherryMilkdown } from '@cherry-markdown/milkdown';

const editor = await createCherryMilkdown({
  root: document.querySelector('#editor'),
  previewRoot: document.querySelector('#preview'),
  value: '# 标题\n\n[[toc]]',
  onChange({ markdown, html }) {
    console.log(markdown, html);
  },
});

editor.setMarkdown('# 更新后的内容');
console.log(editor.getMarkdown());

// 页面销毁时：
await editor.destroy();
```

`previewRoot` 可选。不传时仍会创建 CherryEngine，并通过 `onChange` 返回渲染后的 HTML，同时可以把它作为纯 Milkdown 编辑器使用。

双击 Cherry raw 节点可编辑原始 Markdown。内置保真范围包括 frontmatter、公式、TOC、评论引用、panel、detail、Cherry 行内格式、原始 HTML，以及 Mermaid/PlantUML/ECharts 代码块。

## 自定义语法

业务自定义语法需要显式注册：

```js
await createCherryMilkdown({
  root,
  rawPatterns: [{ name: 'mention', kind: 'inline', pattern: /@\[[^\]]+\]/ }],
});
```

该包不会读取 Cherry 私有 Hook；未注册的自定义语法可能被 Milkdown 规范化。

仓库内可运行 `yarn build && npx vite examples` 查看最小 Vanilla 示例。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
