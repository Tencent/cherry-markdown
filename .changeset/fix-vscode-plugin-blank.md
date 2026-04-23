---
"cherry-markdown-vscode-plugin": patch
---

fix(vscodePlugin): 修复 VSCode 插件白屏问题

- 修复 rspack alias 路径错误（`../../` → `../`），确保正确解析 cherry-markdown-core 模块
- 修改 alias 配置为显式指定入口文件路径，适配 rspack 的模块解析机制
- 更新 `build:vscodePlugin` 脚本，在构建插件前自动先构建核心库依赖
