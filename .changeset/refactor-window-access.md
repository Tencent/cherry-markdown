---
'cherry-markdown': patch
---

refactor: 统一 window 对象访问方式，完善全局类型声明

- 新增 `getExternal()` 工具函数，统一收口 `window.echarts`、`window.mermaid`、`window.katex`、`window.MathJax` 等外部依赖的获取逻辑，内置 `isBrowser` 守卫，SSR 环境下安全返回 `undefined`
- `global.d.ts` 不再 import mermaid/katex 等第三方包，改为只声明 cherry-markdown 自身挂载的全局类型（`window.Cherry`、`window.CherryEngine`、插件等），用户无需安装未使用的可选依赖即可获得类型支持
- 新增 `CherryStream`、`CherryEngine`、`CherryCodeBlockMermaidPlugin`、`CherryCodeBlockPlantumlPlugin` 全局类型声明
