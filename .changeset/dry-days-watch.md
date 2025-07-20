---
'cherry-markdown': minor
---

# #1268 预览区图片所见即所得编辑能力增加设置图片样式的功能 2

## 更新内容
- feat: 增加对齐方式交互按钮到图片样式工具栏气泡中，支持修改左对齐、居中、右对齐、左浮动、右浮动
- refactor: 将上一版的一些名称（imageStyle/imageAppend/imageTool）重命名为imageDecoration/imageDeco
- feat: 新增对齐方式相关的一些图标文件
- refactor: 恢复imageSizeHandler.js的previewUpdate事件响应，当对齐方式修改时imageSizeBubble对准图像

## 遗留难题
我希望当图片的对齐方式修改时imageSizeBubble在合适的时机自动对准，但是原生js中没有类似Vue中的nextTick的函数，我调研实验了2h无法实现在DOM刚完成渲染就执行回调，只能写死代码`setTimeout(() => this.afterUpdate(), 100);`。

