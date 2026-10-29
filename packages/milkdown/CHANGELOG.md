# @cherry-markdown/milkdown

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
