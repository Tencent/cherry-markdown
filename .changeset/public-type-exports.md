---
'cherry-markdown': patch
---

fix(types): 补齐编辑器和插件的公开类型入口

  - 支持从包根导入 `CherryOptions`，原有类型导入路径继续可用。
  - 补齐 Full 和 Core 产物的 Mermaid 具名导出声明。
  - 为七个 addon 的 UMD 和 ESM 产物补齐类型声明。
