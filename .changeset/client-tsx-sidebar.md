---
'@cherry-markdown/client': minor
---

refactor(client): 重构客户端 UI 并增强桌面端编辑体验。

    - 将客户端 UI 组件从 Vue SFC 迁移为 TSX，保留原有文件、编辑器和状态栏行为。
    - 优化左侧工作区，支持面板宽度拖拽、图标提示、当前文件定位、右键菜单视口避让和最近文件按日期分组。
    - 支持在 macOS Finder 中通过文件关联打开 Markdown/Text 文件，并保留 Windows 双击打开文件能力。
