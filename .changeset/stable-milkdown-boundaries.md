---
'@cherry-markdown/milkdown': patch
---

feat: 新增基于 Milkdown/ProseMirror 的独立所见即所得编辑器，复用 Cherry Engine 的解析语义、主题和样式，支持 CommonMark/GFM、表格图表及 Mermaid/ECharts 源码编辑。

提供文本、链接与图片编辑，支持只读模式、主题切换、可取消上传和资源清理；接入预览与正式发布流程。复杂 Cherry 扩展块采用整体渲染和源码编辑，未识别语法不承诺字节级保留。

链接与代码复制复用 Cherry 剪贴板逻辑，链接校验和图片布局复用 Cherry 纯工具；行内扩展语法由 Cherry 规则生成并供导入与输入共用，修复转义标记、标记优先级和属性同值文本的处理，保留现有编辑控件外观。
