# @cherry-markdown/milkdown

基于 Milkdown/ProseMirror 的开箱即用 Markdown 即见即所得编辑器。它复用 Cherry Markdown 的解析语义、渲染结果和视觉样式，但不创建 Cherry 编辑器、Previewer 或顶部工具栏，也不依赖 Cherry 的编辑器模式。

需要 Node.js 22+；兼容的 `cherry-markdown` 版本范围以[包配置](./package.json)中的 `peerDependencies` 为准。Cherry 最低版本包含注入 ECharts 实例的地图注册表修复；地图加载、取消与重试仍由 Milkdown 负责。版本管理和 npm 发布配置见[发布说明](./RELEASING.md)。

请使用 `prosemirror-view` 1.42.3 或更新版本，以修复 [GHSA-c8x8-7fp4-3x9w](https://github.com/ProseMirror/prosemirror-view/security/advisories/GHSA-c8x8-7fp4-3x9w)。可通过 `npm ls prosemirror-view` 等方式检查编辑器实际使用的所有副本；直接声明 Peer 不能保证嵌套依赖中没有旧版本，`npm ls` 成功退出也不能替代逐项检查。

使用 Yarn Classic 的应用可以在根 `package.json` 中设置 `"resolutions": { "prosemirror-view": "^1.42.3" }`，运行 `yarn install` 更新锁文件，再检查安装后的依赖树。该设置也会影响应用中使用此包的其他依赖，需一并验证兼容性。

使用 npm 时，一种根项目配置是在 `dependencies` 中声明 `"prosemirror-view": "^1.42.3"`，并设置 `"overrides": { "prosemirror-view": "$prosemirror-view" }`。更新锁文件后仍需检查所有实际解析的副本；如果已有直接依赖，应调整现有声明，避免覆盖配置冲突。

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

包会创建默认 `CherryEngine`。可以通过 `engine` 传入兼容的自定义渲染实现。

默认 Cherry Engine 在初始化时读取浏览器存储。如果浏览器拒绝访问存储，创建可能失败，并通过 `onError` 报告 `create` 错误。应用可以传入适用于该环境的可信 `engine`；其渲染能力取决于具体实现。

## API

- `cherryMilkdown(options)`：创建独立编辑器。
- `getMarkdown()`：读取 Markdown。
- `onError(error, phase, context?)`：外部更新提交后发生插件视图错误，或序列化失败后插件在更新或回滚期间另行修改文档时，`context.getPreviousMarkdown()` 可读取更新前的本地内容，供应用保存或与当前内容比较。它不会修改当前文档或恢复插件状态。已缓存的文本在销毁后仍可读取；部分同步重入场景需要在销毁前、序列化器恢复后首次读取，否则会抛错。该上下文会持有原文档快照，保存后应释放引用；其他错误可能没有 `context`。
  若外部更新序列化失败且回滚也抛错，可从包入口导入 `ExternalUpdateRollbackError` 并使用 `instanceof` 判断；其 `errors` 依次包含原始序列化错误和回滚错误。
- `setMarkdown(markdown, { emit? })`：普通调用仍为全文替换，默认触发 `onChange`。输入法组合输入期间暂存最新外部回写，提交后合并不冲突的变化，保留中文、光标和撤销历史；同值回写不会覆盖输入或取消其它回写。重叠或无法安全映射的更新保留本地输入，并通过 `onError(error, 'parse')` 报告；这不是协同编辑协议。`emit: false` 仅静默外部修改，同时提交的本地输入仍触发包含合并结果的 `onChange`。
- 非组合输入期间，`emit: false` 的同值回写不会取消尚未发送的本地变更通知；不同内容的静默替换仍会替换文档并取消被覆盖的通知。
- `setTheme(theme)`：切换 Cherry 主题，不改变 Markdown 和撤销历史。ECharts 复用 Cherry 的轻量主题更新，保留图表数据；Mermaid 在原节点内重绘，不替换源码编辑面板。
- `focus()`：聚焦编辑器。
- `destroy()`：销毁编辑器及其浮层、NodeView 和渲染资源。销毁会取消尚未发送的防抖 `onChange`；需要保存时，应在销毁前读取并保存 `getMarkdown()`。
  依赖的历史记录实现可能继续持有最近编辑器的插件和已移除视图；调用 `destroy()` 不保证所有相关对象立即被垃圾回收。未完成的外部渲染任务和应用自身引用也会影响释放时机。
- `bubble`：是否启用文本选区浮层，默认 `true`。首期提供加粗、斜体、下划线、删除线。
- `readonly`：只读展示。
- `theme`：Cherry 主题，默认 `default`；支持 `dark`、`abyss`、`green`、`red`、`gray`、`violet` 和 `blue`。
- `plugins`：附加 Milkdown 插件。
- 附加插件与内置 Milkdown 插件共同运行；替换 schema、快捷键或 NodeView 的插件可能产生冲突，当前不保证任意第三方插件组合兼容。
- `renderers`：按 fenced code 的语言名注册可选渲染器。匹配的代码围栏会自动获得源码展开和热更新能力；`tableChart` 保留给表格图表预览。
- 使用公式时，请在应用中额外引入 `mathlive/fonts.css`；基础样式不强制依赖可选的 MathLive peer。
- `fileUpload`：可选的图片文件上传函数。选择文件后仅回填地址和图片属性，用户点击“保存”后才写入 Markdown；页面滚动或窗口大小变化时，图片编辑表单和正在进行的上传会保留。手动修改地址会取消正在进行的上传，并移除该上传附带的待保存属性。

光标进入链接时显示“打开链接 / 复制 / 编辑 / 取消链接”操作条，外观跟随 Cherry 主题。按 `Alt+F10` 可将焦点移入链接操作条，再用 Tab 切换操作、Escape 返回编辑器；编辑器中的 Tab 原有行为不变。取消链接保留文字和其他格式，可通过撤销恢复；编辑表单在滚动和调整窗口大小时保留未保存输入。`Ctrl/Cmd+K` 可编辑当前链接或为选中文字添加链接。

通过方向键选中图片后，也可按 `Alt+F10` 进入图片操作栏，用 Tab 切换操作、Space 或 Enter 执行、Escape 返回编辑器。

图片持续移动时，操作栏会跟随图片；为避免拖拽位置变化造成错误，缩放手柄在移动期间隐藏，动画停止后恢复。

暂停的图片动画调整进度后，操作栏和缩放手柄会跟随新位置；若缩放过程中进度发生变化，本次缩放会取消，文档不会写入旧位置计算出的尺寸。

缩放过程中若外部启动可能改变图片位置或尺寸的动画，本次缩放同样会取消；缩放自身产生的宽高过渡不受影响。

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
    return upload(file, { signal }).then(({ url }) => done(url, { name: file.name, width: '100%' }));
  },
});
```

请返回上传 Promise，使失败时编辑器能够显示错误并允许重试；上传地址仍通过回调提供。

## 边界

- 主模块和 ECharts 模块可在服务端渲染时导入，但创建编辑器和渲染图表需要浏览器 DOM；请在客户端生命周期中创建和销毁编辑器。

- Markdown 是唯一的持久化数据格式。
- 普通 CommonMark/GFM 内容由 Milkdown 结构化编辑。
- Cherry 特有语法由 CherryEngine 或配置的 renderer 渲染；只有解析与序列化确定的节点才提供结构化编辑，复杂块和已识别的自定义块使用整块源码编辑。
- 编辑时会尽量保留未修改的 Markdown 写法；当无法安全定位或验证原文时，会回退到序列化结果。即使是 CommonMark/GFM，也可能规范化未编辑部分的标题、列表标记、空白等写法，不保证字节级原样保留。需要精确源码的应用应保留原文，并根据实际场景检查保存后的结果。
- Cherry Engine 和表格图表 addon 当前通过包内适配入口引用 Cherry 发布的 dist 文件；升级 Cherry 时应集中核对这些入口及 Cherry 发布 CSS 路径。
- 自定义 renderer 可以直接操作传入的 `container`；如返回 HTML 字符串，字符串会先经过安全清洗再挂载。不要把未经处理的用户输入拼成可执行 HTML。
- 自定义 Engine 和 renderer 属于可信应用代码；清洗并非隔离沙箱，接入方仍须确保其生成的 HTML 和 CSS 适用于自己的信任边界。
- Engine 生成的 HTML 会移除样式表以及固定、粘性、绝对和变量指定的内联定位；相对定位会保留。显式注册的 renderer 返回的 HTML 为兼容图表会保留内嵌样式表，其样式可能影响宿主页面，必须使用可信实现。
- 为防止插入后改写链接或其他属性，清洗 HTML 字符串时会移除 SVG 的 SMIL 动画元素；需要动画的可信 renderer 可以自行管理传入的 `container`。
- 文本 Bubble、链接编辑、图片控件属于本包，不调用 Cherry 编辑器内部 UI。
- 样式直接引入 Cherry 发布 CSS，并仅在 `.cherry-milkdown` 下补充编辑态样式，降低 Cherry 升级耦合。
- `mathlive`、`mermaid` 和 `echarts` 是按能力启用的 Peer：使用公式、Mermaid 或 ECharts 时安装对应依赖；运行期渲染失败会隔离在当前节点并通过 `onError` 报告，不阻断普通 Markdown。
- esbuild 默认会解析动态导入，即使没有使用公式也会检查 `mathlive`。不安装 MathLive 时，请将 `mathlive` 配置为 `external`；此配置不会提供公式能力。需要公式时应安装并打包 MathLive，或自行提供运行时模块解析。
- 普通代码块的高亮跟随 Cherry 的语言清单，支持 TypeScript、JSON、Python 等语言及其别名；保留实时编辑、语言切换与复制控件，未知语言沿用 JavaScript 回退。
- ECharts 代码围栏配置只解析 JSON5 数据，不执行 JavaScript；地图仍需业务提供地图数据或自定义 renderer。
- 独立表格图表以 Milkdown 原生 GFM 表格作为唯一可编辑数据源，图表预览由单元格内容派生并热更新。Columns/Tabs 等 Cherry 原生复合块保持整体渲染和整体源码编辑，不向 Cherry 生成的内部 DOM 注入子节点按钮或图表挂载点。
- 通用拖动仅覆盖顶层段落和引用。标题保留 Cherry 原生锚点交互；列表与复合 Cherry 节点保留文本选择、剪切和粘贴语义，避免拖动手柄抢占内部交互。

运行 Demo：`yarn workspace @cherry-markdown/milkdown dev:demo`。

### 表格图表语法与性能边界

表格图表由 Cherry Engine 统一识别、解析参数和补齐缺列；Milkdown 继续负责单元格实时编辑、撤销与选区。推荐标准 JSON，例如 `:line:{"title":"趋势"}`；标准 JSON 不支持尾逗号。Cherry 的旧格式（例如 `:line:{title: 我的图表}`）继续兼容，但会给出上游弃用提示。不再将表格参数作为独立 JSON5 方言解析；非法标准 JSON 遵循 Cherry 的回退与诊断。代码围栏中的 ECharts 配置仍使用 Cherry 的数据型 JSON5 解析器，不执行 JavaScript。

表格分隔与转义以 Cherry 为准，单元格中的竖线应写作 `\|`，不要依赖反引号保护裸竖线。解析只处理当前表格，完整解析在防抖后进行；未变化表格与表头识别使用缓存，修改前面的表格不会重建无关图表。完整 Cherry 解析比轻量拆分更有开销，不能保证大表格的冷渲染与旧适配器同速。兼容性和性能验证见 [ARCHITECTURE.md](./ARCHITECTURE.md#table-chart-parsing)。
