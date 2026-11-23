---
'cherry-markdown': patch
---

fix(tapd): 修复独立 TAPD 插件的类型声明和注册

  - 补齐清单、HTML 标签和表格插件的 UMD 与 ESM 类型声明。
  - 支持将独立 TAPD 插件注册到编辑器的 `engine.customSyntax`。
