# Cherry Markdown Editor

## 介绍

Cherry Markdown Editor 是一款 Javascript Markdown 编辑器，具有开箱即用、轻量简洁、易于扩展等特点. 它可以运行在浏览器或服务端(NodeJs)。

::: tip

只是想立即开始？跳至 [开始使用](./getting-started)。

:::

### 开箱即用

开发者可以使用非常简单的方式调用并实例化 Cherry Markdown 编辑器，实例化的编辑器默认支持大部分常用的 markdown 语法（如标题、目录、流程图、公式等）。

### 易于拓展

当 Cherry Markdown 编辑器支持的语法不满足开发者需求时，可以快速的进行二次开发或功能扩展。
同时，CherryMarkdown 编辑器应该由纯 JavaScript 实现，不应该依赖 angular、vue、react 等框架技术，框架只提供容器环境即可。

## 特性

### 语法特性

1. 图片缩放、对齐、引用
2. 根据表格内容生成图表
3. 字体颜色、字体大小
4. 字体背景颜色、上标、下标
5. checklist
6. 音视频

### 多种模式

1. 双栏编辑预览模式（支持同步滚动）
2. 纯预览模式
3. 无工具栏模式（极简编辑模式）
4. 移动端预览模式

### 功能特性

1. 复制 Html 粘贴成 MD 语法
2. 经典换行&常规换行
3. 多光标编辑
4. 图片尺寸
5. 导出长图、pdf
6. float toolbar 在新行行首支持快速工具栏
7. bubble toolbar 选中文字时联想出快速工具栏

### 性能特性

1. 局部渲染
2. 局部更新

### 安全

Cherry Markdown 有内置的安全 Hook，通过过滤白名单以及 DomPurify 进行扫描过滤。

### 样式主题

Cherry Markdown 有多种样式主题选择。

### 特性展示

这里可以看到特性的简短的演示 [语法特性](./features.md)。
