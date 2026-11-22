---
'cherry-markdown': patch
---

fix(types): 补齐构建产物的插件类型声明并精确推断 makeHtml 返回值

支持从包根导入编辑器配置类型 `CherryOptions`，原有类型导入路径继续可用。
