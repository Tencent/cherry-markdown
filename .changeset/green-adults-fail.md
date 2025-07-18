---
'cherry-markdown': minor
---

# #1268 预览区图片所见即所得编辑能力增加设置图片样式的功能

## 新增特性
1. 增加图片样式工具栏气泡，当前版本支持修改边框/阴影/圆角；
2. 允许图片样式工具栏气泡跟随页面滚动；

## 修复问题
1. 修复 `PreviewerBubble.js` 样式代码捕获不完全的问题；

## 部分隐患
1. 由于单次点击触发2个气泡，原有代码`this.bubbleHandler.click = imgSizeHandler;`无法兼容，此次仅简单地新增不优雅代码`this.bubbleHandler.imgTool = imgToolHandler;`，目前考察没有bug；
2. 由于一个组件存在2个气泡，编辑器的更新事件`previewUpdate`将导致2个气泡的移除逻辑不对称，此次仅简单地将`imgSizeHandler.js`的`previewUpdate`取消。

## 下一步更新计划
1. 允许图片样式工具栏气泡随着图片尺寸的修改而改变位置；
2. 图片样式工具栏气泡根据鼠标点击位置更灵活判断气泡锚点；
3. 商榷对于`PreviewerBubble.js`更大规模的逻辑调整。
