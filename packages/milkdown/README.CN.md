# @cherry-markdown/milkdown

独立的 Cherry 风格即见即所得编辑器。Milkdown/ProseMirror 管理唯一文档、
选区和历史；已发布的 CherryEngine 提供扩展语法 HTML，Cherry CSS 提供主题。
不会创建 Cherry、CodeMirror、顶部工具栏或源码联想面板。

## 接入

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive
# 按需安装图表依赖
npm install mermaid echarts
```

```ts
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

const editor = await cherryMilkdown({
  el: document.getElementById('editor')!,
  value: '# 标题',
  onChange({ markdown }) {
    console.log(markdown);
  },
});

editor.getMarkdown();
editor.setMarkdown('# 新内容');
await editor.destroy();
```

无需 attach、Cherry.usePlugin 或 mode 配置。旧的 PR 内部接入入口已删除，
不提供尚未发布 API 的兼容层。React 在 effect 中创建，在清理中销毁；
异步创建完成前卸载时也必须销毁迟到的实例，参见唯一的 React 示例。

## 配置

- `el`：容器。编辑器只清理自己创建的子树，不清空调用方其他 DOM。
- `value`：初始 Markdown。
- `readonly`：关闭编辑及编辑控件。
- `theme`：Cherry 主题名，默认原生 default。
- `bubble`：是否显示文本选区格式菜单，默认 true。不加载 Cherry Toolbar。
- `debounce`：外部 onChange 通知延迟，默认 30ms；不延迟文档更新。
- `cherryOptions`：传给独立 CherryEngine 的解析配置，不提供 Cherry 编辑器能力。
- `engine`：可选渲染器，至少实现 makeHtml。不得要求其具有 Previewer。
- `renderers`：复杂节点渲染函数，可返回清理函数；支持异步，迟到结果会清理。
- `mathlive`：公式宏和虚拟键盘设置。
- `plugins`：原生 Milkdown 插件，不是 Cherry.usePlugin。
- `onError(error, phase)`：create / parse / render 错误。

普通文本直接编辑；代码块直接编辑并支持语言选择；复杂节点在内部编辑源码。
Bubble 不对代码块、公式、HTML/图表源码或跨原子节点的选区生效。
选中图片或 Mermaid 可编辑宽度及对齐。

## 可选 ECharts

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';

const editor = await cherryMilkdown({
  el,
  value,
  renderers: { echarts, tableChart },
});
```

公开的 echarts renderer 接受 JSON/JSON5 数据，不执行 Markdown 中的 JavaScript。
未配置图表 renderer 时保留普通表格与源码。地图需要业务提供地理数据和
renderer；不会根据 Markdown URL 自动请求外部地图。

## 开发与验证

在仓库根目录执行：

```sh
yarn workspace @cherry-markdown/milkdown build:demo
yarn workspace @cherry-markdown/milkdown dev:demo --host 127.0.0.1 --port 4201
yarn workspace @cherry-markdown/milkdown typecheck
yarn workspace @cherry-markdown/milkdown test
yarn workspace @cherry-markdown/milkdown test:e2e
yarn workspace @cherry-markdown/milkdown test:consumer
```

只有一个 React 页面，默认即为独立编辑器；不再读取 previewOnly 等查询参数。
consumer 验证安装真正发布的 cherry-markdown@0.11.10，不重打包工作区 Cherry。

本次是架构迁移，不等于已达到全功能生产验收。高级图表配置、所有节点的
原生视觉像素对照、图片拖拽缩放和全手册交互仍须验收；详见
[迁移边界](./ARCHITECTURE.md)。
