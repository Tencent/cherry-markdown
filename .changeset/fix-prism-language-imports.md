---
'cherry-markdown': patch
'@cherry-markdown/miniprogram': patch
---

修复构建迁移后 bash 等代码块高亮回退为 JavaScript 的问题，恢复原有语言及别名支持，补齐开发环境清单更新、小程序独立构建及无浏览器全局变量环境的语言初始化，close #1912
