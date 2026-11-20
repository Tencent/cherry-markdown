---
"cherry-markdown": patch
"@cherry-markdown/milkdown": patch
"@cherry-markdown/client": patch
---

chore(deps): 更新 Mermaid 和 ECharts

  - 桌面客户端内置的 ECharts 从 6.0.0 升级至 6.1.0。该版本中，`tooltip.valueFormatter` 的第二个参数改为原始数据索引。如需将 `axis.startValue` 同时用作坐标轴最小值，请显式设置 `axis.min`。这些变化也适用于使用 ECharts 6.1 的 Milkdown 项目。
