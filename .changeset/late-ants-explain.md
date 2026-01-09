---
"cherry-markdown": minor
---

refactor: 重构链接属性配置类型和工具栏选项。现有使用 `hiddenToolbar` 的代码仍然可以正常工作（向后兼容），但 IDE 会显示废弃警告，建议迁移到 `registerHeadlessToolbars`。
