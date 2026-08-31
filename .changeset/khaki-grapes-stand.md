---
'@cherry-markdown/client': patch
---

feat(client): 专注模式固定宽度可配置 & 新增本地历史版本能力

- **设置弹窗 · 专注模式**：新增「固定宽度」配置项（范围 400–1600px，默认 800px），持久化到 localStorage；通过 CSS 变量 `--fixed-content-width` 驱动 Cherry / Milkdown 两种引擎的居中布局，保存后即时生效；仅在「固定宽度」模式下生效，100% 宽度不受影响。
- **本地历史版本（IndexedDB）**：编辑时实时保存最新版本到 IndexedDB；自动生成快照并按策略聚合——5 分钟内保留分秒级、当天内向前每小时最多 1 个、3 天前每天最多 1 个；版本名按粒度显示为 `MM/DD HH:mm:ss` / `MM/DD HH:mm` / `MM/DD`。
- **切换文件**：不再弹「未保存」确认；打开文件若发现本地版本更新且内容与磁盘存在差异，以非阻塞消息提醒用户，可一键应用本地版本；切换文件时立即关闭该提醒。
- **状态栏**：新增「自动快照 HH:mm:ss」提示（`.status-right`，3s 自动淡出，下次快照重现，带 tooltip 解释含义）；有本地版本时显示「查看历史版本」入口。
- **历史版本弹窗**：`.version-preview` 显示所选版本与当前磁盘文件的 Myers Diff（迁移 `myersDiff.js` 到 client）；左下角「清空所有版本」按钮；每条 `.version-item` hover 显示删除按钮支持逐条删除；修复预览区高度导致无滚动条的问题。
