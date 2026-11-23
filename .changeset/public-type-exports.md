---
'cherry-markdown': patch
---

fix(types): 补齐编辑器和浏览器插件的公开声明

  - 支持从 `cherry-markdown` 导入 `CherryOptions`，原有类型导入路径继续可用。
  - 补齐 Full 和 Core 的 `MermaidCodeEngine`、`MermaidPlugin` 具名导出声明。
  - 补齐独立 Mermaid、PlantUML、ECharts 代码块和 ECharts 表格插件的 UMD 与 ESM 声明。
