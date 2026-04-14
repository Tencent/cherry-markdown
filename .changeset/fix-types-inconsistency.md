---
'cherry-markdown': patch
---

fix(types): 修复多处类型定义与实际实现不一致的问题

- `CherryDefaultToolbar` 补齐 `align`/`chatgpt`/`search` 等 9 个缺失项
- `CherryDefaultBubbleToolbar` 补齐 `underline`/`quote`
- `CherryDefaultFloatToolbar` 将 `quickTable` 修正为 `table`
- `CherryFileUploadMultiHandler` 回调签名修正为接收结果数组
- `codeBlock.customBtns` 修正 `html` 和 `onClick` 的类型
- `link.rel`/`autoLink.rel` 移除无效的 `'_blank'` 值
- `callback.onCopyCode` 第一个参数修正为 `{ target: HTMLElement }`
- `event.focus`/`event.blur` 参数结构修正为 `{ e, cherry }`
- 修复 `Editor.js` 中 `focus`/`blur` 事件 emit 的 key 与默认配置不一致的 bug
