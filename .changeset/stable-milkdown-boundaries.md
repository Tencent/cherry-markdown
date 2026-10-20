---
'@cherry-markdown/milkdown': minor
'cherry-markdown': patch
---

完善独立 Milkdown 编辑器的只读隔离、Cherry 主题切换、可取消图片上传和可选渲染依赖降级边界。

Cherry 表格地图统一使用调用方注入的 ECharts 实例读取和注册地图。Milkdown 最低依赖 cherry-markdown 0.11.11，以包含该修复；地图加载、取消和重试仍由 Milkdown 负责。
