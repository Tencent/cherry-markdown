---
'cherry-markdown': patch
---

fix(types): 修复 npm 包的类型声明解析和返回值推断

  - 修复 NodeNext 下的声明解析，保留原有类型导入路径。
  - 根据返回模式精确推断 `makeHtml()` 的返回值。
  - `SyntaxHookBase.rule()` 的 `begin`、`content` 和 `end` 声明为可选字段，直接使用这些字段的 TypeScript 代码需处理 `undefined`。
