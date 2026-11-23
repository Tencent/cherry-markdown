---
'cherry-markdown': patch
---

fix(types): 修复 TAPD 插件的语法规则声明

  - 补齐复选框、HTML 标签和表格插件的规则字段，使其符合公开的 `SyntaxHookBase.rule()` 类型。
  - 保留插件原有的渲染和正则匹配行为。
