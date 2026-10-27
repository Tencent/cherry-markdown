# @cherry-markdown/miniprogram

> 早期开发版本。原生组件和 Skyline 示例仍需在目标基础库及真机上验收。

[English](./README.md)

将 Cherry Markdown 转为结构化数据，并提供包内维护的微信小程序原生组件。段落、标题、列表、引用、表格、代码和图片均通过 WXML `view`、`text`、`image`、`scroll-view` 渲染；不使用 `web-view` 或 `rich-text`。

## 使用原生组件

```sh
npm install @cherry-markdown/miniprogram
```

将已安装包的 `dist/components` 整个目录复制到小程序的 `components/cherry`。三个子组件必须一起复制；无需构建 npm，也无需在业务页面引入 ESM 解析器。组件中的逻辑代码已编译为小程序可运行的 CommonJS。

页面 JSON：

```json
{
  "usingComponents": {
    "cherry-markdown": "/components/cherry/markdown/index"
  }
}
```

页面 WXML：

```xml
<cherry-markdown
  id="markdown"
  update-interval="80"
  bind:linktap="onLinkTap"
/>
```

高频流式接入推荐在页面 `onReady` 中获取组件句柄，直接调用逻辑层方法，避免把完整 Markdown 通过页面 `setData` 反复传入视图层：

```ts
import type { NativeMarkdownHandle } from '@cherry-markdown/miniprogram';

const renderer = this.selectComponent('#markdown') as NativeMarkdownHandle;
renderer.setMarkdown(accumulatedMarkdown, true);
renderer.setMarkdown(finalMarkdown, false);
```

业务负责请求、SSE 解码和分帧，传入累积的完整 Markdown。静态或低频内容也可以使用 `markdown`、`streaming` 属性绑定；同一组件请选择一种输入方式。`linktap` 的 `event.detail.href` 由业务处理；组件不自动打开网页。代码复制和图片预览由组件提供。

组件合并默认 80 ms 内的更新，最多保持一次 `setData` 提交在途；提交完成后处理最新输入。结束时立即安排最终刷新，并将图片占位切换为原生图片。组件销毁会取消待处理更新。`update-interval` 在组件挂载时读取。

连续文本 runs 合并到同一个原生 `text` 宿主，保留文字换行和选择。图片单独成块显示，不承诺浏览器式的行内图片排版。

## 数据接口与 TypeScript

源代码中的转换、视图、调度和原生组件采用严格 TypeScript。类型声明由源码生成；`shared/engine.js` 是与现有 Cherry JS 引擎对接的边界，未改造 Web 编辑器。

```ts
import CherryStream, { NativeMarkdownController } from '@cherry-markdown/miniprogram';
import type { MiniProgramViewBlock } from '@cherry-markdown/miniprogram';

const stream = new CherryStream();
const blocks: MiniProgramViewBlock[] = stream.setMarkdown('**hello**', { deferImages: false });

// 自定义页面模板时可复用调度和差量提交；默认原生组件已经内置这部分。
const controller = new NativeMarkdownController((patch, done) => page.setData(patch, done));
controller.setMarkdown(accumulatedMarkdown, true);
controller.setMarkdown(finalMarkdown, false);
// 页面销毁时：controller.dispose();
```

数据入口仍为 ESM，自定义接入方需自行打包为小程序运行格式。默认组件已经包含解析器，使用组件时不要再次将解析器打入页面。

## 渲染协议与能力边界

- 段落、标题、引用、嵌套列表、任务列表、表格、代码、链接、图片、分割线：原生组件。
- 列表项保留 `children: MiniProgramViewBlock[]`，不再将嵌套结构压平成 `inlines`。
- 公式和 Mermaid：保留语义及源码，原生文本展示并可复制；尚未实现数学排版或图形绘制。
- 未支持的块级 HTML：返回 `{ type: 'unsupported', tag, text }`，默认显示可读文本；`unknownTag: 'unwrap'` 可保留内部支持的结构，`'drop'` 可丢弃。脚本、样式和事件属性不进入原生交互。
- 颜色、字号、Panel、目录、脚注跳转、折叠详情等尚未承诺与 Web 等效。
- 代码高亮直接使用 Prism token 数据，不生成高亮 HTML；没有 token 时显示原文。
- Panel、Detail 保留分组、标题和展开状态的语义信息，默认组件静态展示内容；高亮和下划线原生展示，注音以附加文本展示。目录生成标题链接，脚注保留编号和引用；跳转仍由业务的 `linktap` 处理。

