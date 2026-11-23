---
'cherry-markdown': patch
---

fix(tapd): 修复三个独立插件的类型和注册

  - 补齐 TAPD 清单、HTML 标签和表格插件的 UMD 与 ESM 声明。
  - 支持通过 `engine.customSyntax` 注册这三个独立插件并渲染对应的 TAPD 内容。
