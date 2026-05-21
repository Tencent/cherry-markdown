---
'cherry-markdown': patch
---

内部优化样式构建：Sass 迁移至模块系统（`@use` / `@forward`），并使用 `rollup-plugin-sass` 现代编译 API，消除构建时的弃用警告。

对使用者无破坏性变更：`import 'cherry-markdown/dist/cherry-markdown.css'` 与原有 API、主题类名保持不变。
⚠️ 若你通过自定义 CSS 覆盖 `.cherry-bubble` 相关样式，建议在升级后确认预览区图片工具条外观是否符合预期。
