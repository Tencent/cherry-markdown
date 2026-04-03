---
'cherry-markdown': patch
---

feat(mermaid): 添加 mermaid 代码块源码/预览切换工具栏功能

- 新增 mermaid 代码块的源码/预览切换工具栏，支持在渲染图和源码之间快速切换
- 新增 `engine.syntax.codeBlock.mermaid.showSourceToolbar` 配置项，可控制是否显示切换工具栏
- 支持多主题适配（默认/暗黑/深海主题）