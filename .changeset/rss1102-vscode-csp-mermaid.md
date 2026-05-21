---
'cherry-markdown': patch
---

fix(vscodePlugin): 放开 Webview CSP `style-src` 的 `'unsafe-inline'`，修复 Mermaid 等运行时注入 inline `<style>` / `style` 属性的库被拦截导致的渲染异常（部分节点缺失 `label-container` class、`fill` 退回 SVG 默认黑色等）。

`script-src` 仍仅允许扩展自身资源，无 XSS 入口，与 VS Code 官方 markdown 预览扩展做法一致。
