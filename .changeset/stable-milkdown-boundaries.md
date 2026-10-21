---
'@cherry-markdown/milkdown': patch
---

feat: 新增独立的 Milkdown 所见即所得编辑器，复用 Cherry Engine 的解析语义、主题与样式，支持 CommonMark/GFM、表格图表及 Mermaid/ECharts 源码编辑与预览。

- 链接协议校验、剪贴板和图片布局复用 Cherry 工具，行内扩展的导入与实时输入共用 Cherry 规则；表格图表通过 Cherry Engine 扩展回调获取识别结果、参数与数据。Milkdown 保留实时编辑、选区、撤销重做及交互控件。
- 支持只读模式、主题切换、可取消上传和资源清理；修复行内代码转换、混合格式链接范围、特殊图片地址和表单滚动边界，通过缓存、防抖与稳定预览标识减少重复解析和无关图表重建。
- 接入 PR 预览与正式发布流程。首个 `0.0.1` 由维护者本地发布，CI 构建并上传产物；配置 npm Trusted Publisher 后，后续版本通过 OIDC 自动发布。

表格图表参数遵循 Cherry 的标准 JSON 与旧 key/value 格式，不额外接受 JSON5 方言；ECharts 代码围栏仍使用 Cherry 的数据型 JSON5 解析器。复杂扩展块采用整体渲染与源码编辑，未识别语法不承诺字节级保留。
