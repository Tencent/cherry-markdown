
### 内容介绍

> 本项目是[2024腾讯犀牛鸟开源人才培养计划—Cherry Markdown](https://github.com/Tencent/OpenSourceTalent/issues/41)中的竞品分析任务。此次分析将从语法能力、功能、安全、性能、扩展能力以及引擎实现方式和二次开发难易程度等多个维度展开，全面对比 Cherry Markdown 与其他主要 markdown 编辑器的差异。


### 1.Cherry Markdown项目简述
---
#### 1.1 项目介绍

Cherry Markdown Editor 是一款 **Javascript Markdown 编辑器**，具有**开箱即用、轻量简洁、易于扩展**等特点. 它可以运行在**浏览器或服务端(NodeJs).**

- 开箱即用
开发者可以使用非常简单的方式**调用并实例化 Cherry Markdown 编辑器**，实例化的编辑器默认**支持大部分常用的 markdown 语法（如标题、目录、流程图、公式等）**。

- 易于拓展
当 Cherry Markdown 编辑器支持的语法不满足开发者需求时，可以快速的进行**二次开发或功能扩展**。同时，CherryMarkdown 编辑器应该由**纯 JavaScript 实现，不应该依赖 angular、vue、react 等框架技术，框架只提供容器环境即可。

![f689eeec218dc529228e3b6e09bd5770.png](https://ice.frostsky.com/2024/09/05/f689eeec218dc529228e3b6e09bd5770.png)
<center>图1.本地部署cherry Markdown Editor演示</center>
#### 1.2 项目特性

- 语法特性
1. 图片缩放、对齐、引用
2. 根据表格内容生成图表
3. 字体颜色、字体大小
4. 字体背景颜色、上标、下标
5. checklist
6. 音视频

- 多种模式
1. 双栏编辑预览模式（支持同步滚动）
2. 纯预览模式
3. 无工具栏模式（极简编辑模式）
4. 移动端预览模式

- 功能特性
1. 复制 Html 粘贴成 MD 语法
2. 经典换行&常规换行
3. 多光标编辑
4. 图片尺寸
5. 导出长图、pdf
6. float toolbar 在新行行首支持快速工具栏
7. bubble toolbar 选中文字时联想出快速工具栏

- 性能特性
1. 局部渲染
2. 局部更新

- 安全
Cherry Markdown 有内置的安全 Hook，通过过滤白名单以及 DomPurify 进行扫描过滤.

- 样式主题
Cherry Markdown 有多种样式主题选择

- 特性展示
这里可以看到特性的简短的演示 [screenshot](https://github.com/Tencent/cherry-markdown/wiki/%E7%89%B9%E6%80%A7%E5%B1%95%E7%A4%BA-features)
