---
'cherry-markdown': patch
---

fix: 编辑器销毁后忽略尚未完成的图片懒加载回调，避免访问已清理的配置，close #1868
