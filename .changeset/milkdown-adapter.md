---
'@cherry-markdown/milkdown': minor
'cherry-markdown': minor
---

新增按实例启用的 `milkdown()` 即见即所得预览编辑扩展和 Cherry 异步扩展生命周期。原 CodeMirror、工具栏、主题、布局和 Markdown 数据源保持不变；CommonMark/GFM、数学公式和 Cherry 行内排版可直接编辑，TOC、frontmatter、panel、detail、HTML 与图表保持可视化和 Markdown 可逆。预览编辑改为无延迟 revision 同步，表格 ECharts 复用 Cherry 原生渲染并在销毁时释放实例与 observer，同时增加完整语法清单、发布包 consumer build、快速编辑、像素对比和跨浏览器压力门禁。
