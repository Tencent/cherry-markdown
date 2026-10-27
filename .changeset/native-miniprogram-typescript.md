---
'@cherry-markdown/miniprogram': minor
'cherry-markdown': minor
---

提供 TypeScript 维护的原生小程序组件、流式更新合并与按块差量提交，支持嵌套列表及 Skyline 示例。移除通用 HTML 富文本兜底：列表项改为递归 children，未支持的 HTML 改为原生文本降级；类型声明由源码生成。

为 Cherry 既有语法 hook 增加直接语义输出通道，小程序不再经过生成 HTML 后回读的链路。流式追加复用已确认的语义块，保留活跃块并验证检查点；引用、脚注、目录和自定义全局行为触发失效回退，保留 Web HTML 行为。
