---
'cherry-markdown': patch
---

chore(workspace): 升级 ESLint 10 并统一 lint 工具链

- 合并为单文件 `eslint.config.mjs`，移除各包分散的 ESLint 配置
- Prettier 负责格式、ESLint 负责代码质量，`prettier` 配置块置于最后
- 简化 ignore 策略，仅排除构建产物与第三方依赖
- 接入 husky pre-commit 与 lint-staged，统一 `yarn lint` 入口
