# Cherry-Markdown-competitor-analysis

## 内容介绍

本项目是[2024腾讯犀牛鸟开源人才培养计划—Cherry Markdown](https://github.com/Tencent/OpenSourceTalent/issues/41)中的竞品分析任务。此次分析将从语法能力、功能、安全、性能、扩展能力以及引擎实现方式和二次开发难易程度等多个维度展开，全面对比 Cherry Markdown 与其他主要 Markdown 编辑器的差异。

## 分析方法

本次分析将采用定量与定性相结合的方法，通过以下步骤进行：

| 任务序号 | 任务描述    | 目标描述                           |
| ---- | ------- | ------------------------------ |
| 1    | 数据收集    | 收集Cherry Markdown及其他竞品的公开信息和文档 |
| 2    | 功能对比    | 基于用户需求和市场趋势，对比各编辑器的功能特性        |
| 3    | 性能测试    | 在相同环境下对各编辑器进行性能测试，记录并分析结果      |
| 4    | 安全性评估   | 分析各编辑器的安全机制，包括数据保护和漏洞管理        |
| 5    | 扩展性分析   | 评估各编辑器的插件系统和自定义功能的支持程度         |
| 6    | 引擎实现评估  | 研究各编辑器的底层技术实现和设计模式             |
| 7    | 二次开发难易度 | 分析各编辑器的文档支持和开发复杂度              |

## 进度执行表

- 参照 https://github.com/Tencent/OpenSourceTalent/issues/41 

| 日期         | 任务内容             | 目标            | 完成情况 | 备注            |
| ---------- | ---------------- | ------------- | ---- | ------------- |
| 2024-08-25 | 文档初步书写工作开始（竞品分析） | 完成文档初稿、前四部分章节 | 已完成  | 竞品分析文档的初步书写   |
| 2024-09-05 | 文档初步书写工作完成       | 完成所有文档初稿      | 预计完成 | 包括语法能力、功能、安全  |
| 2024-09-05 | 性能测试及单测用例测试      | 完成性能测试        | 进行中  | 包括局部渲染和更新测试   |
| 2024-09-08 | 完成所有测试和文档写作      | 完成测试报告和文档     | 预计完成 | 包括性能分析和安全性能对比 |
| 2024-09-12 | 文档整理工作           | 进一步整理文档       | 进行中  | 规范化文档格式和内容    |
| 2024-09-20 | 完善文档工程（规范化）      | 文档规范化完成       | 预计完成 | 确保文档的专业性和一致性  |

## 文档结构

![Cherry Markdown竞品分析.png](https://s2.loli.net/2024/09/09/XcWCO1SMAIZYj8s.png)


## 1.Cherry Markdown项目简述

### 1.1 项目介绍

[Cherry Markdown Editor](https://github.com/Tencent/Cherry-Markdown)是一款 **Javascript Markdown 编辑器**，具有**开箱即用、轻量简洁、易于扩展**等特点. 它可以运行在**浏览器或服务端(NodeJs).**

![PixPin_2024-09-05_19-03-44.png](https://s2.loli.net/2024/09/09/gQCGNfY4Boyz8Rh.png)

### 1.2 项目特性


<table>
    <tr>
        <th colspan="3">Cherry markdown 项目特性</th>
    </tr>
    <tr>
        <td rowspan="2"><strong>开箱即用</strong></td>
        <td>调用与实例化</td>
        <td>开发者可以使用非常简单的方式调用并实例化 Cherry Markdown 编辑器</td>
    </tr>
    <tr>
        <td>默认支持</td>
        <td>支持大部分常用的 Markdown 语法（标题、目录、流程图、公式等）</td>
    </tr>
    <tr>
        <td rowspan="2"><strong>易于拓展</strong></td>
        <td>二次开发</td>
        <td>快速进行二次开发或功能扩展</td>
    </tr>
    <tr>
        <td>纯 JavaScript 实现</td>
        <td>不依赖 angular、vue、react 等框架技术，框架只提供容器环境</td>
    </tr>
    <tr>
        <td rowspan="6"><strong>语法特性</strong></td>
        <td>图片</td>
        <td>缩放、对齐、引用</td>
    </tr>
    <tr>
        <td>图表</td>
        <td>根据表格内容生成图表</td>
    </tr>
    <tr>
        <td>字体</td>
        <td>颜色、大小</td>
    </tr>
    <tr>
        <td>背景</td>
        <td>颜色、上标、下标</td>
    </tr>
    <tr>
        <td>列表</td>
        <td>Checklist</td>
    </tr>
    <tr>
        <td>媒体</td>
        <td>音视频</td>
    </tr>
    <tr>
        <td rowspan="2"><strong>多种模式</strong></td>
        <td>编辑预览</td>
        <td>双栏模式（支持同步滚动）</td>
    </tr>
    <tr>
        <td>纯预览</td>
        <td>仅显示预览内容</td>
    </tr>
</table>


## 2.主要竞品概述

### 2.1 目前主要的竞品Markdown编辑器

> 在进行竞品挑选时，开源且可移植的Web插件通常设计为易于集成到各种Web项目中，与Cherry Markdown的目标一致，确保分析的竞品在技术实现和集成难度上具有可比性。
> 因此主要选取了框架集成型编辑器、多功能Markdown编辑器、所见即所得（WYSIWYG）编辑器、轻量级与高性能编辑器几大类别的开源Markdown编辑器作为分析对象。


<table>
    <tr>
        <th colspan="3">编辑器分类与特点</th>
    </tr>
    <tr>
        <td rowspan="3"><strong>框架集成型编辑器-Vue.js 集成编辑器</strong></td>
        <td rowspan="3">专为特定前端框架设计，提供与框架紧密集成的特性。</td>
        <td>mavonEditor</td>
    </tr>
    <tr>
        <td>Vue Markdown Editor</td>
    </tr>
    <tr>
        <td>md-editor-v3</td>
    </tr>
    <tr>
        <td rowspan="3"><strong>多功能Markdown编辑器-图表与数学公式支持</strong></td>
        <td rowspan="3">提供除基本Markdown编辑功能外的额外特性，如图表支持、数学公式等。</td>
        <td>ByteMD（支持Mermaid和KaTeX）</td>
    </tr>
    <tr>
        <td>Editor.md（支持图表、数学公式、流程图）</td>
    </tr>
    <tr>
        <td>Vditor</td>
    </tr>
    <tr>
        <td rowspan="1"><strong>所见即所得（WYSIWYG）编辑器</strong></td>
        <td>提供类似于传统富文本编辑器的所见即所得编辑体验。</td>
        <td>TOAST UI Editor</td>
    </tr>
    <tr>
        <td rowspan="1"><strong>轻量级与高性能编辑器</strong></td>
        <td>注重性能和加载速度，适合对性能要求较高的应用场景。</td>
        <td>Vditor</td>
    </tr>
</table>


1.[Mavon-Editor](https://github.com/hinesboy/mavonEditor)![](https://img.shields.io/github/stars/hinesboy/mavonEditor.svg?style=social&label=Star&maxAge=2592000)：一个基于Vue的Markdown编辑器库，提供了所见即所得的编辑体验，提供了丰富的功能，既可以用于编辑也可以用于解析。它支持标题、图片、备注、代码块、无序列表、有序列表、链接、表格等Markdown标签，并且对代码块和备注的支持较好。使用MIT协议。
![image.png](https://s2.loli.net/2024/09/09/2Olr56Qh8LpRfWo.png)


2.[Vue-Markdown-editor](https://github.com/code-farmer-i/vue-Markdown-editor)![](https://img.shields.io/github/stars/code-farmer-i/vue-markdown-editor.svg?style=social&label=Star&maxAge=2592000)：这是一个基于Vue开发的Markdown编辑器组件。[在线演示](https://code-farmer-i.github.io/vue-markdown-editor/examples/base-editor.html#import)
![image.png](https://s2.loli.net/2024/09/09/dI65CfA3jsP7BoS.png)


3.[Md-editor-v3](https://github.com/imzbf/md-editor-v3)![](https://img.shields.io/github/stars/imzbf/md-editor-v3.svg?style=social&label=Star&maxAge=2592000)：这是一个Markdown编辑器的Vue3版本，使用JSX和TypeScript语法开发，支持切换主题、Prettier美化文本等。
[在线演示](https://imzbf.github.io/md-editor-v3/en-US/index)
![image.png](https://s2.loli.net/2024/09/09/aeon5c87TVY2stK.png)


4.[ByteMD](https://github.com/bytedance/bytemd?tab=readme-ov-file)![](https://img.shields.io/github/stars/pd4d10/bytemd.svg?style=social&label=Star&maxAge=2592000): 由字节跳动旗下掘金社区出品的轻量级、扩展性强的Markdown编辑器JavaScript库。它不需要导入任何UI Framework包，可以用于React、Vue和Angular等框架。ByteMD内置了基本Markdown语法的扩展插件系统，支持代码语法高亮显示、数学公式和流程图等。它还处理了常见的跨网站脚本攻击，兼容SSR。使用MIT协议。[在线演示](https://bytemd.js.org/playground/)
![image.png](https://s2.loli.net/2024/09/09/wPcyiXKYRW4UFEI.png)


5.[Editor.md](https://github.com/pandao/editor.md)![](https://img.shields.io/github/stars/pandao/editor.md.svg?style=social&label=Star&maxAge=2592000)：这是一个基于CodeMirror、jQuery和Marked的开源可嵌入在线Markdown编辑器（组件）。它支持实时预览、图像上载、预格式化文本/代码块/表格插入、代码折叠、搜索替换、只读、主题、多语言、HTML实体、代码语法突出显示等功能。使用MIT协议。[在线演示](http://editor.md.ipandao.com/)
![image.png](https://s2.loli.net/2024/09/09/krlFqvn1CG7ZASa.png)


6.[tui.editor](https://github.com/nhn/tui.editor)![](https://img.shields.io/github/stars/nhn/tui.editor.svg?style=social&label=Star&maxAge=2592000)：TOAST UI Editor是一个Markdown所见即所得编辑器，高效且可扩展，使用MIT开源协议。[在线演示](https://ui.toast.com/tui-editor)
![image.png](https://s2.loli.net/2024/09/09/pLgE9RzOd1PaUHl.png)


7.[Vditor](https://github.com/Vanessa219/vditor)![](https://img.shields.io/github/stars/Vanessa219/vditor.svg?style=social&label=Star&maxAge=2592000)：这是一款浏览器端的Markdown编辑器，支持所见即所得（富文本）、即时渲染（类似Typora）和分屏预览模式。[在线演示](https://ld246.com/guide/markdown)
![image.png](https://s2.loli.net/2024/09/09/27HPx9szteAIYNm.png)


### 2.2 定位和目标用户

Cherry Markdown Editor 可以运行在**浏览器或服务端(NodeJs).** 相较于传统的富文本编辑器，Cherry Markdown Editor 更轻量，加载速度快，对性能的影响小。同时，作为一个开源项目，Cherry Markdown Editor 鼓励社区贡献，不断迭代和完善功能。支持浏览器和Node.js，使得它能够在多种环境中运行，包括桌面应用和移动设备。

> Cherry Markdown Editor 的目标用户主要包括以下几类：

| 用户类别  | 描述                               |
| ----- | -------------------------------- |
| 前端开发者 | 需要在Web应用中快速集成Markdown编辑功能的开发者。   |
| 内容创作者 | 希望通过Markdown格式创作和发布内容的写作者和编辑。    |
| 企业用户  | 需要在内部系统或产品中提供Markdown编辑和预览功能的公司。 |
| 教育机构  | 需要为学生和教师提供Markdown编辑工具的教育平台。     |

## 3.语法能力对比

### 3.1 语法支持

| 编辑器名称       | 支持的Markdown语法 | 额外特性 |
|----------------|------------------|----------|
| ByteMD         | 基础语法          | 扩展插件系统，支持数学公式和流程图 |
| Mavon-Editor   | 基础语法          | 代码块和备注支持较好，适合展示代码或技术文档 |
| Editor.md      | 基础语法          | 实时预览、图像上载、代码折叠、搜索替换 |
| Vditor         | 基础语法          | 所见即所得和即时渲染模式，类似Typora体验 |
| Vue-Markdown-editor | 基础语法 | 易于集成到Vue项目中 |
| Md-editor-v3   | 基础语法          | 使用JSX和TypeScript开发，适合Vue3 |
| tui.editor     | 基础语法          | 所见即所得编辑体验，高效且可扩展 |

### 3.2 语法特性

| 特性                 | ByteMD | Mavon-Editor | Editor.md | Vditor | Vue-Markdown-editor | Md-editor-v3 | tui.editor |
|---------------------|--------|--------------|-----------|--------|-------------------|-------------|-----------|
| 图片缩放、对齐、引用   | 支持   | 支持         | 支持      | 支持   | 支持               | 支持        | 支持       |
| 根据表格内容生成图表 | 支持   | 支持         | 支持      | 支持   | 支持               | 支持        | 支持       |
| 字体颜色、字体大小    | 支持   | 支持         | 支持      | 支持   | 支持               | 支持        | 支持       |
| 字体背景颜色、上标、下标 | 支持   | 支持         | 支持      | 支持   | 支持               | 支持        | 支持       |
| Checklist            | 支持   | 支持         | 支持      | 支持   | 支持               | 支持        | 支持       |
| 音视频               | 支持   | 支持         | 支持      | 支持   | 支持               | 支持        | 支持       |
| 数学公式和流程图     | 支持   |              |           |        |                   |             |           |
| 代码块和备注         |        | 支持         |           |        |                   |             |           |
| 图像上载和代码折叠   |        |              | 支持      |        |                   |             |           |
| 所见即所得编辑功能   |        |              |           | 支持   |                   |             | 支持       |
| Vue特定编辑功能     |        |              |           |        | 支持               |             |           |
| 主题切换和文本美化   |        |              |           |        |                   | 支持        |           |

### 3.3 兼容性

| 特性               | Cherry Markdown Editor | ByteMD | Mavon-Editor | Editor.md | Vditor | Vue-Markdown-editor | Md-editor-v3 | tui.editor |
|-------------------|------------------------|---------|--------------|-----------|--------|--------------------|-------------|-----------|
| 浏览器兼容性       | 支持所有主流浏览器     | 兼容主流浏览器 | 支持Vue.js | 支持所有主流浏览器 | 兼容现代浏览器 | 兼容主流浏览器 | 兼容主流浏览器 | 兼容所有主流浏览器 |
| 操作系统兼容性     | 支持Windows、macOS、Linux | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 |
| 框架兼容性         | 不依赖特定框架         | 专为现代JavaScript框架设计 | 专为Vue.js设计 | 作为一个独立的组件 | 未明确 | 专为Vue.js设计 | 专为Vue3开发 | 作为一个独立的编辑器 |
| 移动端兼容性       | 提供移动端预览模式     | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 |
| 服务器端渲染(SSR)兼容性 | 未明确 | 支持SSR | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 | 未明确 |
| 编辑模式兼容性     | 未明确 | 未明确 | 未明确 | 未明确 | 支持多种编辑模式 | 未明确 | 未明确 | 未明确 |


## 4.功能对比

### 4.1 语法支持
| 特性             | Cherry Markdown Editor | ByteMD | Mavon-Editor | Editor.md | Vditor | Vue-Markdown-editor | Md-editor-v3 | tui.editor |
| -------------- | ---------------------- | ------ | ------------ | --------- | ------ | ------------------- | ------------ | ---------- |
| 支持高级Markdown语法 | ✅                      | ✅      | ✅            | ✅         | ✅      | ✅                   | ✅            | ✅          |
| 图片编辑选项         | ✅                      |        |              |           |        |                     |              |            |
| 字体样式支持         | ✅                      |        |              |           |        |                     |              |            |
| 支持checklist    | ✅                      |        |              |           |        |                     |              |            |
| 音视频嵌入支持        | ✅                      |        |              |           |        |                     |              |            |
| 扩展插件系统         |                        | ✅      |              |           |        |                     |              |            |
| 代码语法高亮         |                        | ✅      | ✅            | ✅         |        |                     |              | ✅          |
| 数学公式和流程图       |                        | ✅      |              | ✅         |        |                     |              |            |
| 实时预览           |                        |        |              | ✅         | ✅      |                     |              | ✅          |
| 图像上载           |                        |        |              | ✅         |        |                     |              |            |
| 代码折叠           |                        |        |              | ✅         |        |                     |              |            |
| 多语言支持          |                        |        |              | ✅         |        |                     |              |            |
| 所见即所得编辑        |                        |        | ✅            |           | ✅      |                     |              | ✅          |
| 即时渲染模式         |                        |        |              |           | ✅      |                     |              |            |
| 分屏预览模式         |                        |        |              |           | ✅      |                     |              |            |
| 定制化            |                        |        |              |           |        | ✅                   |              |            |
| 主题切换           |                        |        |              |           |        |                     | ✅            |            |
| Prettier美化文本   |                        |        |              |           |        |                     | ✅            |            |


### 4.2 编辑模式
| 编辑器名称                  | 双栏编辑预览模式 | 纯预览模式 | 无工具栏模式 | 移动端预览模式 | 定制编辑器模式 | 所见即所得模式 | 实时预览模式 | 多种编辑模式 | 作为Vue组件 | 支持主题切换 | 所见即所得模式 |     |
| ---------------------- | -------- | ----- | ------ | ------- | ------- | ------- | ------ | ------ | ------- | ------ | ------- | --- |
| Cherry Markdown Editor | ✅        | ✅     | ✅      | ✅       |         |         |        |        |         | ✅      |         |     |
| ByteMD                 |          |       |        |         | ✅       |         |        |        |         |        |         |     |
| Mavon-Editor           |          |       |        |         |         | ✅       |        |        |         |        |         |     |
| Editor.md              |          |       |        |         |         |         | ✅      |        |         |        |         |     |
| Vditor                 |          |       |        |         |         |         |        | ✅      |         |        |         |     |
| Vue-Markdown-editor    |          |       |        |         |         |         |        |        | ✅       |        |         |     |
| Md-editor-v3           |          |       |        |         |         |         |        |        |         |        | ✅       |     |
| tui.editor             |          |       |        |         |         |         |        |        |         |        |         | ✅   |

### 4.3 功能特性

- **Cherry Markdown**：
1. 复制 Html 粘贴成 MD 语法
2. 经典换行&常规换行
3. 多光标编辑
4. 图片尺寸
5. 导出长图、pdf
6. float toolbar 在新行行首支持快速工具栏
7. bubble toolbar 选中文字时联想出快速工具栏


## 5.性能对比

### 5.1 测试环境描述

### 5.2 局部渲染和更新

### 5.3 运行环境

### 5.4 性能指标

### 5.5 测试结果


## 6.安全对比

### 6.1 数据保护

### 6.2 漏洞管理


## 7.拓展能力对比

### 7.1 插件系统

### 7.2 自定义功能


## 8.引擎实现方式

### 8.1 技术栈

### 8.2 设计模式

### 8.3 代码质量


## 9.二开难易程度


### 9.1 文档与支持

### 9.2 开发复杂度

### 9.3 API和插件





