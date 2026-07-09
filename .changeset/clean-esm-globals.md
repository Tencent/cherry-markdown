---
'cherry-markdown': patch
---

fix: avoid `window.Cherry` side effects in ESM bundles

拆分 full、core、stream 的 ESM 与 UMD/CDN 入口：ESM 产物不再挂载 `window.Cherry`，UMD/CDN 产物继续挂载并保持原 CDN 路径不变。
