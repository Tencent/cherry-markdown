---
'@cherry-markdown/engine': minor
---

补全 `@cherry-markdown/engine` 的公共导出，使其可作为完整独立的解析渲染引擎被外部消费：

- 导出引擎核心类：`Engine`、`SyntaxHookBase`(`SyntaxBase`)、`ParagraphBase`、`HookCenter`、`hooksConfig`、`HOOKS_TYPE_LIST`、`createSyntaxHook`
- 导出全部内置语法 Hook：`Header`、`Paragraph`、`Table`、`List`、`CodeBlock`、`Link`、`Image`、`Emphasis`、`Emoji`、`MathBlock`、`InlineMath` 等 37 个
- 导出运行时工具：`Logger`、`Sanitizer`、`UrlCache`、`urlProcessorProxy`、`defaultConfig`
- 依赖边界不变：引擎包不依赖 CodeMirror / 工具栏 / 编辑器 UI
