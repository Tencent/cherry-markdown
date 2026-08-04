# @cherry-markdown/milkdown

[English](./README.md)

Cherry Markdown 的框架无关 Milkdown 所见即所得编辑器。编辑区本身就是最终内容视图，不需要独立预览栏。

## 能力

- CommonMark/GFM 使用 Milkdown 原生可编辑节点。
- 表格、任务列表、链接、图片、引用和代码块直接编辑。
- 行内和块级公式通过 KaTeX 直接渲染。
- Cherry 颜色、背景色、字号、上下标、ruby、下划线和高亮使用可编辑 mark。
- TOC、frontmatter、panel、detail、HTML、comment reference 和特殊图表代码块显示为可视化节点。
- Mermaid 默认渲染为图形；PlantUML、ECharts 可通过 `renderers` 接入业务渲染器。嵌入对象选中后可以按需编辑配置源码。

该包不会把 Cherry 扩展默认显示成 raw 源码卡片。业务自定义语法需要通过 Milkdown 插件提供 schema、parser、serializer 和 NodeView，未注册语法不宣称支持。

## 安装

```sh
npm install @cherry-markdown/milkdown @milkdown/kit @milkdown/plugin-math cherry-markdown katex mermaid
```

全局引入一次样式：

```js
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
import 'katex/dist/katex.min.css';
```

## 使用

```js
import { createCherryMilkdown } from '@cherry-markdown/milkdown';

const editor = await createCherryMilkdown({
  root: document.querySelector('#editor'),
  value: '# 标题\n\n行内公式 $E=mc^2$ 和 !!red 红色文字!!。',
  onChange({ markdown }) {
    console.log(markdown);
  },
});

editor.setMarkdown('# 更新后的内容');
console.log(editor.getMarkdown());
await editor.destroy();
```

`plugins` 会在内置 WYSIWYG 插件之后加载，可用于注册业务 NodeView。

`renderers` 可为特殊图表提供异步渲染；回调返回 HTML 字符串、清理函数或直接写入 `container`：

```js
createCherryMilkdown({
  root,
  renderers: {
    echarts: async ({ container, source }) => {
      const chart = createECharts(container, source);
      return () => chart.dispose();
    },
  },
});
```

## 本地示例

```sh
yarn build
npx vite examples
```

## 当前边界

CherryEngine 仍通过 `cherry-markdown/dist/cherry-markdown.engine.core.esm.js` 深层入口提供嵌入对象渲染。图表等复杂对象属于可视化原子节点：Mermaid 内置渲染，PlantUML/ECharts 需要 `renderers`；普通文本和行内格式可直接编辑。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
