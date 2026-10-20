---
'cherry-markdown': patch
---

fix: 优化 TeX 定界符处理，避免公式与链接语法相互干扰。

- 统一公式归一化与链接转义逻辑。
- 新增 `engine.syntax.mathBlock.TeXDelimiter` 和 `engine.syntax.inlineMath.TeXDelimiter` 配置项，默认开启。
- 修复 CommonMark 示例 12 中转义字符被误识别为块级公式的问题。
