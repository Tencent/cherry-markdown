---
'cherry-markdown': patch
---

build(types): 重构模块声明文件与构建流程

- 新增 `types/modules.d.ts`，为 CSS 样式文件和 addon 插件提供完整的模块类型声明，解决 TypeScript `noUncheckedSideEffectImports` 下导入报错的问题
- 构建产物自动注入三斜线引用，消费者无需额外配置即可获得类型支持
