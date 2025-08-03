---
'cherry-markdown': minor
'cherry-markdown-vscode-plugin': minor
'@cherry-markdown/client': minor
---

feat(theme): set light theme as new default [#1314](https://github.com/Tencent/cherry-markdown/issues/1314)

### 破坏性更改 BREAKING CHANGES

- **移除 `light` 主题**：原有的 `light` 主题已被移除
- **默认主题变更**： `light` 作为新的默认主题
- **主题列表更新**：可用主题列表中不再包含 `light` 选项

### 影响范围 IMPACTS

- 对于原本在配置项 `themeSettings.mainTheme` 中使用 `light` 主题的用户，由于该主题不存在，将会导致主题切换为 `default` 主题，也即是原先的 `light` 主题

### 迁移指南 MIGRATION GUIDE

- 如果您之前使用了 `light` 主题：
  1. 由于 `light` 以不存在，主题会自动切换为 `default` 主题
  2. （可选）你可以选择将配置中的 `mainTheme: 'light'` 更改为 `mainTheme: 'default'`
- 如果您之前自定义配置了 `light` 主题：
  1. 您可以直接把原先 `light.scss` 文件底部的配置项迁移到 `default.scss` 文件中
  2. （可选）你可以选择将配置中的 `mainTheme: 'light'` 更改为 `mainTheme: 'default'`
- 如果您之前自定义配置了 `default` 主题：
  1. 您可以将原先 `default.scss` 文件底部的配置项迁移到新的 `default.scss` 文件中
