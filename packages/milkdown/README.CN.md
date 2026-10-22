# @cherry-markdown/milkdown

基于 Milkdown/ProseMirror 的开箱即用 Markdown 即见即所得编辑器。它复用 Cherry Markdown 的解析语义、渲染结果和视觉样式，但不创建 Cherry 编辑器、Previewer 或顶部工具栏，也不依赖 Cherry 的编辑器模式。

需要 Node.js 22+ 和 `cherry-markdown >=0.11.11 <0.12.0`。Cherry 最低版本包含注入 ECharts 实例的地图注册表修复；地图加载、取消与重试仍由 Milkdown 负责。版本管理和 npm 发布配置见[发布说明](./RELEASING.md)。

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
- `setMarkdown(markdown, { emit? })`：普通调用仍为全文替换，默认触发 `onChange`。输入法组合输入期间暂存最新外部回写，提交后合并不冲突的变化，保留中文、光标和撤销历史；同值回写不会覆盖输入或取消其它回写。重叠或无法安全映射的更新保留本地输入，并通过 `onError(error, 'parse')` 报告；这不是协同编辑协议。`emit: false` 仅静默外部修改，同时提交的本地输入仍触发包含合并结果的 `onChange`。
- `setTheme(theme)`：切换 Cherry 主题，不改变 Markdown 和撤销历史。ECharts 复用 Cherry 的轻量主题更新，保留图表数据；Mermaid 在原节点内重绘，不替换源码编辑面板。
- `focus()`：聚焦编辑器。
- `destroy()`：销毁编辑器及其浮层、NodeView 和渲染资源。
- `bubble`：是否启用文本选区浮层，默认 `true`。首期提供加粗、斜体、下划线、删除线。
- `readonly`：只读展示。
- `theme`：Cherry 主题，默认 `default`；支持 `dark`、`abyss`、`green`、`red`、`gray`、`violet` 和 `blue`。
- `plugins`：附加 Milkdown 插件。
- 附加插件与内置 Milkdown 插件共同运行；替换 schema、快捷键或 NodeView 的插件可能产生冲突，当前不保证任意第三方插件组合兼容。
- `renderers`：按 fenced code 的语言名注册可选渲染器。匹配的代码围栏会自动获得源码展开和热更新能力；`tableChart` 保留给表格图表预览。
- 使用公式时，请在应用中额外引入 `mathlive/fonts.css`；基础样式不强制依赖可选的 MathLive peer。
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
- Cherry 特有语法由 CherryEngine 或配置的 renderer 渲染；只有解析与序列化确定的节点才提供结构化编辑，复杂块和已识别的自定义块使用整块源码编辑。未识别的 Cherry 扩展语法不承诺字节级原样保留。
- Cherry Engine 和表格图表 addon 当前通过包内适配入口引用 Cherry 发布的 dist 文件；升级 Cherry 时应集中核对这些入口及 Cherry 发布 CSS 路径。
- 自定义 renderer 可以直接操作传入的 `container`；如返回 HTML 字符串，字符串会先经过安全清洗再挂载。不要把未经处理的用户输入拼成可执行 HTML。
- 文本 Bubble、链接编辑、图片控件属于本包，不调用 Cherry 编辑器内部 UI。
- 样式直接引入 Cherry 发布 CSS，并仅在 `.cherry-milkdown` 下补充编辑态样式，降低 Cherry 升级耦合。
- `mathlive`、`mermaid` 和 `echarts` 是按能力启用的 Peer：使用公式、Mermaid 或 ECharts 时安装对应依赖；运行期渲染失败会隔离在当前节点并通过 `onError` 报告，不阻断普通 Markdown。
- 普通代码块的高亮跟随 Cherry 的语言清单，支持 TypeScript、JSON、Python 等语言及其别名；保留实时编辑、语言切换与复制控件，未知语言沿用 JavaScript 回退。
- ECharts 代码围栏配置只解析 JSON5 数据，不执行 JavaScript；地图仍需业务提供地图数据或自定义 renderer。
- 独立表格图表以 Milkdown 原生 GFM 表格作为唯一可编辑数据源，图表预览由单元格内容派生并热更新。Columns/Tabs 等 Cherry 原生复合块保持整体渲染和整体源码编辑，不向 Cherry 生成的内部 DOM 注入子节点按钮或图表挂载点。
- 通用拖动仅覆盖顶层段落和引用。标题保留 Cherry 原生锚点交互；列表与复合 Cherry 节点保留文本选择、剪切和粘贴语义，避免拖动手柄抢占内部交互。

运行 Demo：`yarn workspace @cherry-markdown/milkdown dev:demo`。

### 表格图表语法与性能边界

表格图表由 Cherry Engine 统一识别、解析参数和补齐缺列；Milkdown 继续负责单元格实时编辑、撤销与选区。推荐标准 JSON，例如 `:line:{"title":"趋势"}`；标准 JSON 不支持尾逗号。Cherry 的旧格式（例如 `:line:{title: 我的图表}`）继续兼容，但会给出上游弃用提示。不再将表格参数作为独立 JSON5 方言解析；非法标准 JSON 遵循 Cherry 的回退与诊断。代码围栏中的 ECharts 配置仍使用 Cherry 的数据型 JSON5 解析器，不执行 JavaScript。

表格分隔与转义以 Cherry 为准，单元格中的竖线应写作 `\|`，不要依赖反引号保护裸竖线。解析只处理当前表格，完整解析在防抖后进行；未变化表格与表头识别使用缓存，修改前面的表格不会重建无关图表。完整 Cherry 解析比轻量拆分更有开销，不能保证大表格的冷渲染与旧适配器同速。兼容性和性能验证见 [ARCHITECTURE.md](./ARCHITECTURE.md#table-chart-parsing)。
