# @cherry-markdown/milkdown

[English](./README.md)

Cherry Markdown 的 Milkdown 即见即所得扩展。推荐模式是把 Milkdown 挂载到现有 Cherry 预览区：页面、主题、工具栏和预览交互仍由 Cherry 管理，Milkdown 只让当前预览内容可以直接编辑。

## 能力

- CommonMark/GFM 使用 Milkdown 原生可编辑节点。
- 表格、任务列表、链接、图片、引用和代码块直接编辑。
- 行内和块级公式通过 MathLive 原地可视输入，仍序列化为 Cherry LaTeX。
- Cherry 颜色、背景色、字号、上下标、ruby、下划线和高亮使用可编辑 mark。
- Panel、Detail、Cols、Tabs、Timeline 保持连续正文编辑流，标题和正文都在原位置直接修改。
- TOC 自动跟随标题；frontmatter 和 comment reference 使用紧凑的原位源码节点，不显示字段表单或弹窗。
- Mermaid 默认渲染为图形；PlantUML、ECharts 可通过 `renderers` 接入。源码只在用户主动选择后于节点内部展开。
- HTML 使用无脚本权限的沙箱预览，并提供按需开启的节点内源码模式。

该包不会把 Cherry 扩展默认显示成 raw 源码卡片。业务自定义语法需要通过 Milkdown 插件提供 schema、parser、serializer 和 NodeView，未注册语法不宣称支持。

## 安装

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive mermaid
```

全局引入 Cherry 原样式和 Milkdown 的编辑行为样式：

```js
import 'cherry-markdown/dist/cherry-markdown.css';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
```

## 使用

```js
import Cherry from 'cherry-markdown';
import { attachCherryMilkdownPreview } from '@cherry-markdown/milkdown';

const cherry = new Cherry({
  id: 'editor',
  value: '# 标题\n\n行内公式 $E=mc^2$ 和 !!red 红色文字!!。',
  editor: { defaultModel: 'previewOnly' },
});

const editor = await attachCherryMilkdownPreview(cherry, {
  onChange({ markdown }) {
    console.log(markdown);
  },
});

// 预览区编辑会自动回写 cherry.getMarkdown() / CodeMirror。
// 源码编辑也会自动更新当前 Milkdown 预览内容。
await editor.detach(); // 恢复 Cherry 原生只读预览
```

`createCherryMilkdown` 仍可用于不需要 Cherry 页面壳的独立编辑器，但它不是本示例的默认集成方式。

`plugins` 会在内置 WYSIWYG 插件之后加载，可用于注册业务 NodeView。

编辑器不显示常驻格式工具栏。在空段落输入 `/` 调出插入命令，普通格式使用 Markdown 快捷输入；复合块标题和正文都直接编辑，结构按钮只在悬停或选中节点时出现。表格使用 Milkdown `table-block`，可增删、拖拽行列并修改列对齐；公式使用 MathLive，点击公式即可输入。

可通过 `mathlive` 传入宏和虚拟键盘模式：

```js
createCherryMilkdown({
  root,
  mathlive: {
    macros: { RR: '\\mathbb{R}' },
    virtualKeyboardMode: 'onfocus',
  },
});
```

`renderers` 可为特殊图表提供异步渲染；回调返回 HTML 字符串、清理函数或直接写入 `container`：

```js
createCherryMilkdown({
  root,
  renderers: {
    echarts: async ({ container, source }) => {
      const chart = createECharts(container, source);
      return () => chart.dispose();
    },
  },
});
```

## 本地示例

```sh
yarn build
npx vite examples
```

## 当前边界

CherryEngine 仍通过 `cherry-markdown/dist/cherry-markdown.engine.core.esm.js` 深层入口提供兼容能力。图表属于可视化嵌入对象，任意 HTML 因安全原因不会直接作为 ProseMirror 正文编辑；业务自定义 Hook 仍需提供 Milkdown 插件。

## 许可证

Apache-2.0，详见 [LICENSE](./LICENSE)。
