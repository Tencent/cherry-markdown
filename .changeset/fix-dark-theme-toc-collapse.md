---
'cherry-markdown': patch
---

fix(theme): 修复暗黑主题下 TOC 收起功能失效问题

- 修复暗黑主题下 TOC（目录）收起功能失效的问题
- 补充缺失的 TOC pure 模式关键布局属性（width、height、max-height、background、border-radius）
- 统一默认主题和暗黑主题的代码规范，使用 `transparent` 替代硬编码透明色

该问题由 PR #1464 引入，从 v0.10.1 开始受影响，影响所有后续版本。