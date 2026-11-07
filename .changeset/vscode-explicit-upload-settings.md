---
'cherry-markdown-vscode-plugin': minor
---

feat(vscodePlugin): 统一上传配置并通过 multipart 支持 PicGo，停止读取旧配置键且不再自动迁移

上传配置按当前文档所属文件夹、工作区、用户、默认值的顺序读取。上传器地址和认证头整体取自同一层，避免项目地址混入全局认证信息。配置无效时阻止上传并提示修正，不静默切换上传目标。

`CustomUploader.format` 支持 `binary` 和 `multipart`，省略时仍使用原有的 `binary` 行为。PicGo 2.4.0+ 用户可设置 `ImageUploadMode=remote`、`format=multipart`、`fieldName=files` 继续上传；插件直接发送文件内容，自动生成表单边界和长度，不根据地址猜测协议，也不在失败后切换路线。

停止使用旧 `UploadType`、`PicGoServer` 选择上传方式和地址，不提供旧路径列表或剪贴板协议适配。仅有旧配置时，用户尝试上传会收到明确的 PicGo 重新配置提醒，可打开设置或配置说明；此过渡提醒计划在下一个 major 版本移除。不会自动修改或清理用户已有设置。

受限模式只允许用户级上传设置；用户可通过 VS Code 原生工作区信任界面授权，再使用项目配置。预览显示当前上传目标和配置来源。原有手动主题继续保存在扩展状态中，不再自动读取或迁移已移除的旧主题设置。
