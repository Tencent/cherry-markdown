---
'cherry-markdown': minor
---

refactor: 优化构建配置并增强 stream 模式
- feat(editor): 重构 `codeMirror· 模块加载方式为依赖注入，提升架构灵活性，stream 模式下不加载 `codeMirror`
- refactor(build): 优化构建配置，仅支持 UMD/ESM 模式
- fix(xss): 修复 XSS 安全漏洞
