# @cherry-markdown/milkdown

Cherry 的 previewOnly 即见即所得插件。Milkdown/ProseMirror 管理预览区的
文档、选区和历史；当前 Cherry 实例继续提供解析、主题和原生预览控件。
插件不创建第二个 Cherry，也不增加顶部工具栏或源码联想面板。

## 接入

```sh
npm install @cherry-markdown/milkdown @milkdown/kit cherry-markdown mathlive
# 按需安装图表依赖
npm install mermaid echarts
```

```ts
import Cherry from 'cherry-markdown';
import { MilkdownPlugin } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

Cherry.usePlugin(MilkdownPlugin, {
  onChange({ cherry, instanceId, markdown }) {
    console.log(markdown);
  },
});

const cherry = new Cherry({
  el: document.getElementById('editor')!,
  value: '# 标题',
  isPreviewOnly: true,
});

await cherry.whenPluginsReady();
const editor = cherry.getPlugin(MilkdownPlugin);
```

`Cherry.usePlugin()` 只调用一次，配置会应用到随后创建的 previewOnly
Cherry 实例。每个 Cherry 仍拥有独立的 Milkdown 文档和生命周期；
`cherry.destroy()` 会自动清理插件。editOnly、edit&preview 和 CherryStream
暂不接管。

## 配置

- `readonly`：关闭编辑及编辑控件。
- `bubble`：是否显示文本选区格式菜单，默认 true。不显示 Cherry 顶部 Toolbar。
- `debounce`：外部 onChange 通知延迟，默认 30ms；不延迟文档更新。
- `renderers`：复杂节点渲染函数，可返回清理函数；支持异步，迟到结果会清理。
- `mathlive`：公式宏和虚拟键盘设置。
- `plugins`：传给 Milkdown 内部的原生 Milkdown 插件。
- `onError(error, phase)`：create / parse / render 错误。

普通文本直接编辑；代码块直接编辑并支持语言选择；复杂节点在内部编辑源码。
Bubble 不对代码块、公式、HTML/图表源码或跨原子节点的选区生效。
选中图片或 Mermaid 可编辑宽度及对齐。

## 可选 ECharts

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';

Cherry.usePlugin(MilkdownPlugin, {
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

只有一个 React 页面，通过标准 Cherry previewOnly 配置启用预览模式；
consumer 会同时安装本次构建的 Cherry 与 Milkdown 发布包。

本次是架构迁移，不等于已达到全功能生产验收。高级图表配置、所有节点的
原生视觉像素对照、图片拖拽缩放和全手册交互仍须验收；详见
[迁移边界](./ARCHITECTURE.md)。
