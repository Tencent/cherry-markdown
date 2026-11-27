---
'@cherry-markdown/milkdown': minor
---

`cherryMilkdown()` 现在统一使用 Shadow DOM 并自动加载样式。移除 `@cherry-markdown/milkdown/style.css` 入口，接入方可以通过 CSS 变量和 `::part()` 定制编辑区。

新增 `createEChartsRenderers({ transformOption })`，代码块和表格图表都可以覆盖预览数据，原配置和 Markdown 按原样保存。
