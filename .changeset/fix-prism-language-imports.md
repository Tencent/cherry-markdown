---
'cherry-markdown': patch
'@cherry-markdown/miniprogram': patch
---

修复构建迁移后 bash 等代码块高亮回退为 JavaScript 的问题，通过共享 Babel 适配层统一开发、测试和各发布产物的语言加载，恢复原有语言及别名支持，并补齐小程序独立构建及无浏览器全局变量环境的语言初始化，close #1912
