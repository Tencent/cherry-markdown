---
"cherry-markdown": patch
"@cherry-markdown/milkdown": patch
"@cherry-markdown/client": patch
---

chore(deps): 更新 Mermaid、ECharts 和 jsdom 的选择器依赖

  - 桌面客户端内置的 ECharts 从 6.0.0 升级至 6.1.0。该版本中，`tooltip.valueFormatter` 的第二个参数改为原始数据索引。如需将 `axis.startValue` 同时用作坐标轴最小值，请显式设置 `axis.min`。这些变化也适用于使用 ECharts 6.1 的 Milkdown 项目。
  - jsdom 的间接依赖 `nwsapi` 从 2.2.23 升级至 2.2.28。在 jsdom 中，属性选择器会按字面值匹配 `%20` 等百分号编码。详情见 [nwsapi #159](https://github.com/dperini/nwsapi/issues/159)。
