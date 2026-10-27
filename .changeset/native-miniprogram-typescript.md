---
'@cherry-markdown/miniprogram': minor
'cherry-markdown': minor
---

提供 TypeScript 维护的原生小程序组件、流式更新合并与按块差量提交，支持嵌套列表及 Skyline 示例。移除通用 HTML 富文本兜底：列表项改为递归 children，未支持的 HTML 改为原生文本降级；类型声明由源码生成。

为 Cherry 既有语法 hook 增加直接语义输出通道，小程序不再经过生成 HTML 后回读的链路。流式追加复用已确认的语义块，保留活跃块并验证检查点；引用、脚注、目录和自定义全局行为触发失效回退，保留 Web HTML 行为。

公开无 DOM 依赖的 `cherry-markdown/semantic` 和轻量主题入口，将语义节点及增量状态收归核心；小程序只消费公共协议。主题直接由现有 Sass 生成，支持原生颜色、字号、Panel 标题与 Detail 交互。小程序精确依赖核心版本，并通过 Changesets 和发布顺序联动更新，提供协议及构建内核心版本信息。

使用同源 Markdown 的移动端 Web/Skyline 对照修正标题层级、段落和列表间距、引用、表格、代码高亮及面板/详情样式；修复终止换行产生额外空行和深色切换时原生文字颜色继承失效。语义代码 token 保留 Prism 别名，提供可复现的 390px 对照页和实测边界说明。
