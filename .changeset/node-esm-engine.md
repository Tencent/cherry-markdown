---
'cherry-markdown': patch
---

feat(engine): 新增纯 Node.js 环境的 ESM 渲染入口

  - 提供 Node ESM 子路径及对应类型声明。
  - 修复 Node 渲染时异步 `urlProcessor` 回调触发浏览器刷新并抛错的问题。
