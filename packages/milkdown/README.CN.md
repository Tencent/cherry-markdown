# @cherry-markdown/milkdown

基于 Milkdown/ProseMirror 的开箱即用 Markdown 即见即所得编辑器。它复用 Cherry Markdown 的解析语义、渲染结果和视觉样式，但不创建 Cherry 编辑器、Previewer 或顶部工具栏，也不依赖 Cherry 的编辑器模式。

## React 最小接入

```tsx
import { useEffect, useRef } from 'react';
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

export function Editor() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let instance: Awaited<ReturnType<typeof cherryMilkdown>> | undefined;
    void cherryMilkdown({
      root: root.current!,
      value: '# Hello',
      onChange: ({ markdown }) => console.log(markdown),
    }).then((editor) => {
      if (disposed) return editor.destroy();
      instance = editor;
    });
    return () => {
      disposed = true;
      void instance?.destroy();
    };
  }, []);
  return <div ref={root} />;
}
```

包会创建默认 `CherryEngine`。仅在需要复用自定义 Cherry Engine Hook 或渲染配置时传入 `engine`。

## API

- `cherryMilkdown(options)`：创建独立编辑器。
- `getMarkdown()`：读取 Markdown。
- `setMarkdown(markdown, { emit? })`：更新 Markdown；默认触发 `onChange`。
- `setTheme(theme)`：切换 Cherry 主题，不改变 Markdown 和撤销历史。
- `focus()`：聚焦编辑器。
- `destroy()`：销毁编辑器及其浮层、NodeView 和渲染资源。
- `bubble`：是否启用文本选区浮层，默认 `true`。首期提供加粗、斜体、下划线、删除线。
- `readonly`：只读展示。
- `theme`：Cherry 主题，默认 `default`；支持 `dark`、`abyss`、`green`、`red`、`gray`、`violet` 和 `blue`。
- `plugins`：附加 Milkdown 插件。
- `renderers`：按 fenced code 的语言名注册可选渲染器。匹配的代码围栏会自动获得源码展开和热更新能力；`tableChart` 保留给表格图表预览。
- `fileUpload`：可选的图片文件上传函数。选择文件后仅回填地址和图片属性，用户点击“保存”后才写入 Markdown。

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
await cherryMilkdown({ root: '#markdown', value: markdown, renderers: { echarts, tableChart } });
```

自定义 renderer 不需要修改 Milkdown schema。下面的 `custom-chart` 会匹配语言为 `custom-chart` 的代码围栏；修改展开的源码后，仅重绘当前节点：

````ts
await cherryMilkdown({
  root: '#markdown',
  value: '```custom-chart\n{"value": 1}\n```',
  renderers: {
    'custom-chart': ({ container, source }) => {
      container.textContent = source;
    },
  },
});
````

```ts
await cherryMilkdown({
  root: '#markdown',
  value: markdown,
  fileUpload(file, done, { signal }) {
    upload(file, { signal }).then(({ url }) => done(url, { name: file.name, width: '100%' }));
  },
});
```

## 边界

- Markdown 是唯一的持久化数据格式。
- 普通 CommonMark/GFM 内容由 Milkdown 结构化编辑。
- Cherry 特有语法优先复用 CherryEngine 生成的 HTML；可安全结构化的节点提供源码热更新或属性控件，未知语法保留源码，避免错误改写。
- 文本 Bubble、链接编辑、图片控件属于本包，不调用 Cherry 编辑器内部 UI。
- 样式直接引入 Cherry 发布 CSS，并仅在 `.cherry-milkdown` 下补充编辑态样式，降低 Cherry 升级耦合。
- `mathlive`、`mermaid` 和 `echarts` 是按能力启用的 Peer：使用公式、Mermaid 或 ECharts 时安装对应依赖；运行期渲染失败会隔离在当前节点并通过 `onError` 报告，不阻断普通 Markdown。
- ECharts 配置只解析 JSON5 数据，不执行 JavaScript；地图仍需业务提供地图数据或自定义 renderer。
- 独立表格图表以 Milkdown 原生 GFM 表格作为唯一可编辑数据源，图表预览由单元格内容派生并热更新。Columns/Tabs 等 Cherry 原生复合块保持整体渲染和整体源码编辑，不向 Cherry 生成的内部 DOM 注入子节点按钮或图表挂载点。
- 通用拖动仅覆盖顶层段落和引用。标题保留 Cherry 原生锚点交互；列表与复合 Cherry 节点保留文本选择、剪切和粘贴语义，避免拖动手柄抢占内部交互。

运行 Demo：`yarn workspace @cherry-markdown/milkdown dev:demo`。
