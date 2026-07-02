---
'cherry-markdown': patch
---

fix(cherry-markdown): 移除 `es-toolkit`，内置工具函数并修复插件 install 深合并失效

- 新增 `mergeWith`、`cloneDeep`、`escapeRegExp`、`debounce`（`src/utils/toolkit/`）
- `mergeWith` 采用 lodash 兼容语义，修复 `usePlugin` 两参数调用不合并的问题
- 补充 toolkit 单测覆盖