### 从 0.0.2 迁移

原有自定义模板需将列表项的 `inlines` 改为递归渲染 `children`；`html` block 改为 `unsupported` 文本；`unknownTag: 'html'` 改为 `'text'`。推荐直接使用包内组件。`setMarkdown()` 等输入方法保持不变。

## 直接语义解析与流式增量

原生路径为 `Markdown → Cherry 原有语法 hook → 语义节点 → 原生视图`。内建语法共享匹配规则、执行顺序、转义和流式自动闭合逻辑；hook 使用语义事件引用传递结构，直接构造节点，不生成 Markdown HTML 再回读。代码高亮使用 `Prism.tokenize`。只有用户显式输入的原始 HTML 需要标准 HTML 解析器处理，结果仍降级为原生数据。

追加输入时复用已确认的顶层语义块，保留最后两个块及其分隔符重新解析。检查点来自 Cherry 实际解析的块和行数，不通过另写一套围栏正则猜测；建立检查点前会分别解析候选左右片段，核对完整语义结果。未闭合 FrontMatter/Panel/Detail 由原有语法规则阻止冻结。

以下情况会使缓存失效或禁用增量复用：

- 非追加修改、清空，或 `unknownTag` / 光标选项变化。
- 真正的引用定义、脚注、目录、原始 HTML 等文档依赖，由对应 hook 发出失效信号。代码块中的同名文本不会误触发。
- 跨段空白强调配置、函数回调或自定义语法可能具有全局状态；保守完整重解析。
- 显式传入 `{ incremental: false }`，用于对照或诊断。

```ts
const stream = new CherryStream();
stream.setMarkdown(accumulatedMarkdown);
console.log(stream.getParseStats());
// mode: full | incremental | unchanged
// parsedCharacters: 实际交给语法引擎处理的规范化字符串长度，包含边界验证
// reusedCharacters: 本轮复用的前缀长度
```

相同 Markdown 不会重复解析；图片占位切换和样式选项仍可重新生成视图。视图层继续按顶层块差量提交。累计字符串比较、视图映射、节点比较仍有工作量；单个持续增长的代码块/列表仍需要解析活跃块，文档依赖可能触发完整重解析。这不是任意长度文档的恒定耗时保证，也尚未实现长列表虚拟化。

### 自定义渲染兼容边界

内建 Cherry 语法保持共享识别。仅返回 HTML 的第三方 renderer 不能直接运行于原生语义路径；不会静默回退到 HTML 转换。自定义语法 hook 应检查 `this.$engine.semanticRenderer`，并使用 `wrap(kind, data, content)` 或 `atom(kind, data)` 输出语义事件；有跨文档依赖时调用 `invalidateDocument(reason)`。Web 路径继续保留原有 HTML 返回值。配置型 HTML/CSS 回调不能自动获得浏览器等效布局。

`makeHtml()` 仍是显式 HTML API，供兼容和对照；`setMarkdown()`、`makeView()`、`makeBlocks()` 使用直接语义路径。公开的 `makeBlocks()` 返回独立副本，不暴露内部检查点缓存。

## Skyline 与验证

`examples/miniProgram` 提供普通页面 `pages/index/index` 和 Skyline 页面 `pages/skyline/index`，共用同一套原生组件。Skyline 页面显式配置 `renderer: skyline`、`componentFramework: glass-easel`、自定义导航与 `scroll-view` 滚动；未实现网页回退。

示例配置不等于真机验收。需在开发者工具确认实际渲染引擎，并在目标基础库和 iOS、Android 真机验证：

1. 中英文混排、链接、文本选择、嵌套列表和引用。
2. 宽表格横向滚动、代码换行与复制。
3. 流式结束、重置、页面销毁，以及图片占位切换后的滚动位置。
4. 长文解析耗时、提交数据量、布局帧耗时和内存；复杂内容以源码显示的边界。

本地自动检查覆盖 TS 类型、语义转换、调度、差量提交、发布包和 WXML 编译，不能代替 Skyline 真机性能数据。

## Demo

在仓库根目录：

```sh
vp run -F @cherry-markdown/miniprogram build
vp run -F @cherry-markdown/mini-program-demo build
```

在微信开发者工具中打开 `examples/miniProgram`。预览包验证及具体步骤见 [Demo README](../../examples/miniProgram/README.md)。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
