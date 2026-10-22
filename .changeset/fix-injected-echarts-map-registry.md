---
'cherry-markdown': patch
---

fix: 表格地图统一使用调用方注入的 ECharts 实例读取和注册地图，修复注入实例与全局实例不同时地图无法正确渲染的问题。未注入实例时保留原有全局 ECharts 行为。
