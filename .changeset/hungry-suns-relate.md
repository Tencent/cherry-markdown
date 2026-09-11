---
'cherry-markdown': patch
---

fix: 优化 TeX 定界符（`\[..\]` / `\(..\)`）的语法归一化实现

- 新增 `LinkFormatter` 段落 Hook：在 `beforeMakeHtml` 阶段统一转义链接内 `~D`、`\[`、`\(` 等字符，`afterMakeHtml` 阶段还原，彻底隔离 Math 与 Link 语法的相互干扰
- 归一化职责下沉：删除独立的 `mathDelimiter.js`，`\[..\]` / `\(..\)` 的识别与补开逻辑内聚到 `MathBlock` / `InlineMath` 各自的 `beforeMakeHtml` 中，借助 `makeMath` 缓存占位符天然形成保护壳，不再依赖跨模块的全文仲裁循环
- 新增配置开关 `engine.syntax.mathBlock.TeXDelimiter` 和 `engine.syntax.inlineMath.TeXDelimiter`（默认开启），可按需关闭 `\[..\]` / `\(..\)` 的支持
- 顺手修复 CommonMark-12 中 `\[\\\]` 被错误识别为块公式的旧 bug
