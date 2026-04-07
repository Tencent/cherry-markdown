---
'cherry-markdown': patch
---

refactor(core): 统一外部依赖获取方式，优化全局类型声明

- 统一 echarts、mermaid、katex、MathJax 等外部依赖的获取逻辑，SSR 环境下安全返回 `undefined`，不再直接访问 `window` 对象
- `global.d.ts` 移除对 mermaid/katex 等第三方包的 import，用户引入类型时不再需要安装未使用的可选依赖
- 新增 `window.Cherry`、`window.CherryStream`、`window.CherryEngine`、`window.CherryCodeBlockMermaidPlugin`、`window.CherryCodeBlockPlantumlPlugin` 全局类型声明
