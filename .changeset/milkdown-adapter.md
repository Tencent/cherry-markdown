---
'@cherry-markdown/milkdown': minor
'cherry-markdown': patch
---

新增可安装的 `@cherry-markdown/milkdown` 即见即所得预览编辑插件，可通过 `plugins: [milkdown()]` 按 Cherry 实例启用。原有 CodeMirror、工具栏、主题、布局和 Markdown 数据保持由 Cherry 管理；Cherry 同时增加实例插件生命周期与预览编辑双向同步所需的兼容接口。
