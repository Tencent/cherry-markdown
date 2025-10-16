---
'cherry-markdown': patch
---

refactor: 重构复制的相关逻辑

## 变更说明

本次重构主要优化了复制功能的实现，改进了剪贴板数据格式

**之前：**
- `text/html`: 预览区 HTML
- `text/plain`: 预览区 HTML（与 `text/html` 相同）

**现在：**
- `text/html`: 预览区的富文本 HTML（包含样式）
- `text/plain`: 原始 Markdown 文本

这样的改进使得：
- 粘贴到支持富文本的应用（如微信公众号、Word）时保留格式
- 粘贴到纯文本编辑器时获得原始 Markdown 源码
- 更符合用户的使用习惯和预期
