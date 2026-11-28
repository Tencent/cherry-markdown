# Milkdown 配置范围

配置以本文件和包导出的 TypeScript 类型为准。使用 `satisfies CherryMilkdownOptions` 获取字段提示。JavaScript 接入也会在创建编辑器前校验字段和类型，未知字段、非法值及冲突配置会以包含字段路径的 TypeError 拒绝创建，并通知有效的 `onError(error, 'create')`。

```ts
import { cherryMilkdown, type CherryMilkdownOptions } from '@cherry-markdown/milkdown';

const options = {
  root: '#markdown',
  value: '# Hello',
  theme: 'default',
  bubble: true,
  onChange: ({ markdown }) => saveDraft(markdown),
} satisfies CherryMilkdownOptions;

const editor = await cherryMilkdown(options);
```

## 编辑器选项

| 字段            | 默认值                       | 生效范围                            | 依赖和约束                                                                        |
| --------------- | ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `root`          | 必填                         | 创建拥有独立 Shadow Root 的子宿主   | 可匹配的选择器或 HTMLElement                                                      |
| `value`         | 空字符串                     | 初始 Markdown                       | 字符串                                                                            |
| `readonly`      | `false`                      | 禁用用户编辑和编辑控件              | API 的 setMarkdown 仍可写入                                                       |
| `bubble`        | `true`                       | 文本选区格式工具条                  | 布尔值，只读时隐藏；默认提供加粗、斜体、下划线、删除线、链接、行内代码；更多提供高亮和清除格式（保留链接）                            |
| `theme`         | `default`                    | 正文、控件及内置图表主题            | default、dark、abyss、green、red、gray、violet、blue                              |
| `debounce`      | `30` 毫秒                    | Markdown 变更通知及节点预览更新调度 | 大于等于零的有限数；不延迟 getMarkdown                                            |
| `onChange`      | 无                           | 接收防抖后的 `{ markdown }`         | 函数；不因初始 value 通知；setMarkdown 默认通知，emit:false 静默外部写入          |
| `onError`       | 无                           | 创建、解析、渲染错误                | 函数，第二个参数为 create、parse 或 render；创建失败仍拒绝 Promise                |
| `fileUpload`    | 无                           | 图片表单上传和地址回填              | 函数；业务负责网络和存储，使用 AbortSignal 取消；用户保存后写入 Markdown          |
| `mathlive`      | MathLive 默认行为            | 公式节点                            | 安装可选 mathlive peer；可按需引入 mathlive/fonts.css                             |
| `renderers`     | 空注册表                     | 围栏语言及表格图表预览              | 值必须为函数；内置 Mermaid 懒加载对应 peer                                        |
| `plugins`       | 空数组                       | 追加 Milkdown 插件                  | 插件函数数组，按传入顺序注册；替换 schema、NodeView、快捷键需由接入方评估组合行为 |
| `engine`        | 默认 Cherry Engine           | Cherry 扩展块、HTML 和图片等渲染    | 对象必须提供 makeHtml；可提供 destroyRenderedContent；与 engineOptions 互斥       |
| `engineOptions` | 空对象，使用 Cherry 默认行为 | 创建默认 Engine 时的渲染钩子        | 只开放下表列出的 callback；高级配置通过业务创建的 engine 注入                     |

`readonly`、`bubble`、`plugins` 等创建选项在挂载时读取。运行时更新使用 `setMarkdown()` 和 `setTheme()`。不支持的主题会抛出错误。

## Engine 渲染钩子

| 字段                                        | 默认值                  | 生效范围                                           | 约束                                                            |
| ------------------------------------------- | ----------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| `engineOptions.callback.urlProcessor`       | Cherry 默认 URL 处理    | 经过 Cherry 渲染的 URL，包括图片和 Cherry 扩展内容 | Milkdown 定义受支持的钩子签名；不承诺影响 Milkdown 原生链接 mark 的 href |
| `engineOptions.callback.beforeImageMounted` | Cherry 默认图片属性处理 | 图片渲染前改写 src 和 srcProp                      | Milkdown 定义受支持的钩子签名                                    |

这两个钩子是渲染层配置。CommonMark/GFM 编辑由 Milkdown 管理。Cherry 的 toolbar、editor、previewer、engine.syntax、customSyntax 等配置不能直接传入 Milkdown。需要业务特有渲染时，通过业务配置的 `engine` 或 `renderers` 接入。通过自定义 engine 注入的行为由业务负责，该对象的内部配置不会由 Milkdown 校验。

## 公式和渲染器

| 配置                                          | 默认值             | 生效范围和依赖                                                                                |
| --------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `mathlive.macros`                             | 未覆盖 MathLive 宏 | 字符串到字符串的映射，应用到公式组件                                                          |
| `mathlive.virtualKeyboardMode`                | MathLive 默认行为  | auto、manual、onfocus、off；由 MathLive 组件处理                                              |
| `renderers.<language>`                        | 未注册             | 对应语言的代码围栏；接收 container、source、syntax、engine、signal；可返回清理函数            |
| `renderers.tableChart`                        | 未注册             | 表格图表预览；表格仍由 Milkdown 编辑                                                          |
| `createEChartsRenderers({ transformOption })` | 无变换             | 安装可选 echarts peer；同步修改 option 副本或返回完整 option，context 提供 kind、type、source |

Mermaid 和 MathLive 在遇到相应内容时加载。缺失依赖或渲染失败通过节点错误状态和 `onError(error, 'render')` 报告。业务自定义 renderer 所需依赖由业务安装。

transformOption 处理预览配置，不写回 Markdown。完整重绘从原始配置重新应用变换，主题切换保留结果。需要异步数据时，先在业务层获取数据，再让同步回调读取已取得的数据。回调无法自动感知业务变量变更，需要重新应用文档或通过业务 renderer 管理实时更新。

## 样式和部件

Shadow Root 自动加载正文和编辑态样式。在 root 容器上设置以下变量，按实例生效。

| 变量                      | 默认行为                            |
| ------------------------- | ----------------------------------- |
| `--milkdown-font-family`  | Cherry 当前字体                     |
| `--milkdown-font-size`    | Cherry 当前字号                     |
| `--milkdown-line-height`  | Cherry 当前段落行高                 |
| `--milkdown-text-color`   | Cherry 当前正文颜色                 |
| `--milkdown-background`   | 透明，显示 Cherry 编辑区背景        |
| `--milkdown-accent-color` | Cherry 链接色，用于部分编辑控件强调 |
| `--milkdown-chart-height` | 300px，内置 ECharts 容器            |

部件选择器形如 `#markdown > [data-cherry-milkdown]::part(content)`。支持 content（正文）、toolbar（上下文工具条）、link-form、image-form、source（扩展块源码面板）、chart（内置 ECharts 容器）。业务 renderer 可以自行管理它创建的 DOM。

## 向接入方说明范围

可以在业务接入文档中使用下面这段说明，并链接到当前版本随包发布的 CONFIGURATION.md。

> Milkdown 的配置以 CherryMilkdownOptions 和 CONFIGURATION.md 为准。正文编辑、选区和撤销由 Milkdown 管理，Cherry Engine 提供扩展内容渲染。样式通过公开 CSS 变量和 ::part 定制，图表通过 renderers 和 transformOption 定制。配置错误会返回包含字段路径的 TypeError。自定义 Engine、插件和 renderer 的业务行为由接入方维护。
