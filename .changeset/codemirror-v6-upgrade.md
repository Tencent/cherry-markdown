---
'cherry-markdown': major
---

refactor: 升级 CodeMirror 到 v6

- 将 CodeMirror 从 v5 升级到 v6，重构 CM6Adapter 适配器保持 API 兼容
- 优化搜索高亮性能，支持大文档降级策略
- 优化特殊字符标记处理性能
- 修复选区映射、正则处理、Bubble 事件等问题
- 支持 vim 模式懒加载（@replit/codemirror-vim）
