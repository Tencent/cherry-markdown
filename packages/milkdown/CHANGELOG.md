# @cherry-markdown/milkdown

## 0.0.2

### Patch Changes

- feat: 优化链接浮层，支持直接打开、复制、编辑和取消链接，外观跟随 Cherry 主题。支持使用 Alt+F10 进入链接操作条，同时保留编辑器原有的 Tab 行为。调整链接编辑表单样式；取消链接可一次撤销，滚动或调整窗口时保留未保存的表单内容。 [@RSS1102](https://github.com/RSS1102)([#1929](https://github.com/Tencent/cherry-markdown/pull/1929))([`44f6e87`](https://github.com/Tencent/cherry-markdown/commit/44f6e87b5f115acd910764f78e6e2ce6d5ea5ca1))
- fix(milkdown): 同步 Cherry 的 URL 协议校验，阻止通过字符实体编码绕过危险协议检查 [@RSS1102](https://github.com/RSS1102)([#1947](https://github.com/Tencent/cherry-markdown/pull/1947))([`372b561`](https://github.com/Tencent/cherry-markdown/commit/372b561e4e0ca46be5ff938973b745c244c928ba))
- Updated dependencies [[`1be27df`](https://github.com/Tencent/cherry-markdown/commit/1be27df42044f0871a408518e53490b4341d1dce), [`2318517`](https://github.com/Tencent/cherry-markdown/commit/23185172a985e0f10714dba70921e6806c9d854a), [`1e76861`](https://github.com/Tencent/cherry-markdown/commit/1e76861a0a8d1cc2f7982e92312b792340f6b895), [`8112362`](https://github.com/Tencent/cherry-markdown/commit/81123621dee47c07fa6c85fa67c96d8eee855164), [`b2cc414`](https://github.com/Tencent/cherry-markdown/commit/b2cc4149a20989acc3e7dba842c2c21eab235825), [`464480b`](https://github.com/Tencent/cherry-markdown/commit/464480b59e31f58f452a3a5e483abd2213c5c205)]:
  - cherry-markdown@0.11.13

## 0.0.1

### Patch Changes

- feat: 新增独立的 Milkdown 所见即所得 Markdown 编辑器，支持 CommonMark/GFM 与 Cherry 扩展内容，沿用 Cherry 的主题与样式。

- 支持文本选区格式工具、链接编辑、图片属性编辑与文件上传，以及表格单元格实时编辑、撤销重做和中文输入。
- 普通代码块高亮跟随 Cherry 的语言清单与加载规则，支持 TypeScript、JSON、Python、语言别名及嵌入语法，保留实时编辑和现有控件。
- 支持 Mermaid、ECharts、表格图表、公式及自定义代码块渲染，提供源码编辑与预览更新。
- 提供 Markdown 读取与更新、只读模式、主题切换、内容变更与错误回调，支持附加 Milkdown 插件和自定义渲染器。

复杂扩展块使用整体源码编辑；未识别语法不承诺原样保留。表格图表参数遵循 Cherry 的标准 JSON 与旧 key/value 格式。 [@RSS1102](https://github.com/RSS1102)([#1891](https://github.com/Tencent/cherry-markdown/pull/1891))([`2ebf8dc`](https://github.com/Tencent/cherry-markdown/commit/2ebf8dc9d484069690699bc705ad97349eadf297))

- Updated dependencies [[`2ebf8dc`](https://github.com/Tencent/cherry-markdown/commit/2ebf8dc9d484069690699bc705ad97349eadf297), [`6857c4a`](https://github.com/Tencent/cherry-markdown/commit/6857c4a04522a31dd4e12161d5165dc43596f69b), [`0017dc0`](https://github.com/Tencent/cherry-markdown/commit/0017dc0a3b75536073fdcbb7b5d4f7dae1506c67), [`6f1bc3d`](https://github.com/Tencent/cherry-markdown/commit/6f1bc3de244478e9c0758192977ddcf6c2b45a88)]:
  - cherry-markdown@0.11.12
