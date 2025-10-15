# Change Log

## 0.10.1-alpha.0

### Patch Changes

- style: 调整图片工具面板的图标和样式
  feat: 侧边栏工具 响应顶部工具栏高度
  style: 优化侧边栏工具样式
  style: 微调「沉稳」主题配色
  fix: 修复显示二级菜单时的状态闪烁问题
  fix: 表格控制器层级错误 [@Seeridia](https://github.com/Seeridia)([#1464](https://github.com/Tencent/cherry-markdown/pull/1464))([`513eeb0`](https://github.com/Tencent/cherry-markdown/commit/513eeb04ec4d8da39148dbed15a3b1421891b6c0))
- fix: 调整建议面板位置以避免超出边界 [@Seeridia](https://github.com/Seeridia)([#1372](https://github.com/Tencent/cherry-markdown/pull/1372))([`6c4bb89`](https://github.com/Tencent/cherry-markdown/commit/6c4bb89a71b1386c3b165def51782cc85b383507))
- fix(math): 修复 math `externals` 配置不起作用的问题 [@lyngai](https://github.com/lyngai)([#1437](https://github.com/Tencent/cherry-markdown/pull/1437))([`5909dcd`](https://github.com/Tencent/cherry-markdown/commit/5909dcd7084857f8c3105651fafc65438f26b5d9))
- 修复地图图表的加载、显示、导出问题；微调图表样式；新增桑基图 [@Aurora-N](https://github.com/Aurora-N)([#1417](https://github.com/Tencent/cherry-markdown/pull/1417))([`630adc7`](https://github.com/Tencent/cherry-markdown/commit/630adc70b6a49a00c43697f4364a975a78604671))
- feat: #1445 增加默认mobile模式的配置 [@sunsonliu](https://github.com/sunsonliu)([#1449](https://github.com/Tencent/cherry-markdown/pull/1449))([`69e9a9b`](https://github.com/Tencent/cherry-markdown/commit/69e9a9b144b0def931448aabd0f2a39485e30cb8))
- style: 优化代码块工具栏的定位逻辑，从px改成em [@sunsonliu](https://github.com/sunsonliu)([#1459](https://github.com/Tencent/cherry-markdown/pull/1459))([`3bf6f5d`](https://github.com/Tencent/cherry-markdown/commit/3bf6f5da80336a023b470817e17559d609353e0f))
- fix: #1442 优化斜体和正文中间有重叠的问题 [@sunsonliu](https://github.com/sunsonliu)([#1450](https://github.com/Tencent/cherry-markdown/pull/1450))([`057fd27`](https://github.com/Tencent/cherry-markdown/commit/057fd27b0e495a85a57ccbc367b8c2b1364e96b1))
- improve codeblock preview toolbar ui [@YeXingKe](https://github.com/YeXingKe)([#1315](https://github.com/Tencent/cherry-markdown/pull/1315))([`c86824f`](https://github.com/Tencent/cherry-markdown/commit/c86824f5332be49c0d5b1d285ef82c21c65154fe))
- chore: use `vite` for dev and `rollup` upgrade to `v4` [@RSS1102](https://github.com/RSS1102)([#1452](https://github.com/Tencent/cherry-markdown/pull/1452))([`64a3278`](https://github.com/Tencent/cherry-markdown/commit/64a3278ee324bb30576bfaab53832640a4d5694b))
- refactor: #1229 丰富图表的类型并增加图表交互 [@Wei-Xiaoxing](https://github.com/Wei-Xiaoxing)([#1349](https://github.com/Tencent/cherry-markdown/pull/1349))([`c1c290f`](https://github.com/Tencent/cherry-markdown/commit/c1c290fbe159e4b2d2c0cd703b4f13e67ab6bb6c))
- - refactor: 将图表的`options`配置格式更改为更加通用的 JSON 格式

  - 采取渐进式迁移，如果失败则回退至旧的解析方案，并打印弃用警告

- feat: 使散点图支持语义化的列标题, 增加一个特殊的键名 `cherry:mapping` 来指明映射关系
  - 在解析 `cherry:mapping` 之后, 会首先对必要维度进行错误验证
  - 采取渐进式迁移, 在不符合新指令格式时回退到旧的处理逻辑

- fix: 使图表可以跟随表格的对齐方式

- fix: 修复图表语法在省略花括号时不能尾随空格的问题
  - 移除了相应的冗余代码

- refactor: 根据新语法修改相应的示例代码和说明、工具栏相关代码 [@yang-summer](https://github.com/yang-summer)([#1409](https://github.com/Tencent/cherry-markdown/pull/1409))([`d4dc15b`](https://github.com/Tencent/cherry-markdown/commit/d4dc15b627d84cadf5394dc7c797b1812d3e8e2d))
- feat: 添加 codemirror 的 placeholder 配置支持 [@Seeridia](https://github.com/Seeridia)([#1395](https://github.com/Tencent/cherry-markdown/pull/1395))([`04f5e62`](https://github.com/Tencent/cherry-markdown/commit/04f5e62958f35d5c3a1787e804a8598d6742aece))
- feat: 添加行内代码颜色指示 [@Seeridia](https://github.com/Seeridia)([#1403](https://github.com/Tencent/cherry-markdown/pull/1403))([`ba30ff5`](https://github.com/Tencent/cherry-markdown/commit/ba30ff5bb6bd44d22f0cbcc0a7db63dee9c4d385))
- feat: 支持输入联想功能配置，支持自定义候选项

fix: 修复点击选定联想词导致光标失焦问题 [@Seeridia](https://github.com/Seeridia)([#1360](https://github.com/Tencent/cherry-markdown/pull/1360))([`9bee29a`](https://github.com/Tencent/cherry-markdown/commit/9bee29a1b9b3c2b4d34e7e08ccacfe63be4e4bfa))

- feat: 添加行内公式和块级公式的联想建议支持 [@Seeridia](https://github.com/Seeridia)([#1410](https://github.com/Tencent/cherry-markdown/pull/1410))([`24971b5`](https://github.com/Tencent/cherry-markdown/commit/24971b5e7ca07d17138b8496fda90cf816426395))
- fix: 添加导出专用样式开关，避免常规打印时误隐藏内容 [@Seeridia](https://github.com/Seeridia)([#1408](https://github.com/Tencent/cherry-markdown/pull/1408))([`4c32ac7`](https://github.com/Tencent/cherry-markdown/commit/4c32ac74e6e6de754f849f2e256be8354e56da33))
- fix: 优化编辑行的高光效果

fix: 改进图片尺寸 handler 的更新策略，防止编辑行的高光闪烁 [@Seeridia](https://github.com/Seeridia)([#1375](https://github.com/Tencent/cherry-markdown/pull/1375))([`172c702`](https://github.com/Tencent/cherry-markdown/commit/172c7020ce69a6e2a3da02b26f72ae8515a68e9e))

- fix: 改进图片工具栏定位逻辑 [@Seeridia](https://github.com/Seeridia)([#1426](https://github.com/Tencent/cherry-markdown/pull/1426))([`a067f37`](https://github.com/Tencent/cherry-markdown/commit/a067f3792a08c4cfd871a8733f592f4b66d23640))
- fix: 优化建议面板的键盘导航逻辑 [@Seeridia](https://github.com/Seeridia)([#1394](https://github.com/Tencent/cherry-markdown/pull/1394))([`ffe38b8`](https://github.com/Tencent/cherry-markdown/commit/ffe38b8f1fc5f73f424b850c189f1fbc35c9abee))
- 修复表格倒数第二行行前空格导致解析出错 [@Seeridia](https://github.com/Seeridia)([#1447](https://github.com/Tencent/cherry-markdown/pull/1447))([`af30d00`](https://github.com/Tencent/cherry-markdown/commit/af30d00776a75b59ffac62881a68fe63ff8c43b0))
- 图表类型增加散点图、图表适配各个主题样式、修复导出问题 [@Aurora-N](https://github.com/Aurora-N)([#1362](https://github.com/Tencent/cherry-markdown/pull/1362))([`92ebbc6`](https://github.com/Tencent/cherry-markdown/commit/92ebbc6f1ad42d8a5c86dc7d5796f27b9d160710))
- fix: 修复在预览区的表头选择增加行时在分隔行上方插入的问题 [@yang-summer](https://github.com/yang-summer)([#1418](https://github.com/Tencent/cherry-markdown/pull/1418))([`136f455`](https://github.com/Tencent/cherry-markdown/commit/136f455da75df1b79c7ff44fa71a21fbcf6da19a))
- fix: 修复配图表格在脚注显示异常的问题 [@Aurora-N](https://github.com/Aurora-N)([#1422](https://github.com/Tencent/cherry-markdown/pull/1422))([`d3140e2`](https://github.com/Tencent/cherry-markdown/commit/d3140e2fa4837f7100d93e4d0e81fd860c5a0882))
- style: 增加“沉稳”主题 [@sunsonliu](https://github.com/sunsonliu)([#1425](https://github.com/Tencent/cherry-markdown/pull/1425))([`8d340ab`](https://github.com/Tencent/cherry-markdown/commit/8d340ab34802e8988dbccb46796ce2645e5e9a30))
- refactor(table): 重构表格交互（新增菜单气泡、边界插入、列宽拖拽、拖拽高亮重写、变量调整） [@Seeridia](https://github.com/Seeridia)([#1436](https://github.com/Tencent/cherry-markdown/pull/1436))([`a93564b`](https://github.com/Tencent/cherry-markdown/commit/a93564b44de8466777bc759c300d60dabc464a91))
- feat: #1438 增加连续空格（默认不支持）语法和配置 [@sunsonliu](https://github.com/sunsonliu)([#1439](https://github.com/Tencent/cherry-markdown/pull/1439))([`a142b3b`](https://github.com/Tencent/cherry-markdown/commit/a142b3be2ff71e51da78fb9c1c806ca11873e37e))
- refactor: 简化 cherry-table-echarts-plugin.js 代码

- style: 代码格式化
- fix: 修复地图无法显示的 bug
- refactor: 删除重复的一套图表配置生成代码
- refactor: 简化重复的部分图表配置组件代码 [@Wei-Xiaoxing](https://github.com/Wei-Xiaoxing)([#1382](https://github.com/Tencent/cherry-markdown/pull/1382))([`594577f`](https://github.com/Tencent/cherry-markdown/commit/594577f5d2a02486f18c39d87e06036cd247254a))
- fix(mermaid): 修复 mermaid 在 shadow dom 中无法选中元素的问题 [@RSS1102](https://github.com/RSS1102)([#1460](https://github.com/Tencent/cherry-markdown/pull/1460))([`f9ed1ae`](https://github.com/Tencent/cherry-markdown/commit/f9ed1ae601bf69564c1d0b87e5cbd93ed28bed68))
- feat: #1363 图片样式属性放到style属性里 [@sunsonliu](https://github.com/sunsonliu)([#1427](https://github.com/Tencent/cherry-markdown/pull/1427))([`0b9b429`](https://github.com/Tencent/cherry-markdown/commit/0b9b4298ee74bdbf6f21756b079d804f6e701712))
- fix: 自定义代码块语法 `all` 排除对于 `mermaid` 代码块的操作 [@sunsonliu](https://github.com/sunsonliu)([#1465](https://github.com/Tencent/cherry-markdown/pull/1465))([`19534f4`](https://github.com/Tencent/cherry-markdown/commit/19534f4624980ffcc5a9e5c70c48ca3081077b1f))
- feat: 全面优化表格功能，支持多主题样式、预览区定位、HTML表格标签和引用表格编辑 [@ghost613bb](https://github.com/ghost613bb)([#1347](https://github.com/Tencent/cherry-markdown/pull/1347))([`3434053`](https://github.com/Tencent/cherry-markdown/commit/34340531bc643dd1affc7e602a4b80f5ee55d2bc))
- fix: #1461 #1453 精简流式渲染场景的dom结构，并优化流式渲染场景mermaid的渲染失败时的处理逻辑

#### 在流式输出模式下(`global.flowSessionContext=true`)

1. 当只有一个 mermaid 渲染的时候，如果在编辑过程中出现 mermaid 渲染错误，他会保持渲染上次渲染成功 mermaid svg。
2. 当有多个 mermaid 渲染的时候，当在第一次渲染的时候，如果后面的 mermaid 渲染错误，他会往上寻找直到寻找渲染成功的 mermaid svg 进行替换当前渲染错误的 mermaid。

#### 在流式输出模式下(`global.flowSessionContext=true`) && 没有开启预览区编辑(`enablePreviewerBubble=false`)

1. 并且没有开启预览区编辑，则需要移除不再需要的dom ,这里针对流式输出的场景简单移除dom，是符合预期的，但这种精简 dom 的方案在需要 switchModel 时会有问题。 [@sunsonliu](https://github.com/sunsonliu)([#1463](https://github.com/Tencent/cherry-markdown/pull/1463))([`c1c306b`](https://github.com/Tencent/cherry-markdown/commit/c1c306b4eed2b5dce14ffc10eee2ae8e3c001bf8))

- feat: 修复表格相关语法漏洞，提升兼容性
  优化根据预览区表格定位编辑区表格语法的逻辑，使支持用户输入的html table标签，支持点击单元格后定位编辑区代码，但不支持编辑；
  兼容脚注里出现表格后，打乱预览区表格编辑逻辑的问题
  双击预览区脚注中的表格可以定位到编辑区对应位置
  兼容表格位于文件末尾时，编辑时格式出错的问题
  删去表头的行添加按钮，因为可能导致表格格式出错。 [@Jiadezhende](https://github.com/Jiadezhende)([#1350](https://github.com/Tencent/cherry-markdown/pull/1350))([`dd3d953`](https://github.com/Tencent/cherry-markdown/commit/dd3d953140511db2fe0e7eae1d8fcd069497cd54))

## 0.10.0

### Minor Changes

- feat: 图片样式编辑功能增强 - 支持对齐方式设置 (#1268)

## ✨ 新增特性

- **对齐方式控制**: 图片样式工具栏新增对齐方式交互按钮
  - 支持左对齐、居中、右对齐
  - 支持左浮动、右浮动
- **图标资源**: 新增对齐方式相关的图标文件

## ⚠️ 技术债务

**DOM 渲染时机问题**:

- **现状**: 使用 `setTimeout(() => this.afterUpdate(), 100)` 临时解决 DOM 更新后的回调时机
- **原因**: 原生 JavaScript 缺少类似 Vue `nextTick` 的 DOM 更新后回调机制 [@Wei-Xiaoxing](https://github.com/Wei-Xiaoxing)([#1292](https://github.com/Tencent/cherry-markdown/pull/1292))([`9e9dfb5`](https://github.com/Tencent/cherry-markdown/commit/9e9dfb53df4040124f5814c6913af329a9830d69))
- style: #1268 预览区图片所见即所得编辑能力增加设置图片样式的功能

- 增加图片样式工具栏气泡，当前版本支持修改边框/阴影/圆角；
- 允许图片样式工具栏气泡跟随页面滚动；
- 修复 `PreviewerBubble.js` 中样式代码捕获不完整的问题，确保样式设置的准确性； [@Wei-Xiaoxing](https://github.com/Wei-Xiaoxing)([#1278](https://github.com/Tencent/cherry-markdown/pull/1278))([`0474c1a`](https://github.com/Tencent/cherry-markdown/commit/0474c1a8d2d170fd6c69bd55119ade907a73392a))
- feat(theme): set light theme as new default [#1314](https://github.com/Tencent/cherry-markdown/issues/1314)

### 破坏性更改 BREAKING CHANGES

- **移除 `light` 主题**：原有的 `light` 主题已被移除
- **默认主题变更**： `light` 作为新的默认主题
- **主题列表更新**：可用主题列表中不再包含 `light` 选项

### 影响范围 IMPACTS

- 对于原本在配置项 `themeSettings.mainTheme` 中使用 `light` 主题的用户，由于该主题不存在，将会导致主题切换为 `default` 主题，也即是原先的 `light` 主题

### 迁移指南 MIGRATION GUIDE

- 如果您之前使用了 `light` 主题：
  1. 由于 `light` 以不存在，主题会自动切换为 `default` 主题
  2. （可选）你可以选择将配置中的 `mainTheme: 'light'` 更改为 `mainTheme: 'default'`
- 如果您之前自定义配置了 `light` 主题：
  1. 您可以直接把原先 `light.scss` 文件底部的配置项迁移到 `default.scss` 文件中
  2. （可选）你可以选择将配置中的 `mainTheme: 'light'` 更改为 `mainTheme: 'default'`
- 如果您之前自定义配置了 `default` 主题：
  1. 您可以将原先 `default.scss` 文件底部的配置项迁移到新的 `default.scss` 文件中 [@Seeridia](https://github.com/Seeridia)([#1322](https://github.com/Tencent/cherry-markdown/pull/1322))([`8444130`](https://github.com/Tencent/cherry-markdown/commit/84441304159cdb3458c7a89cf872297e316c7cb0))
- feat: 增加 `editor.maxUrlLength` 属性以控制 `url` 是否缩略 [@YFAnt](https://github.com/YFAnt)([#1320](https://github.com/Tencent/cherry-markdown/pull/1320))([`bc7a046`](https://github.com/Tencent/cherry-markdown/commit/bc7a0469e1cd38257084f356d2434ac3e3b394fb))
- refactor: 重构主题 CSS 变量集成系统

### 主要变更

- **🎨 CSS 变量系统重构**: 完全重构了主题系统，引入现代化的 CSS 变量架构
  - 新增 `variables/` 目录，包含基础效果变量、语义化界面变量和 Open Color 颜色系统
  - 移除了传统的 SCSS 变量系统，提高主题切换性能和可维护性
- **🔧 主题文件优化**: 重构所有主题文件，大幅简化代码
  - 将硬编码颜色值替换为语义化 CSS 变量
  - 统一设计令牌，提供更好的一致性
- **🗑️ 移除废弃功能**:
  - 移除工具栏主题配置（`toolbarTheme`），简化配置选项
  - 清理不再使用的 `prettyprint` 相关样式

- **🛠️ 开发体验改进**:
  - 修复开发构建配置中的路径问题
  - 优化样式监听和热更新机制
  - 整理图标文件的 CSS 规则顺序

### 向后兼容性

本次重构保持了 API 的向后兼容性，现有用户代码无需修改即可正常工作。移除的 `toolbarTheme` 配置不会影响功能，主题切换仍然通过 `mainTheme` 配置进行。

### 影响范围

- 主题系统架构
- CSS 样式组织结构
- 开发构建流程
- 类型定义文件 [@Seeridia](https://github.com/Seeridia)([#1235](https://github.com/Tencent/cherry-markdown/pull/1235))([`e688271`](https://github.com/Tencent/cherry-markdown/commit/e688271ddcd9678dcf561407579ed3e1b4629421))
- fix: 修复快捷键栏中的内置快捷键的显示错误 #1305
  **在 Mac 上进行自定义快捷键的用户（仅缓存的快捷键配置，配置项传递的快捷键不受影响）更新后，旧的自定义快捷键将失效，需要点击“恢复默认配置”来恢复正确的快捷键。** [@Aurora-N](https://github.com/Aurora-N)([#1309](https://github.com/Tencent/cherry-markdown/pull/1309))([`7439d42`](https://github.com/Tencent/cherry-markdown/commit/7439d42827c324a51c03ff84f15c4b13e30436f8))

### Patch Changes

- fix: #1299 增加自定义代码块语言配置 `all` [@sunsonliu](https://github.com/sunsonliu)([#1301](https://github.com/Tencent/cherry-markdown/pull/1301))([`4848b82`](https://github.com/Tencent/cherry-markdown/commit/4848b82f0af5da07ff58fab7b4eb80fa82d2a9d0))
- chore: upgrade `eslint@8.x` and `prettier@3.x` [@RSS1102](https://github.com/RSS1102)([#1274](https://github.com/Tencent/cherry-markdown/pull/1274))([`489180c`](https://github.com/Tencent/cherry-markdown/commit/489180cbafa15cca368efc0a60450fd33b352bdd))
- feat: 优化搜索框在各主题下的样式 [@Aurora-N](https://github.com/Aurora-N)([#1263](https://github.com/Tencent/cherry-markdown/pull/1263))([`1fc0b64`](https://github.com/Tencent/cherry-markdown/commit/1fc0b649339795323a72617dc72c198a4d90f92d))
- style: 公式工具栏增强与优化：样式适配：优化公式工具栏在多主题下的样式表现，确保跨主题视觉一致性。
  chore: 模板扩充:丰富公式工具栏模板库，新增常用符号，三角函数及常用公式如几何三角示例。 [@Lingchen111](https://github.com/Lingchen111)([#1256](https://github.com/Tencent/cherry-markdown/pull/1256))([`f928c5e`](https://github.com/Tencent/cherry-markdown/commit/f928c5e2d848d4690f3e6f2912e74a4da35e89cf))
- fix: #1281 表格添加列时，列的对齐方式取左边列（如有）的对齐方式，否则取右侧列的对齐方式 [@sunsonliu](https://github.com/sunsonliu)([#1294](https://github.com/Tencent/cherry-markdown/pull/1294))([`2584eda`](https://github.com/Tencent/cherry-markdown/commit/2584eda7e4749654815774d7da113a594c7495e0))
- style: 优化手风琴样式 [@xx2run0711](https://github.com/xx2run0711)([#1270](https://github.com/Tencent/cherry-markdown/pull/1270))([`50924e5`](https://github.com/Tencent/cherry-markdown/commit/50924e5c2705608565ad3f2b974a6a51ea855b97))
- feat: 增强颜色选择器功能，改进界面 [@Seeridia](https://github.com/Seeridia)([#1258](https://github.com/Tencent/cherry-markdown/pull/1258))([`0416a3a`](https://github.com/Tencent/cherry-markdown/commit/0416a3a87798c83cb612c768148f0b6f46668a27))
- fix: 修复 `editOnly` 模式 `getToc` 为空数组的问题 [@YFAnt](https://github.com/YFAnt)([#1313](https://github.com/Tencent/cherry-markdown/pull/1313))([`3fb95d4`](https://github.com/Tencent/cherry-markdown/commit/3fb95d49790a3adb4eea35f1f9c9d14afd45ee8f))
- feat: 在「导出 docx」时，自动将 `mermaid` 和数学公式转换为图片并插入 [@Seeridia](https://github.com/Seeridia)([#1351](https://github.com/Tencent/cherry-markdown/pull/1351))([`240c2a8`](https://github.com/Tencent/cherry-markdown/commit/240c2a83815165be37ddba509199a7af9c5276b1))
- feat: 添加深海主题及相关样式支持 [@Seeridia](https://github.com/Seeridia)([#1336](https://github.com/Tencent/cherry-markdown/pull/1336))([`27eb2f7`](https://github.com/Tencent/cherry-markdown/commit/27eb2f7db18e51c5545c08cc4364fe2ad61bea14))
- feat: 添加导出 Word 文档的功能

feat: 在 `window.print()` 不可用时，关闭导出 PDF 的功能 [@Seeridia](https://github.com/Seeridia)([#1334](https://github.com/Tencent/cherry-markdown/pull/1334))([`f418126`](https://github.com/Tencent/cherry-markdown/commit/f4181265e2596cf253d5fb8268f962f350080d01))

- fix: 修复导出 `HTML` 和图片样式丢失的错误 [@Seeridia](https://github.com/Seeridia)([#1323](https://github.com/Tencent/cherry-markdown/pull/1323))([`fcd17a5`](https://github.com/Tencent/cherry-markdown/commit/fcd17a58286e1f9da21da4b252c4764856015615))
- fix: 编辑图片尺寸时禁用图片拖拽功能以避免误触
  fix: 为编辑器添加 `z-index` 以解决图片尺寸控制器的层级问题
  feat: 更新图片对齐方式提取逻辑，改进图片定位逻辑，确保图片尺寸控制框定位正确 [@Seeridia](https://github.com/Seeridia)([#1249](https://github.com/Tencent/cherry-markdown/pull/1249))([`556da12`](https://github.com/Tencent/cherry-markdown/commit/556da127e91492ca077b1169da7f5261fe50d36e))
- style: 优化粘贴处理逻辑以支持来自 Word 的内容 [@Seeridia](https://github.com/Seeridia)([#1251](https://github.com/Tencent/cherry-markdown/pull/1251))([`4df364a`](https://github.com/Tencent/cherry-markdown/commit/4df364a5ad0cff30841f8a52b25d7c886de80e43))
- fix: 修复建议列表的国际化配置问题 [@Seeridia](https://github.com/Seeridia)([#1272](https://github.com/Tencent/cherry-markdown/pull/1272))([`030960d`](https://github.com/Tencent/cherry-markdown/commit/030960dca8b07658f5bef01b217e8b20195f5c3a))
- fix: 修复工具栏的位置错误 [@Seeridia](https://github.com/Seeridia)([#1255](https://github.com/Tencent/cherry-markdown/pull/1255))([`50fd3be`](https://github.com/Tencent/cherry-markdown/commit/50fd3be213405414308f87fdd76821d36db59e0a))
- feat:增强图表交互功能并添加雷达图和地图图表支持 [@ceilf6](https://github.com/ceilf6)([#1325](https://github.com/Tencent/cherry-markdown/pull/1325))([`2f8dada`](https://github.com/Tencent/cherry-markdown/commit/2f8dada195789110f7560af0a70c0a1dcd27d64c))
- feat: engine.js add LRU [@YFAnt](https://github.com/YFAnt)([#1302](https://github.com/Tencent/cherry-markdown/pull/1302))([`c22731c`](https://github.com/Tencent/cherry-markdown/commit/c22731cf21a4805e356bbccd217f4b5ff5b28409))
- fix: 修正 `fileUploadMulti` 类型声明（从 `File` 改为 `File[]`） [@Lingchen111](https://github.com/Lingchen111)([#1237](https://github.com/Tencent/cherry-markdown/pull/1237))([`ba2c6df`](https://github.com/Tencent/cherry-markdown/commit/ba2c6df0715498b9e2a60a5ea067e0b988f77080))
- fix: #1280 修复选中标题选区被扩大的问题 [@sunsonliu](https://github.com/sunsonliu)([#1296](https://github.com/Tencent/cherry-markdown/pull/1296))([`f4cb828`](https://github.com/Tencent/cherry-markdown/commit/f4cb828dbf60506c36877e40bd9306b107aed7b3))
- style: 优化目录语法在各主题下的样式

主要变更如下：

- 为目录增加了一个容器，从而与正文清晰分离

- 在左侧新增了一条指示线，增强目录的整体感

- 增强了交互反馈：在链接区域悬停和点击时，指示线高亮，链接区域出现背景变化；在缩进空格区域悬停时，仅指示线高亮

- 为各个主题进行了配色精调

- 其他：使链接占据更多空间，提升交互的便利性；为一级标题适当加粗，便于用户快速把握文档主干结构；适当调整了内间距；提取大部分可定制元素为语义化变量 [@yang-summer](https://github.com/yang-summer)([#1308](https://github.com/Tencent/cherry-markdown/pull/1308))([`ccd7524`](https://github.com/Tencent/cherry-markdown/commit/ccd7524f1f549c62de86fc54a4d3142dd6e20ccb))
- feat: 为饼图和热力图添加交互式工具栏和高亮效果 [@ghost613bb](https://github.com/ghost613bb)([#1344](https://github.com/Tencent/cherry-markdown/pull/1344))([`19fc19b`](https://github.com/Tencent/cherry-markdown/commit/19fc19b9c8cf7095bb6542b901c2465a8ef6405e))
- fix: 移除目录中脚注标记的 HTML 标签 #1305 [@Seeridia](https://github.com/Seeridia)([#1306](https://github.com/Tencent/cherry-markdown/pull/1306))([`1273e5e`](https://github.com/Tencent/cherry-markdown/commit/1273e5ea8e8c3d819950f4e84c6929acb0e4b764))
- refactor: 对公式面板的界面的重构

feat: 公式面板增加“文本样式”页

fix: 修复公式菜单位置计算，防止超出右侧边界 [@Seeridia](https://github.com/Seeridia)([#1321](https://github.com/Tencent/cherry-markdown/pull/1321))([`5039a3e`](https://github.com/Tencent/cherry-markdown/commit/5039a3edc16d143d8dbb53fd63ae88d7b2bacec2))

- feat: #1337 丰富三个组件（个性 checklist，html 标签，简单表格） [@sunsonliu](https://github.com/sunsonliu)([#1338](https://github.com/Tencent/cherry-markdown/pull/1338))([`015295c`](https://github.com/Tencent/cherry-markdown/commit/015295cfa53ab81f40f0665a6fc65b42fdc5fc4b))
- style: 优化快捷键工具栏的交互和在各主题下的样式 [@Aurora-N](https://github.com/Aurora-N)([#1304](https://github.com/Tencent/cherry-markdown/pull/1304))([`bcb596b`](https://github.com/Tencent/cherry-markdown/commit/bcb596b056cfb8dddb9d5e826d2cd6a1b181973b))
- chore: 更新 `OpenAI` 依赖至 `@5.9.0`，并优化相关代码实现 [@RSS1102](https://github.com/RSS1102)([#1266](https://github.com/Tencent/cherry-markdown/pull/1266))([`85c9789`](https://github.com/Tencent/cherry-markdown/commit/85c9789b0ad4af0d0748c5e91199fc00384f7f36))
- fix: 简化样式设计，复用原有样式
  feat: 补充了各语言下的工具栏按键详情
  style: 优化图片工具栏在各个主题下样式
  fix: 定位工具栏时，使用相对 `preview` 的坐标，而不是绝对坐标 [@Jiadezhende](https://github.com/Jiadezhende)([#1286](https://github.com/Tencent/cherry-markdown/pull/1286))([`3cec9c5`](https://github.com/Tencent/cherry-markdown/commit/3cec9c51cd8ddc09a88b476687866bbed2138be0))
- feat: 更新快捷键配置面板的颜色变量，优化默认主题适配

fix: 工具栏按钮的高度统一

fix: 工具栏和气泡组件的按钮统一为正方形 [@Seeridia](https://github.com/Seeridia)([#1312](https://github.com/Tencent/cherry-markdown/pull/1312))([`7f629e8`](https://github.com/Tencent/cherry-markdown/commit/7f629e816d1086ef2be47b1f5aa4734e02a60897))

- fix: UI组件样式适配与优化 [@Seeridia](https://github.com/Seeridia)([#1269](https://github.com/Tencent/cherry-markdown/pull/1269))([`dc095ba`](https://github.com/Tencent/cherry-markdown/commit/dc095ba8930cffaf5993794fea61fcf43ad6d956))
- chore: update license to change Copyright [@sunsonliu](https://github.com/sunsonliu)([#1242](https://github.com/Tencent/cherry-markdown/pull/1242))([`348c4f4`](https://github.com/Tencent/cherry-markdown/commit/348c4f4138ff3d9fe784be693534f38ea99f3ea3))
- feat: #1316 增加自动引入 `katex` 的机制 [@sunsonliu](https://github.com/sunsonliu)([#1324](https://github.com/Tencent/cherry-markdown/pull/1324))([`0f8fa2e`](https://github.com/Tencent/cherry-markdown/commit/0f8fa2e590b1f4f5a5a6402e2dfd398a0384d379))
- feat: #1326 优化异步加载 `katex` 静态资源文件的逻辑 [@sunsonliu](https://github.com/sunsonliu)([#1329](https://github.com/Tencent/cherry-markdown/pull/1329))([`df6b5f0`](https://github.com/Tencent/cherry-markdown/commit/df6b5f097817bff4a0526e32e76a4c368b4899cd))

## 0.9.4

### Patch Changes

- feat: #1196 增加配置可以控制是否支持 panel 语法和对齐语法 [@sunsonliu](https://github.com/sunsonliu)([#1197](https://github.com/Tencent/cherry-markdown/pull/1197))([`ca907c3`](https://github.com/Tencent/cherry-markdown/commit/ca907c340d81a75b544a75088c10022d2fcda676))
- feat: 增加获取第一行非空文本内容的 api [@sunsonliu](https://github.com/sunsonliu)([#1212](https://github.com/Tencent/cherry-markdown/pull/1212))([`b1a2d66`](https://github.com/Tencent/cherry-markdown/commit/b1a2d6666a8f09ea0797a7a58a1ceeeb4898fcf0))
- chore: jest migrate to vitest [@liweijie0812](https://github.com/liweijie0812)([#1189](https://github.com/Tencent/cherry-markdown/pull/1189))([`e9295ac`](https://github.com/Tencent/cherry-markdown/commit/e9295ac8632c985039bb845266ddcfca164466fb))
- feat: #1208 对齐方式增加两端对齐 [@sunsonliu](https://github.com/sunsonliu)([#1210](https://github.com/Tencent/cherry-markdown/pull/1210))([`8fc4c9b`](https://github.com/Tencent/cherry-markdown/commit/8fc4c9ba8af08f7b0b3ed00bd2f49dee418f9975))
- feat: #1202 代码块自定义按钮回调函数增加第四个参数 [@sunsonliu](https://github.com/sunsonliu)([#1203](https://github.com/Tencent/cherry-markdown/pull/1203))([`81b25c5`](https://github.com/Tencent/cherry-markdown/commit/81b25c57d2cda103e31507773958b0a43f9468e8))
- feat: #1206 新增 html 标签属性白名单配置能力，新增自定义超链接属性配置能力 [@sunsonliu](https://github.com/sunsonliu)([#1207](https://github.com/Tencent/cherry-markdown/pull/1207))([`15bfa13`](https://github.com/Tencent/cherry-markdown/commit/15bfa133bc6c55e8feff2b1630bc680610aa2778))
- chore: 升级 dompurify 组件至 `@^3.2.6` [@sunsonliu](https://github.com/sunsonliu)([#1198](https://github.com/Tencent/cherry-markdown/pull/1198))([`9281ed7`](https://github.com/Tencent/cherry-markdown/commit/9281ed7e3269d0984034e683fe00b018a27fc2a0))

## 0.9.3

### Patch Changes

- fix:[Bug Report] html 转 markdown 时，html 中带有空 table，会有报错 close #1181 [@austwayliu](https://github.com/austwayliu)([#1181](https://github.com/Tencent/cherry-markdown/pull/1181))([`5921856`](https://github.com/Tencent/cherry-markdown/commit/5921856d7916637ed74e28c32ed9957f04de455c))
- fix: #1188 修复脚注弹窗报错问题 [@sunsonliu](https://github.com/sunsonliu)([#1191](https://github.com/Tencent/cherry-markdown/pull/1191))([`49b1db9`](https://github.com/Tencent/cherry-markdown/commit/49b1db90f53477d3a4c244ba18f047b68f177674))
- fix(快捷键): 更新快捷键映射以使用标准键名 [@RSS1102](https://github.com/RSS1102)([#1183](https://github.com/Tencent/cherry-markdown/pull/1183))([`0dbc2b1`](https://github.com/Tencent/cherry-markdown/commit/0dbc2b1099d9fee942cf9da4692b83701c674119))
- fix: 修复 node 环境下执行 engine.makeHtml()报错的问题 [@sunsonliu](https://github.com/sunsonliu)([#1179](https://github.com/Tencent/cherry-markdown/pull/1179))([`0404752`](https://github.com/Tencent/cherry-markdown/commit/0404752e2dbe5e078d0d3331ce3b44c7745a912d))
- fix: #1170 修复追加流式光标破坏超链接语法的问题 [@sunsonliu](https://github.com/sunsonliu)([#1172](https://github.com/Tencent/cherry-markdown/pull/1172))([`efcaa40`](https://github.com/Tencent/cherry-markdown/commit/efcaa40985a3f141d0faa66c39b4bab2e79cf96f))
- fix: 优化 cache 逻辑，避免内存爆炸 [@sunsonliu](https://github.com/sunsonliu)([#1169](https://github.com/Tencent/cherry-markdown/pull/1169))([`818bac2`](https://github.com/Tencent/cherry-markdown/commit/818bac2a60f14212f34019699fd02cf4d7e8dc56))
- fix: #1176 修复代码块按钮没有响应尺寸变化的问题 [@sunsonliu](https://github.com/sunsonliu)([#1192](https://github.com/Tencent/cherry-markdown/pull/1192))([`2f7ea63`](https://github.com/Tencent/cherry-markdown/commit/2f7ea63721b26719f1c108636eb1bc325b9913a4))

## 0.9.2

### Patch Changes

- fix: browser size changes picture control layer offset problem [@YFAnt](https://github.com/YFAnt)([#1072](https://github.com/Tencent/cherry-markdown/pull/1072))([`291ce59`](https://github.com/Tencent/cherry-markdown/commit/291ce59468f26031f41b2dc0725af61f6c4da2e6))
- fix: #1150 修复自动补全加粗被公式干扰的情况 [@sunsonliu](https://github.com/sunsonliu)([#1166](https://github.com/Tencent/cherry-markdown/pull/1166))([`1e5b450`](https://github.com/Tencent/cherry-markdown/commit/1e5b450921889448d562790716063546c2c617e3))
- fix: #1148 修复 afterInit 事件没有触发的问题 [@sunsonliu](https://github.com/sunsonliu)([#1165](https://github.com/Tencent/cherry-markdown/pull/1165))([`7cb7843`](https://github.com/Tencent/cherry-markdown/commit/7cb7843593166b44bf0759f82c74bdd70c5b7944))
- feat: #1080 扩展脚注的功能，增加 hover 数字角标出现 tips 的能力 [@sunsonliu](https://github.com/sunsonliu)([#1161](https://github.com/Tencent/cherry-markdown/pull/1161))([`d7cf684`](https://github.com/Tencent/cherry-markdown/commit/d7cf684ecffc4c779eb39bec2291caed509cf579))
- feat: 优化流式输出的效果 [@sunsonliu](https://github.com/sunsonliu)([#1164](https://github.com/Tencent/cherry-markdown/pull/1164))([`40a7cef`](https://github.com/Tencent/cherry-markdown/commit/40a7cefc678111c09e4dfbf494e0d0c488281f5c))
- fix: #1154 修复有序列表嵌套代码块时出现边框样式的问题 [@sunsonliu](https://github.com/sunsonliu)([#1156](https://github.com/Tencent/cherry-markdown/pull/1156))([`f5faca5`](https://github.com/Tencent/cherry-markdown/commit/f5faca58a30ed87a2b8f6980f6a2208e2bee342d))

## 0.9.1

### Patch Changes

- chore: modified products include files [@RSS1102](https://github.com/RSS1102)([#1143](https://github.com/Tencent/cherry-markdown/pull/1143))([`d23d141`](https://github.com/Tencent/cherry-markdown/commit/d23d14101114925ef7b2a5f341120ed41c53bc73))
- fix: 修复自定义语法在引用语法里无法正常渲染自定义标签的问题 [@sunsonliu](https://github.com/sunsonliu)([#1144](https://github.com/Tencent/cherry-markdown/pull/1144))([`0f39d6b`](https://github.com/Tencent/cherry-markdown/commit/0f39d6b00217c6f0181d99251f36e2dc9a93982b))
- fix: #1137 支持在公式里输入美元符号 [@sunsonliu](https://github.com/sunsonliu)([#1138](https://github.com/Tencent/cherry-markdown/pull/1138))([`63982bc`](https://github.com/Tencent/cherry-markdown/commit/63982bce5cb16871f1d7f9103648f1e99d8ab945))

## 0.9.0

### Minor Changes

- fix: custom menu asynchronous operation processing #722 [@YFAnt](https://github.com/YFAnt)([#1050](https://github.com/Tencent/cherry-markdown/pull/1050))([`63dfbd3`](https://github.com/Tencent/cherry-markdown/commit/63dfbd3c48d9f86b34a7fa52d934433df137dfe2))
- fix: 修复开启流式虚拟光标时，代码块被破坏的问题 #1093 [@sunsonliu](https://github.com/sunsonliu)([#1110](https://github.com/Tencent/cherry-markdown/pull/1110))([`67eb094`](https://github.com/Tencent/cherry-markdown/commit/67eb094a389d8620246db5c116bafc90299d4c9f))
- ci(core): add action for test build [@RSS1102](https://github.com/RSS1102)([#1054](https://github.com/Tencent/cherry-markdown/pull/1054))([`321c388`](https://github.com/Tencent/cherry-markdown/commit/321c388f0f52f096a2eb8b19238a214925744176))
- fix: 1109 增加禁用 html 的配置能力 [@sunsonliu](https://github.com/sunsonliu)([#1111](https://github.com/Tencent/cherry-markdown/pull/1111))([`eb3e4b4`](https://github.com/Tencent/cherry-markdown/commit/eb3e4b47811cc342d310bd62ee7f9089709b9b61))
- chore: add react demo [@RSS1102](https://github.com/RSS1102)([#1037](https://github.com/Tencent/cherry-markdown/pull/1037))([`b72fb02`](https://github.com/Tencent/cherry-markdown/commit/b72fb02a4c8fca988d142eedc11798353ce93e46))
- ci: cherry-markdown publish the dev package after merging PR [@RSS1102](https://github.com/RSS1102)([#1069](https://github.com/Tencent/cherry-markdown/pull/1069))([`b0fba64`](https://github.com/Tencent/cherry-markdown/commit/b0fba640a1453b7543149ea83bb7adeea6648e5a))
- feat: add changesets [@RSS1102](https://github.com/RSS1102)([#1036](https://github.com/Tencent/cherry-markdown/pull/1036))([`640a177`](https://github.com/Tencent/cherry-markdown/commit/640a17716fa69fa2ffdb8fe5f684c2db831072b0))
- feat: engine.makeHtml 增加第二个参数；预览逻辑避免自动加载图片资源 close #1129 close #1124 [@sunsonliu](https://github.com/sunsonliu)([#1130](https://github.com/Tencent/cherry-markdown/pull/1130))([`67778d1`](https://github.com/Tencent/cherry-markdown/commit/67778d1e8b9f5f65c0d99b46fe4f90208204a2ab))
- fix: 去掉告警信息 close #1095 [@sunsonliu](https://github.com/sunsonliu)([#1096](https://github.com/Tencent/cherry-markdown/pull/1096))([`4c460f1`](https://github.com/Tencent/cherry-markdown/commit/4c460f1e12e410ae322ee0f5cedbbee30f0660a6))
- feat: 支持有序列表英文字母 [@YFAnt](https://github.com/YFAnt)([#1046](https://github.com/Tencent/cherry-markdown/pull/1046))([`b2b2f55`](https://github.com/Tencent/cherry-markdown/commit/b2b2f555831328b368af37d9358ca0a7e0d37dd1))
- fix: 修复子菜单展开后没有跟随父菜单项移动 close #960 [@YFAnt](https://github.com/YFAnt)([#1045](https://github.com/Tencent/cherry-markdown/pull/1045))([`839da2d`](https://github.com/Tencent/cherry-markdown/commit/839da2dd32deb8b77e32bc69eb9bca1ba8620a9d))
- fix: 修复自动补全加粗功能和无序列表的冲突， 并且增加对\<和\>转义的支持 close #1099 close #1098 [@sunsonliu](https://github.com/sunsonliu)([#1103](https://github.com/Tencent/cherry-markdown/pull/1103))([`2a73e28`](https://github.com/Tencent/cherry-markdown/commit/2a73e281f2a76feac999a01411852ee97ca5934a))
- fix: 修复滚动到指定目录不准确问题 [@YFAnt](https://github.com/YFAnt)([#1043](https://github.com/Tencent/cherry-markdown/pull/1043))([`d26c814`](https://github.com/Tencent/cherry-markdown/commit/d26c814cfe9c4644140c5934f8f17eb79250cb81))
- fix: 修复行内公式和段落公式解析冲突的问题 close #1090 [@sunsonliu](https://github.com/sunsonliu)([#1092](https://github.com/Tencent/cherry-markdown/pull/1092))([`f069564`](https://github.com/Tencent/cherry-markdown/commit/f0695648508352226f4e7a40d39e0766989dfc10))
- chore: update `style` and `script` paths in example files [@RSS1102](https://github.com/RSS1102)([#1059](https://github.com/Tencent/cherry-markdown/pull/1059))([`e0f7ffe`](https://github.com/Tencent/cherry-markdown/commit/e0f7ffe4a720af580d9808280d27e533cf864a57))
- ci: 使用 `changeset` 进行发布流程自动化 [@RSS1102](https://github.com/RSS1102)([#1040](https://github.com/Tencent/cherry-markdown/pull/1040))([`a61dde9`](https://github.com/Tencent/cherry-markdown/commit/a61dde968649ea42622f9016e59a75fbccb5d816))

### Patch Changes

- ci: beautify release message [@RSS1102](https://github.com/RSS1102)([#1057](https://github.com/Tencent/cherry-markdown/pull/1057))([`f6bbd88`](https://github.com/Tencent/cherry-markdown/commit/f6bbd88a630be70f1a22a3d2e909ad591df290fc))

## 0.8.58

### Patch Changes

### Features

- [#947](https://github.com/Tencent/cherry-markdown/issues/947) urlProcessor 支持第三个参数，第三个参数为回调函数 ([05c6cab](https://github.com/Tencent/cherry-markdown/commit/05c6cab6383e3d56ccaedcfc1966528a088ece41))
- **client:** 导入 \*.md 文件时默认启用预览效果，导航栏显示控制 ([#1022](https://github.com/Tencent/cherry-markdown/issues/1022)) ([dfb16fe](https://github.com/Tencent/cherry-markdown/commit/dfb16fed0d2166adfcd27346ce8972173c9d2594))

### Bug Fixes

- [#1014](https://github.com/Tencent/cherry-markdown/issues/1014) 修复 engine.makeHtml 报错的问题 ([5a5e8f9](https://github.com/Tencent/cherry-markdown/commit/5a5e8f9fb7d14a0cfaa7dd1e1366598e3e6d51ae))
- 去掉 github 特殊语法高亮 ([fd13e45](https://github.com/Tencent/cherry-markdown/commit/fd13e45d22495c55d62f6835a3c5ba52e4220093))
- **type:** `insert` api's `normal-table-row*col` type constraints ([#1019](https://github.com/Tencent/cherry-markdown/issues/1019)) ([c7217f0](https://github.com/Tencent/cherry-markdown/commit/c7217f045c5c3a1b03a0764028c5030f7375e0b5))

### [0.8.57](https://github.com/Tencent/cherry-markdown/compare/v0.8.56...v0.8.57) (2024-12-23)

### Features

- [#1005](https://github.com/Tencent/cherry-markdown/issues/1005) 增加滚动到具体位置的 api，增加滚动行为控制的参数，修复预览区滚动没有触发编辑区滚动的 bug ([7b7f7ad](https://github.com/Tencent/cherry-markdown/commit/7b7f7ad970aa7bbe66fb2bfcc1e4312f3e7b5a18))
- [#1006](https://github.com/Tencent/cherry-markdown/issues/1006) 流式会话场景中，增加`flowSessionCursor`配置项，实现虚拟光标的效果 ([5e025bf](https://github.com/Tencent/cherry-markdown/commit/5e025bf048b720652ef96321c18ba67085ce1683))
- **vscodePlugin:** add i18n ([#1010](https://github.com/Tencent/cherry-markdown/issues/1010)) ([9c9265c](https://github.com/Tencent/cherry-markdown/commit/9c9265caaee98cd396e67215163c06a0b9b981a3))

### Bug Fixes

- [#1009](https://github.com/Tencent/cherry-markdown/issues/1009) 处理容器宽度发生变化时，编辑器光标出现错位的问题 ([ccae682](https://github.com/Tencent/cherry-markdown/commit/ccae6827eee15b8ba152e607779ed29819104c3e))
- [#1009](https://github.com/Tencent/cherry-markdown/issues/1009) 调整编辑器刷新时机，只有编辑器处于显示状态时才需要刷新 ([2b8696f](https://github.com/Tencent/cherry-markdown/commit/2b8696f0eb4f95ef9b343dc1ab833f479475c1ca))
- [#993](https://github.com/Tencent/cherry-markdown/issues/993) 修复识别 html 标签的正则逻辑 ([c58466e](https://github.com/Tencent/cherry-markdown/commit/c58466ee19994d7862571aada595412e812bd10f))
- 修复没有顶部右对齐工具栏时，顶部工具栏高度变高的问题 ([99f6bae](https://github.com/Tencent/cherry-markdown/commit/99f6bae05ed2c5933ac7312a81ad0aec6dbb0d83))

### Code Refactoring

- 废弃 elementsFromPoint 方法 ([2f732ea](https://github.com/Tencent/cherry-markdown/commit/2f732ea534cdeed5b42cc5365c08958feb1bb09e))

### [0.8.56](https://github.com/Tencent/cherry-markdown/compare/v0.8.55...v0.8.56) (2024-12-18)

### Features

- 优化单行大文本的判定逻辑 ([2b5d8fc](https://github.com/Tencent/cherry-markdown/commit/2b5d8fc88f75f0d62ab5988c47d297d45c5fa29b))

### Bug Fixes

- 处理图片 base64 和 base64 数据正则替换冲突的问题 ([dc3306e](https://github.com/Tencent/cherry-markdown/commit/dc3306e4a7a6a2ccdd5aecd61c11dc4ef31ad0d8))

### [0.8.53](https://github.com/Tencent/cherry-markdown/compare/v0.8.52...v0.8.53) (2024-12-16)

### Features

- [#992](https://github.com/Tencent/cherry-markdown/issues/992) 增加配置代码块自定义按钮的功能 ([a645e7f](https://github.com/Tencent/cherry-markdown/commit/a645e7f8bce686854c0946e94392aa83beae4ff7))
- [#999](https://github.com/Tencent/cherry-markdown/issues/999) 处理大文本缩略展示的逻辑，对单行超大文本作特殊缩略处理 ([#1000](https://github.com/Tencent/cherry-markdown/issues/1000)) ([fdbb48c](https://github.com/Tencent/cherry-markdown/commit/fdbb48c5030359e70e42e9cb22f1aa8beefef080))
- 顶部操作栏自适应换行 ([#991](https://github.com/Tencent/cherry-markdown/issues/991)) ([57fb28d](https://github.com/Tencent/cherry-markdown/commit/57fb28d63858a71664cdd9b89db306ea2256c13e))

### Bug Fixes

- [#985](https://github.com/Tencent/cherry-markdown/issues/985) 修复快捷键配置弹窗定位问题 ([37e15c6](https://github.com/Tencent/cherry-markdown/commit/37e15c6834563e7825376f8dcc468224a9521ae1))
- [#989](https://github.com/Tencent/cherry-markdown/issues/989) 修复点击 img 获取不到 data-formula-code 属性的问题 ([75718fc](https://github.com/Tencent/cherry-markdown/commit/75718fc26e795fafb7fa5b85af255a017e71cae5))
- **example:** remove duplicate configurations ([#983](https://github.com/Tencent/cherry-markdown/issues/983)) ([e509c9f](https://github.com/Tencent/cherry-markdown/commit/e509c9f70663cd62284e75dcab182c15470ac80e))

### Code Refactoring

- [#995](https://github.com/Tencent/cherry-markdown/issues/995) 封装新的哈希算法，从 md5 改成 sha256 ([#998](https://github.com/Tencent/cherry-markdown/issues/998)) ([d9275e6](https://github.com/Tencent/cherry-markdown/commit/d9275e63acb49687b9e00a0791c35dd64293bb5c))

### [0.8.52](https://github.com/Tencent/cherry-markdown/compare/v0.8.51...v0.8.52) (2024-11-25)

### Features

- [#897](https://github.com/Tencent/cherry-markdown/issues/897) 增加切换 toc 悬浮目录状态的 api ([b69bf1f](https://github.com/Tencent/cherry-markdown/commit/b69bf1f0c7bd2d7ab0efaf0a9ba50081366408ba))
- [#947](https://github.com/Tencent/cherry-markdown/issues/947) 对 html block 增加 urlProcessor 回调 ([8488d1d](https://github.com/Tencent/cherry-markdown/commit/8488d1ddca02da3dd49c7df4aac360c24089bede))

### Bug Fixes

- 修复可能的报错 ([ab2eb4a](https://github.com/Tencent/cherry-markdown/commit/ab2eb4acb8831401fa10a9ad7ffbd07fa59bcc2d))
- 修复 preview hover 时报错的问题 ([#980](https://github.com/Tencent/cherry-markdown/issues/980)) ([e71e585](https://github.com/Tencent/cherry-markdown/commit/e71e58561cfdf5cd016105ebfaab69142302a218))

### [0.8.51](https://github.com/Tencent/cherry-markdown/compare/v0.8.50...v0.8.51) (2024-11-18)

### Features

- [#967](https://github.com/Tencent/cherry-markdown/issues/967) 增加代码块是否自动换行配置 fix: [#978](https://github.com/Tencent/cherry-markdown/issues/978) 尝试修复 editor.keepDocumentScrollAfterInit=true 失效的问题 ([2e54a7e](https://github.com/Tencent/cherry-markdown/commit/2e54a7eee07dd49dd6c54eca8f708d0afd95054f))
- 增加禁用所有快捷键的功能；增加搜索的按钮 ([60748e9](https://github.com/Tencent/cherry-markdown/commit/60748e924b567d4a4c1acc5260217618e6783a73))
- **vscodePlugin:** support `theme` selected state ([#965](https://github.com/Tencent/cherry-markdown/issues/965)) ([468592a](https://github.com/Tencent/cherry-markdown/commit/468592a2cee173ca2aec321c567ca9bbd4b092d7))

### Bug Fixes

- [#963](https://github.com/Tencent/cherry-markdown/issues/963) 避免代码块的辅助工具阻塞鼠标事件 ([e2e0e85](https://github.com/Tencent/cherry-markdown/commit/e2e0e85bfe878f4307ba2b7bb79404f9eea12d56))
- [#978](https://github.com/Tencent/cherry-markdown/issues/978) 尝试修复 editor.keepDocumentScrollAfterInit=true 失效的问题 ([fded636](https://github.com/Tencent/cherry-markdown/commit/fded636233c2d58daef53ab905cd7b38021ee2c1))
- 修复纯预览模式性能问题 ([ebcfe61](https://github.com/Tencent/cherry-markdown/commit/ebcfe61954aabb17d896207b6a5d0858cd5ea621))
- 修复点击代码块编辑按钮时页面报错的问题 ([6ea15c3](https://github.com/Tencent/cherry-markdown/commit/6ea15c31600853448269cca8884079890b0bdc1a))
- 修复短链接配置失效的问题 ([79c34ca](https://github.com/Tencent/cherry-markdown/commit/79c34caa8aa4c38be8e9239103f720832fb47af2))
- **vscodePlugin:** prevent the default redirect behavior of links in vscode webview ([#973](https://github.com/Tencent/cherry-markdown/issues/973)) ([8f9a319](https://github.com/Tencent/cherry-markdown/commit/8f9a319d427da319e5c2d7d61517161c2f1d20d2))
- **vscodePlugin:** relative path img ([#972](https://github.com/Tencent/cherry-markdown/issues/972)) ([67c5ae5](https://github.com/Tencent/cherry-markdown/commit/67c5ae55c99d686de111ac0480b2c02de799af4e))

### Code Refactoring

- **client:** migrate to tauri implementation ([#969](https://github.com/Tencent/cherry-markdown/issues/969)) ([f30e8a6](https://github.com/Tencent/cherry-markdown/commit/f30e8a6b29171a1429c748a7362a0d02636442cd))

### [0.8.50](https://github.com/Tencent/cherry-markdown/compare/v0.8.49...v0.8.50) (2024-10-31)

### Features

- [#931](https://github.com/Tencent/cherry-markdown/issues/931) onPaste 入参增加 cherry 实例 ([91778f3](https://github.com/Tencent/cherry-markdown/commit/91778f3152c18d2aa1218f2491a4d7218db59a41))
- [#954](https://github.com/Tencent/cherry-markdown/issues/954) [#940](https://github.com/Tencent/cherry-markdown/issues/940) 增加 frontMatter 语法，并在 frontMatter 语法里支持了设置全局字体大小的能力 ([2e30a1f](https://github.com/Tencent/cherry-markdown/commit/2e30a1f2122f5e49825718494afc2a108e8c85b6))
- [#954](https://github.com/Tencent/cherry-markdown/issues/954) 优化字号匹配逻辑 ([daf4f68](https://github.com/Tencent/cherry-markdown/commit/daf4f68a5ab2b9b252681f1a10f8c9c182654e3e))
- 增加控制右侧悬浮目录显隐的 api ([45b7a98](https://github.com/Tencent/cherry-markdown/commit/45b7a9844695034e9b61de46fc0f6f9ca1896b13))
- theme item highlight ([#959](https://github.com/Tencent/cherry-markdown/issues/959)) ([fdf9fc4](https://github.com/Tencent/cherry-markdown/commit/fdf9fc470e243665ae9911f471ec2607099d3c4d))
- **vscodePlugin:** add right click menu shortcut key ` F10` ([#934](https://github.com/Tencent/cherry-markdown/issues/934)) ([a37d521](https://github.com/Tencent/cherry-markdown/commit/a37d5215cddf75f756c3a68256fe75ab007a9248))
- **vscodePlugin:** open web link and open file link ([#922](https://github.com/Tencent/cherry-markdown/issues/922)) ([796b087](https://github.com/Tencent/cherry-markdown/commit/796b087131280f1a8962f5c99fde008809feefc0))

### Bug Fixes

- [#876](https://github.com/Tencent/cherry-markdown/issues/876) toolbar 设置中的预览按钮支持窗口浮动 ([#938](https://github.com/Tencent/cherry-markdown/issues/938)) ([03a3ed7](https://github.com/Tencent/cherry-markdown/commit/03a3ed7ed17037d5420f0c6d9ea97dbcbfb99cb8))
- [#927](https://github.com/Tencent/cherry-markdown/issues/927) 对 style 的过滤没有兼容单引号的情况 ([25d3b0c](https://github.com/Tencent/cherry-markdown/commit/25d3b0c3c4935d93e989ff7b564e623a027af7cb))
- [#948](https://github.com/Tencent/cherry-markdown/issues/948) 下拉菜单点击穿透到预览视窗拉条 ([#949](https://github.com/Tencent/cherry-markdown/issues/949)) ([d104f16](https://github.com/Tencent/cherry-markdown/commit/d104f16d11893d13f025bb99bc564004ae379f37))
- [#953](https://github.com/Tencent/cherry-markdown/issues/953) 统一颜色按钮的交互 ([66a898c](https://github.com/Tencent/cherry-markdown/commit/66a898cf66a41c417617528a5de2f1ed5ca5ff29))
- **type:** add key name declaration for custom toolbar ([#932](https://github.com/Tencent/cherry-markdown/issues/932)) ([ef7a946](https://github.com/Tencent/cherry-markdown/commit/ef7a946fd70058fcd4007d6b96b79f71af340970))
- **vscode-plugin:** vscode dark mode and it's default theme，black scrollbar appears ([#946](https://github.com/Tencent/cherry-markdown/issues/946)) ([fbec3d9](https://github.com/Tencent/cherry-markdown/commit/fbec3d90f2a6a9c084c255a26ed5a2301f405767))

### Css or Code Change

- 编辑区增加对 yaml 语法的高亮展示 ([08c220d](https://github.com/Tencent/cherry-markdown/commit/08c220d6a75cbccdd88fb3df9e8f39b98179cd36))
- Refine 'blue' theme ([#829](https://github.com/Tencent/cherry-markdown/issues/829)) ([ca74e55](https://github.com/Tencent/cherry-markdown/commit/ca74e55cb7bb305fbe77640b4608e33455af569c))

### [0.8.49](https://github.com/Tencent/cherry-markdown/compare/v0.8.48...v0.8.49) (2024-09-27)

### Features

- [#927](https://github.com/Tencent/cherry-markdown/issues/927) 增加对 html 标签里 style 属性过滤的配置 ([858f862](https://github.com/Tencent/cherry-markdown/commit/858f86285da2c92a54cc05668629f1b14c691a61))
- 表格增加删除列操作 ([#843](https://github.com/Tencent/cherry-markdown/issues/843)) ([d8ed2ec](https://github.com/Tencent/cherry-markdown/commit/d8ed2ecb561c73b586799b022808a34d71ad0acc))
- 优化快捷键工具栏，增加不可修改的快捷键信息 ([93de3b1](https://github.com/Tencent/cherry-markdown/commit/93de3b136e7b1e518768cbce5d5e2975dd0369ca))

### Bug Fixes

- [#923](https://github.com/Tencent/cherry-markdown/issues/923) 支持多个括号 ([a3da98b](https://github.com/Tencent/cherry-markdown/commit/a3da98b994b72dc375f6040884f1bca876d766f0))
- [#925](https://github.com/Tencent/cherry-markdown/issues/925) 默认关掉 codemirror 对 github 特殊链接格式的支持 ([22d691b](https://github.com/Tencent/cherry-markdown/commit/22d691ba04af77e69770740098aadf0642535377))
- 增加 ci 脚本的鲁棒性 ([a9611d9](https://github.com/Tencent/cherry-markdown/commit/a9611d9ef5d3b62d740045bd256ac546e4227802))
- github-bot message npm version ([#918](https://github.com/Tencent/cherry-markdown/issues/918)) ([88e1a48](https://github.com/Tencent/cherry-markdown/commit/88e1a489a40882d4415f4e4c2e87021575d28b3a))
- rename npm-dev-test package ([#917](https://github.com/Tencent/cherry-markdown/issues/917)) ([40f7d6b](https://github.com/Tencent/cherry-markdown/commit/40f7d6b708e534a77441f86dbfa8374956ec4911))

### Code Refactoring

- 优化表格所见即所得编辑里，拖拽行列、删除行列的交互和功能 ([77bf4db](https://github.com/Tencent/cherry-markdown/commit/77bf4db26dbc6f05bacef9cda66afffbfa702216))

### Css or Code Change

- 优化配色 ([ed4d8f4](https://github.com/Tencent/cherry-markdown/commit/ed4d8f4cd90bd7005e88e1721fd43a55fdb602be))

### [0.8.48](https://github.com/Tencent/cherry-markdown/compare/v0.8.47...v0.8.48) (2024-09-23)

### Features

- [#900](https://github.com/Tencent/cherry-markdown/issues/900) “引用“语法支持嵌套，并支持嵌套其他语法（如表格、代码块、列表、信息面板等） ([d7a887d](https://github.com/Tencent/cherry-markdown/commit/d7a887dc8d8a4f70214d984b4fafea1fd6c88b44))
- [#900](https://github.com/Tencent/cherry-markdown/issues/900) “引用“语法支持嵌套，并支持嵌套其他语法（如表格、代码块、列表、信息面板等）fix lint ([9366d1e](https://github.com/Tencent/cherry-markdown/commit/9366d1eecb2107e93eb42eb38fab18407f3817ad))
- 支持设置编辑器的值 ([bcb1b23](https://github.com/Tencent/cherry-markdown/commit/bcb1b232bcfae5e06a651d1ce7e34f670b1a334c))

### Bug Fixes

- [#879](https://github.com/Tencent/cherry-markdown/issues/879) 修复脚注在滚动条在 html 时无法滚动的问题 ([ad1362a](https://github.com/Tencent/cherry-markdown/commit/ad1362ac8ab164182e3f849f75b1d6a7f39d586f))
- [#898](https://github.com/Tencent/cherry-markdown/issues/898) 修复配置代码块主题失效的问题 ([90f3c1d](https://github.com/Tencent/cherry-markdown/commit/90f3c1db578cc8cfa4305cb5e2537a7fc2033e81))
- [#898](https://github.com/Tencent/cherry-markdown/issues/898) 修复配置主题失效的问题 ([191206b](https://github.com/Tencent/cherry-markdown/commit/191206b965a4d6b1ebd6ac5867569aa786b24460))
- [#898](https://github.com/Tencent/cherry-markdown/issues/898) 修复配置主题失效的问题 ([afa5a7f](https://github.com/Tencent/cherry-markdown/commit/afa5a7f4bf9d5bc0dd420843673eba8f5a54dfe7))
- [#903](https://github.com/Tencent/cherry-markdown/issues/903) 修复联想功能引入的性能问题 ([fbf1f0c](https://github.com/Tencent/cherry-markdown/commit/fbf1f0cbf67f7a6ce41493428f928acd200a5271))
- [#910](https://github.com/Tencent/cherry-markdown/issues/910) 图片和超链接支持一对括号（时间有限，先只支持一对括号，再多的后续再考虑实现） ([e609e95](https://github.com/Tencent/cherry-markdown/commit/e609e95ef776ae831af629c9ffa479e6d7cdd88e))
- [#910](https://github.com/Tencent/cherry-markdown/issues/910) 图片和超链接支持一对括号（时间有限，先只支持一对括号，再多的后续再考虑实现） ([688b7eb](https://github.com/Tencent/cherry-markdown/commit/688b7ebe888730933bbb69824f5bb59cc95c520f))
- [#913](https://github.com/Tencent/cherry-markdown/issues/913) 文章目录支持国际化 ([#915](https://github.com/Tencent/cherry-markdown/issues/915)) ([52f01c9](https://github.com/Tencent/cherry-markdown/commit/52f01c90681bd79d443d843dbc6a7c0c9361ab03))
- 对于配置 config 类型的修复 ([#890](https://github.com/Tencent/cherry-markdown/issues/890)) ([588f862](https://github.com/Tencent/cherry-markdown/commit/588f862a83e78193047f5c8690fe909d36051bc3))
- 修复为支持引用嵌套导致页面报错的问题 ([e930143](https://github.com/Tencent/cherry-markdown/commit/e930143a12b95e98d303e1f0b4c1c8c8a5f50cc3))

### [0.8.47](https://github.com/Tencent/cherry-markdown/compare/v0.8.46...v0.8.47) (2024-09-03)

### Features

- [#874](https://github.com/Tencent/cherry-markdown/issues/874) 优化主题、代码块主题的相关逻辑，便于做持久化，优先级：本地缓存>配置>默认配置 ([993d986](https://github.com/Tencent/cherry-markdown/commit/993d986928a9532670892647d27cfbc47e5e4e1d))
- [#876](https://github.com/Tencent/cherry-markdown/issues/876) 窗口浮动 ([#884](https://github.com/Tencent/cherry-markdown/issues/884)) ([1a16235](https://github.com/Tencent/cherry-markdown/commit/1a162353c3638d6651527d4b17f49efb50895a30))
- 浮动预览窗口优化 ([1199562](https://github.com/Tencent/cherry-markdown/commit/11995625f617e0f5d6f1f8df1c5715e656625e19))
- **client:** add shortcut keys ([#878](https://github.com/Tencent/cherry-markdown/issues/878)) ([4e4cc3c](https://github.com/Tencent/cherry-markdown/commit/4e4cc3c10e39e7f72e54cf524dd2ac3c0b0b7d6e))

### Bug Fixes

- [#871](https://github.com/Tencent/cherry-markdown/issues/871) 重做了下快捷键配置机制 ([999a6cc](https://github.com/Tencent/cherry-markdown/commit/999a6ccf9d615a948d43453d61502bb0c78a9e5c))
- [#879](https://github.com/Tencent/cherry-markdown/issues/879) 脚注跳转支持不更新 location hash ([0cfe8b2](https://github.com/Tencent/cherry-markdown/commit/0cfe8b260a7c3acb5d4faa96712904c0577f0334))
- 注释掉 config 里的无用配置 ([30c6fd7](https://github.com/Tencent/cherry-markdown/commit/30c6fd75dd1475d06f47887fcbf788355dd6fb57))
- **client:** due to the proxy of the editor instance, data cannot be edit ([#877](https://github.com/Tencent/cherry-markdown/issues/877)) ([82a1974](https://github.com/Tencent/cherry-markdown/commit/82a19744504b173402f296b606289ac99f49b44d))
- Ensure target directories exist ([486eaef](https://github.com/Tencent/cherry-markdown/commit/486eaefff973d473e4baa219ae141542346e0f74))
- **type:** type error in config ([#839](https://github.com/Tencent/cherry-markdown/issues/839)) ([10a226c](https://github.com/Tencent/cherry-markdown/commit/10a226cb92aa9e56604a400f19eb61aa60273a5a))

### [0.8.46](https://github.com/Tencent/cherry-markdown/compare/v0.8.45...v0.8.46) (2024-08-12)

### Features

- [#813](https://github.com/Tencent/cherry-markdown/issues/813) 增加对 drawioIframe 样式的配置 ([91e943a](https://github.com/Tencent/cherry-markdown/commit/91e943ab23795ed9f92cda89dcc362c1c4c68136))
- [#815](https://github.com/Tencent/cherry-markdown/issues/815) 多文件上传 ([#863](https://github.com/Tencent/cherry-markdown/issues/863)) ([bca1789](https://github.com/Tencent/cherry-markdown/commit/bca1789310473319336046c96c30edef5555ecaa))
- [#822](https://github.com/Tencent/cherry-markdown/issues/822) 增加代码块主题 ([9ae7cb2](https://github.com/Tencent/cherry-markdown/commit/9ae7cb2539bb2ceafd6692f05fc9cdaf4e563be9))
- 预览区代码块支持展开收起功能和对应的配置 ([#793](https://github.com/Tencent/cherry-markdown/issues/793)) ([cf68be2](https://github.com/Tencent/cherry-markdown/commit/cf68be2b57926142a59f004714dca355742503d3))
- pr-merge action execute limit repository ([aa3ca4d](https://github.com/Tencent/cherry-markdown/commit/aa3ca4dcda2ba7cd348e7e63b5a1cb4ab979df1e))

### Bug Fixes

- [#858](https://github.com/Tencent/cherry-markdown/issues/858) 修复漏洞 ([122e27a](https://github.com/Tencent/cherry-markdown/commit/122e27a34c546c4e6f25826b955d0c907db547eb))
- [#866](https://github.com/Tencent/cherry-markdown/issues/866) 修复 draw.io 在预览区无脑打开编辑框的问题 ([1c907da](https://github.com/Tencent/cherry-markdown/commit/1c907dad6eb1438e0bde5f6bfe3ae648958ee206))
- 修复代码块展开收起引入的 bug，并优化展开收起的交互体验 ([4a3c195](https://github.com/Tencent/cherry-markdown/commit/4a3c19574f8ffa6ed739c22d0ba8a0c77b455e0b))

### Css or Code Change

- 暗黑主题优化 ([#837](https://github.com/Tencent/cherry-markdown/issues/837)) ([9425441](https://github.com/Tencent/cherry-markdown/commit/9425441b29264728d942cefeaa96372c2f5118a0))
- 修改图标产生的冲突 ([1ef9e47](https://github.com/Tencent/cherry-markdown/commit/1ef9e47ede0267b4a3fa03e99174f5282d94f346))
- 优化暗黑模式下的细节 ([5bc8d6a](https://github.com/Tencent/cherry-markdown/commit/5bc8d6a338f48c3b2a51e420802d2193f8a9d08f))
- 优化暗黑模式下的细节 ([b294536](https://github.com/Tencent/cherry-markdown/commit/b294536f07965d3a628262215af635c1afd8eda9))

### [0.8.45](https://github.com/Tencent/cherry-markdown/compare/v0.8.44...v0.8.45) (2024-07-25)

### Features

- [#522](https://github.com/Tencent/cherry-markdown/issues/522) 增加 vim 编辑模式的配置 ([40ba66f](https://github.com/Tencent/cherry-markdown/commit/40ba66fd3cda87542bc916b9252863a38eb18cd9))
- [#755](https://github.com/Tencent/cherry-markdown/issues/755) 增加隐藏工具栏机制 ([71b8c03](https://github.com/Tencent/cherry-markdown/commit/71b8c031d94220d1d1ac9f3d5786928448b0bfc0))
- [#794](https://github.com/Tencent/cherry-markdown/issues/794) 脚本支持 pr 预览 ([c1bed21](https://github.com/Tencent/cherry-markdown/commit/c1bed21cec99000f9a71f78f557500cafde6a7e3))
- [#794](https://github.com/Tencent/cherry-markdown/issues/794) 脚本支持 pr 预览 ([#816](https://github.com/Tencent/cherry-markdown/issues/816)) ([d26a3be](https://github.com/Tencent/cherry-markdown/commit/d26a3bec891ed93115210d94f71cdbfa38c2c884))
- [#814](https://github.com/Tencent/cherry-markdown/issues/814) 丰富联想代码语言 ([a249820](https://github.com/Tencent/cherry-markdown/commit/a2498203be566aff2e24663424f34eb1b73f43a3))
- [#823](https://github.com/Tencent/cherry-markdown/issues/823) 丰富 api 文档，增加字体颜色、字体背景色、信息面板、对齐方式等 api ([ba0f71e](https://github.com/Tencent/cherry-markdown/commit/ba0f71e8b880b161454677408c9360a5c7c41fa9))
- [#836](https://github.com/Tencent/cherry-markdown/issues/836) PR 合并后自动清除 PR 在线预览相关资源 ([0da9aba](https://github.com/Tencent/cherry-markdown/commit/0da9aba0bbb783c23b09343a224a18b806a2fbb0))
- [#838](https://github.com/Tencent/cherry-markdown/issues/838) 代码块语法忽略大小写 ([c82ab40](https://github.com/Tencent/cherry-markdown/commit/c82ab407207e753171745ec4805052bfc0a64081))
- [#847](https://github.com/Tencent/cherry-markdown/issues/847) 插入菜单添加“内联代码”按钮 ([#849](https://github.com/Tencent/cherry-markdown/issues/849)) ([3476f21](https://github.com/Tencent/cherry-markdown/commit/3476f213fcaa8394b1db43b963c8c7ebb397227e))
- 调整 pr-viewer 脚本 ([adc310b](https://github.com/Tencent/cherry-markdown/commit/adc310be0926912122be6405da258077ff69e28d))
- 设置 actions 权限，支持 pr 构建 ([f728487](https://github.com/Tencent/cherry-markdown/commit/f72848760d50142bac1defe46831cd1de15c360a))
- 优化有大量 base64 数据时的渲染性能 ([a03c999](https://github.com/Tencent/cherry-markdown/commit/a03c999e98f2295d607f92fc109f72337634ca43))
- add react demo for cherry-markdown [#797](https://github.com/Tencent/cherry-markdown/issues/797) ([28c0e81](https://github.com/Tencent/cherry-markdown/commit/28c0e816fe0945cf165e4a2e01a54096715cca42))
- pr-test 脚本 eslint 只检查 js 文件 ([8faef0a](https://github.com/Tencent/cherry-markdown/commit/8faef0ac679584706b59af88bbe8965b4ddd7d27))
- **ShortcutKey:** 增加快捷键配置能力 Closes [#571](https://github.com/Tencent/cherry-markdown/issues/571) ([837bf15](https://github.com/Tencent/cherry-markdown/commit/837bf153f68e3c13c8a183ea71d2f5daf2d96a5c))

### Bug Fixes

- [#835](https://github.com/Tencent/cherry-markdown/issues/835) 处理 eslint 报错 ([0cd79ca](https://github.com/Tencent/cherry-markdown/commit/0cd79ca80916cd93cdba0a8372995b9dcd727a4c))
- [#835](https://github.com/Tencent/cherry-markdown/issues/835) 代码提示自动补全国际化问题 ([d94b357](https://github.com/Tencent/cherry-markdown/commit/d94b357b2338fbf641e6b3ceb48edb3c8a02e9eb))
- 修复字数统计工具报错的问题 ([e61ec5f](https://github.com/Tencent/cherry-markdown/commit/e61ec5f17ea4b789019f8bcb79ed6a040bc950dd))
- 修复 menu.setName 失效的问题 ([d398c6a](https://github.com/Tencent/cherry-markdown/commit/d398c6a4f4c98a9c4e1616eb8e1633ef2957deea))
- github actions build 排除掉 push ([9214bd4](https://github.com/Tencent/cherry-markdown/commit/9214bd47caf8abbd4cc5155d7cc72a2ae8adc781))

### [0.8.44](https://github.com/Tencent/cherry-markdown/compare/v0.8.43...v0.8.44) (2024-06-25)

### Bug Fixes

- [#808](https://github.com/Tencent/cherry-markdown/issues/808) ([d63a4a0](https://github.com/Tencent/cherry-markdown/commit/d63a4a0228b19a759eee4870d821310c375ead3c))

### [0.8.43](https://github.com/Tencent/cherry-markdown/compare/v0.8.42...v0.8.43) (2024-06-24)

### Features

- [#696](https://github.com/Tencent/cherry-markdown/issues/696) 构建产物里额外提供预览区样式的文件 ([#783](https://github.com/Tencent/cherry-markdown/issues/783)) ([e33c0d6](https://github.com/Tencent/cherry-markdown/commit/e33c0d68bf5a5d2324d6a118a32f7372d5052d1f))
- [#767](https://github.com/Tencent/cherry-markdown/issues/767) 代码块、行内代码相关提示交互优化 ([#787](https://github.com/Tencent/cherry-markdown/issues/787)) ([4e05ac6](https://github.com/Tencent/cherry-markdown/commit/4e05ac696323c6dc6bd8d1961ab3adcbb44e7d92))
- [#769](https://github.com/Tencent/cherry-markdown/issues/769) 代码块主题缓存 ([#781](https://github.com/Tencent/cherry-markdown/issues/781)) ([912c25e](https://github.com/Tencent/cherry-markdown/commit/912c25e268a57bfd0c15f82de2c8b992db945ef7))
- [#774](https://github.com/Tencent/cherry-markdown/issues/774) 增加选区改变事件 selectionChange ([1859e20](https://github.com/Tencent/cherry-markdown/commit/1859e2080f908ee19f0aeb057631807ded5feded))
- [#790](https://github.com/Tencent/cherry-markdown/issues/790) 锚点/toc 滚动兼容滚动条在 window 的情况 ([42be1bc](https://github.com/Tencent/cherry-markdown/commit/42be1bc8b2ee066acc5281f2907be4ab207dd26f))
- 独立一个 markdown 样式文件（含主题） ([467d870](https://github.com/Tencent/cherry-markdown/commit/467d87043ace777f05afd04958a982a358376a0f))
- 优化高亮区的显示逻辑，改成每次高亮只亮 3 秒，不再常驻高亮 ([6365f27](https://github.com/Tencent/cherry-markdown/commit/6365f27453949ab08db8fa7a55f8b406502bf6c4))
- 增加表格和加粗斜体语法对流式输出场景的适配 ([b1a07a7](https://github.com/Tencent/cherry-markdown/commit/b1a07a7f782c363d29d11681331a49bf5e318264))
- 增加流式会话的例子 ([0de1a93](https://github.com/Tencent/cherry-markdown/commit/0de1a9372dee6c336208a20cfda8c0900c1776f0))
- 增加一些小 api ([e7bc008](https://github.com/Tencent/cherry-markdown/commit/e7bc0085f15a2b5c5255f0781240646a073bbbc0))

### Bug Fixes

- [#778](https://github.com/Tencent/cherry-markdown/issues/778) 修复国际化漏掉的地方 ([5bb2b26](https://github.com/Tencent/cherry-markdown/commit/5bb2b265193f5c0fe3a9f969a3d16f8c8ad13e94))
- [#782](https://github.com/Tencent/cherry-markdown/issues/782) 补上英文 ([d5e4d47](https://github.com/Tencent/cherry-markdown/commit/d5e4d470129a02ea580488959aae12b75f63808c))
- 修复 afterInit 失效的问题 ([8c03f95](https://github.com/Tencent/cherry-markdown/commit/8c03f959a93312ab8dcc0ae27b298d9a7f557bf3))
- 修复 vscode 插件自动打开预览的问题 ([036f070](https://github.com/Tencent/cherry-markdown/commit/036f070b3d0a724075366dbd3b1fe4f92d6154f7))
- 右侧编辑列表过程中, 输入回车后, 再次编辑此列表, 数据会异常 [#751](https://github.com/Tencent/cherry-markdown/issues/751) ([#772](https://github.com/Tencent/cherry-markdown/issues/772)) ([38ee8dc](https://github.com/Tencent/cherry-markdown/commit/38ee8dc21acece973946e5955dcf3b2c941d7401))
- 自定义 icon 兼容自定义菜单 & 完善 propTypes 校验 ([#791](https://github.com/Tencent/cherry-markdown/issues/791)) ([335b9bd](https://github.com/Tencent/cherry-markdown/commit/335b9bd6434d376ff0615695efdf39bd35df13f6)), closes [#589](https://github.com/Tencent/cherry-markdown/issues/589)
- **vscodePlugin:** activation timing for VSCode extension ([#773](https://github.com/Tencent/cherry-markdown/issues/773)) ([15e019f](https://github.com/Tencent/cherry-markdown/commit/15e019f0d2d210535207b4c372e5ebebb4a779e5))
- **vscodePlugin:** first open markdown will not activate the extension ([#784](https://github.com/Tencent/cherry-markdown/issues/784)) ([a1c24d2](https://github.com/Tencent/cherry-markdown/commit/a1c24d228f5d6510355f0264309f3251f8bd75f2))

### [0.8.42](https://github.com/Tencent/cherry-markdown/compare/v0.8.41...v0.8.42) (2024-05-27)

### Features

- 默认不展示右侧侧边栏 ([b68b1b4](https://github.com/Tencent/cherry-markdown/commit/b68b1b45946120a3ac6321748bc22a4fc52b995a))
- 优化事件机制，增加 cherry.on 动态绑定事件机制 ([a24bcd9](https://github.com/Tencent/cherry-markdown/commit/a24bcd9fe95a84b79b83b013e371cc325962f491))
- 增加表格和加粗斜体语法对流式输出场景的适配 ([ebc8338](https://github.com/Tencent/cherry-markdown/commit/ebc8338488cbfe1299aedb503fc94e11e45e7d42))
- 增加流式会话的例子 ([88873c2](https://github.com/Tencent/cherry-markdown/commit/88873c2c564ee41137e5151bd836ad31ebd78c79))
- add configuration and right-click menu processing preview ([#760](https://github.com/Tencent/cherry-markdown/issues/760)) ([6372859](https://github.com/Tencent/cherry-markdown/commit/6372859407d22a1c625bc6a1ffbaf88ec0d32226))
- **vscodePlugin:** add webview icon ([#754](https://github.com/Tencent/cherry-markdown/issues/754)) ([b38ceea](https://github.com/Tencent/cherry-markdown/commit/b38ceea4b1df707e5facffdab7e33dcd13fc016f))

### Bug Fixes

- 当预览区只有一行内容时，导出文档 api 报错 ([f4b6201](https://github.com/Tencent/cherry-markdown/commit/f4b620155aae85b19bcd96c5ae8753e82d455c98))
- 联想配置模板失效 ([#757](https://github.com/Tencent/cherry-markdown/issues/757)) ([f93e2af](https://github.com/Tencent/cherry-markdown/commit/f93e2afbbba88ae4045e0e7558cc875e66001aca))
- 修复列表有多行时选区只选择第一行的问题 ([082a032](https://github.com/Tencent/cherry-markdown/commit/082a032c4717f7b22c4b331632f7f3dd836cebf9))
- 右侧编辑列表过程中, 输入回车后, 再次编辑此列表, 数据会异常 [#751](https://github.com/Tencent/cherry-markdown/issues/751) ([#772](https://github.com/Tencent/cherry-markdown/issues/772)) ([3e1e9fd](https://github.com/Tencent/cherry-markdown/commit/3e1e9fd057c0008f5f3d001a818fda1a8291b0a9))

### [0.8.41](https://github.com/Tencent/cherry-markdown/compare/v0.8.40...v0.8.41) (2024-05-06)

### Features

- [#714](https://github.com/Tencent/cherry-markdown/issues/714) 增加粘贴的回调 ([e9154f6](https://github.com/Tencent/cherry-markdown/commit/e9154f6ad05cf081cfe90dae4ff06dcf3fc58cd8))
- [#728](https://github.com/Tencent/cherry-markdown/issues/728) 把根据表格生成图表的功能放出来 ([e1df984](https://github.com/Tencent/cherry-markdown/commit/e1df9847d1f3ef0f7564784da9987876720a46cf))
- [#743](https://github.com/Tencent/cherry-markdown/issues/743) 增加联想、全角符号提示的配置能力 ([5f43a52](https://github.com/Tencent/cherry-markdown/commit/5f43a529148299e805ddcd3b7e681e3273f3a723))
- [#746](https://github.com/Tencent/cherry-markdown/issues/746) 增加自定义视频播放器容器的配置能力 ([3c9952f](https://github.com/Tencent/cherry-markdown/commit/3c9952f632b371d56fda8d498604355e525f9ccd))
- support config mathjax installed by npm ([872ec1e](https://github.com/Tencent/cherry-markdown/commit/872ec1e53c153ff5ab85d598793804630565ebd1))

### Bug Fixes

- [#750](https://github.com/Tencent/cherry-markdown/issues/750) 修复预览区点击回调事件失效的问题; feat: [#750](https://github.com/Tencent/cherry-markdown/issues/750) 增加点击 toc 页面目录不更新 location hash 的特性 ([0cff250](https://github.com/Tencent/cherry-markdown/commit/0cff250305ff5db08a4deb9777ddd698323c3411))
- image loading failed in vscode plugin ([#748](https://github.com/Tencent/cherry-markdown/issues/748)) ([b2c6a0e](https://github.com/Tencent/cherry-markdown/commit/b2c6a0e8b3c2e63508861193891421daa3465974)), closes [#744](https://github.com/Tencent/cherry-markdown/issues/744)

### [0.8.40](https://github.com/Tencent/cherry-markdown/compare/v0.8.39...v0.8.40) (2024-03-06)

### Features

- [#724](https://github.com/Tencent/cherry-markdown/issues/724) 增加流式会话场景的适配 ([ac98580](https://github.com/Tencent/cherry-markdown/commit/ac98580f6d278b11e0e4e3cc5161fdb25ecf363e))

### Bug Fixes

- [#719](https://github.com/Tencent/cherry-markdown/issues/719) 增加对工具栏显隐的控制，并增加 switchModel 的第二个参数 ([6294fa9](https://github.com/Tencent/cherry-markdown/commit/6294fa997485a5e83bb901f200e377e661547182))
- [#721](https://github.com/Tencent/cherry-markdown/issues/721) 修复纯预览模式下工具栏配置失效的问题 ([e69dd3c](https://github.com/Tencent/cherry-markdown/commit/e69dd3ca3fa20c3a7c30314db7df9761b7ab72ed))
- [#725](https://github.com/Tencent/cherry-markdown/issues/725) 拖放文件时，尽可能的走文件上传逻辑 ([6e8a0fd](https://github.com/Tencent/cherry-markdown/commit/6e8a0fd0df14ea56a5184a45ee227fbbf492f1f7))
- setValue 后处理 img-base64 格式防止显示长字符串 ([#727](https://github.com/Tencent/cherry-markdown/issues/727)) ([e3f2d3f](https://github.com/Tencent/cherry-markdown/commit/e3f2d3f58b13e026392d5d00f9f9816562726f25))

### [0.8.39](https://github.com/Tencent/cherry-markdown/compare/v0.8.38...v0.8.39) (2024-02-29)

### Features

- [#707](https://github.com/Tencent/cherry-markdown/issues/707) 提供滚动到对应锚点的 api ([3d96efc](https://github.com/Tencent/cherry-markdown/commit/3d96efc9427d2d8f2f527cce5ff46d302c08420c))
- **client:** add file right-click menu to `*.md` and directly read file content ([#717](https://github.com/Tencent/cherry-markdown/issues/717)) ([18b650a](https://github.com/Tencent/cherry-markdown/commit/18b650a72e8c8ff2c01d8fd75a6df30087677ce1))

### Bug Fixes

- [#461](https://github.com/Tencent/cherry-markdown/issues/461) 修复全屏时编辑区和预览区中间分割线拖拽位置错位的问题 ([539f77f](https://github.com/Tencent/cherry-markdown/commit/539f77faddb19e737491e0a0bd512c213f49aed4))
- [#681](https://github.com/Tencent/cherry-markdown/issues/681) 修复粘贴图片会出现两张图片的情况 ([83b47ea](https://github.com/Tencent/cherry-markdown/commit/83b47ea50df0b64e9e4620037b91485c39477068))
- [#681](https://github.com/Tencent/cherry-markdown/issues/681) 修复粘贴图片会出现两张图片的情况 ([634ccd3](https://github.com/Tencent/cherry-markdown/commit/634ccd3caaf6d942e5687a75e803549d3d360067))
- [#710](https://github.com/Tencent/cherry-markdown/issues/710) 修复粘贴多个文件时只能上传一个文件的问题 ([6830671](https://github.com/Tencent/cherry-markdown/commit/68306714b8fe45fde8f5a194602ece62d6d3de1c))

### [0.8.38](https://github.com/Tencent/cherry-markdown/compare/v0.8.37...v0.8.38) (2024-01-29)

### Features

- [#702](https://github.com/Tencent/cherry-markdown/issues/702) 提供销毁函数 ([bb3c856](https://github.com/Tencent/cherry-markdown/commit/bb3c85699b1430a5ad90387017f393f82793b5d1))
- [#703](https://github.com/Tencent/cherry-markdown/issues/703) 增加动态重置工具栏的 API ([4011335](https://github.com/Tencent/cherry-markdown/commit/4011335ec0b98adeb2aaa462b33a850767672b15))
- 优化联想的选中逻辑，默认不选中任意选项，不影响回车键 ([5ef6505](https://github.com/Tencent/cherry-markdown/commit/5ef6505d7c4d1b994cb9c35342f3124bd02c9370))

### Bug Fixes

- 修复自定义 keyword 覆盖问题 ([#705](https://github.com/Tencent/cherry-markdown/issues/705)) ([aa099ea](https://github.com/Tencent/cherry-markdown/commit/aa099eaff80850b6c2bc87d2c321b9bebd739f3f))
- 联想功能支持多实例 ([9d50c88](https://github.com/Tencent/cherry-markdown/commit/9d50c8806dc017f0575b14b4ba988a507faac9ca))

### [0.8.37](https://github.com/Tencent/cherry-markdown/compare/v0.8.36...v0.8.37) (2024-01-25)

### Bug Fixes

- [#683](https://github.com/Tencent/cherry-markdown/issues/683) themeNamespace 没有应用到 cherry 的外层容器 ([56e0ee7](https://github.com/Tencent/cherry-markdown/commit/56e0ee71b05d818df4b22c3183b8922686895ef1))
- 去掉冒号的联想 ([a03b749](https://github.com/Tencent/cherry-markdown/commit/a03b7498e09d714d64cdd40ccd1ac6565d63ee40))
- 引入 mathjax safe 组件，防止通过 mathjax 引入 xss 注入 ([5e3e74c](https://github.com/Tencent/cherry-markdown/commit/5e3e74c96885c18d2be2e264bb713223f2d8517f))

### [0.8.36](https://github.com/Tencent/cherry-markdown/compare/v0.8.35...v0.8.36) (2024-01-22)

### Features

- [#683](https://github.com/Tencent/cherry-markdown/issues/683) 增加主题缓存的命名空间机制 ([f4bf980](https://github.com/Tencent/cherry-markdown/commit/f4bf9808921ac7bb0161c2daee5e613018c55a05))
- [#697](https://github.com/Tencent/cherry-markdown/issues/697) 代码块支持自动闭合 ([4989771](https://github.com/Tencent/cherry-markdown/commit/4989771151719a0fe5ab3a2135c2a5e01c142dbb))
- **publish:** 支持发布功能 ([#689](https://github.com/Tencent/cherry-markdown/issues/689)) ([f7cc3a5](https://github.com/Tencent/cherry-markdown/commit/f7cc3a59ffb42ffd83a1684ffc2222080e1e9b5e))

### Bug Fixes

- [#683](https://github.com/Tencent/cherry-markdown/issues/683) 修复最小高度引入的样式问题 ([03f7a99](https://github.com/Tencent/cherry-markdown/commit/03f7a99dcf9db268eec53637509b524066511ca9))
- [#698](https://github.com/Tencent/cherry-markdown/issues/698) 修复手风琴语法无法显示图片的问题 ([e232a99](https://github.com/Tencent/cherry-markdown/commit/e232a9958acf4a2ff5f7d88066f7cc5f0bdeea00))
- **autolink:** fix unexpected %5c in uris with underscore ([#695](https://github.com/Tencent/cherry-markdown/issues/695)) ([3ac4b60](https://github.com/Tencent/cherry-markdown/commit/3ac4b60344cd0cfb55c0d02b49d3862cd22e54b4))
- **Toc:** use `div` replace obsolete HTML elements `dir` ([#693](https://github.com/Tencent/cherry-markdown/issues/693)) ([30bef8d](https://github.com/Tencent/cherry-markdown/commit/30bef8d11e58c99c7a7cee58b17ab2980ad00e7e))

### [0.8.35](https://github.com/Tencent/cherry-markdown/compare/v0.8.34...v0.8.35) (2024-01-12)

### Features

- **kbd:** add styles to \<kbd> tag & update examples ([#679](https://github.com/Tencent/cherry-markdown/issues/679)) ([ac3650d](https://github.com/Tencent/cherry-markdown/commit/ac3650d65eddb9e9b77337a336cfeb4206b82ea9))

### Bug Fixes

- add dom purifier to math result for security ([f79dc95](https://github.com/Tencent/cherry-markdown/commit/f79dc95acb93af6a8f5109cf1fd3ee1c78059343))
- **client:** redeclare the 'toc' state ([#678](https://github.com/Tencent/cherry-markdown/issues/678)) ([9216837](https://github.com/Tencent/cherry-markdown/commit/9216837c57c0a02a78b9fb3ae7cd0ebfb21004f3)), closes [#675](https://github.com/Tencent/cherry-markdown/issues/675) [#676](https://github.com/Tencent/cherry-markdown/issues/676) [#677](https://github.com/Tencent/cherry-markdown/issues/677)
- **xss:** fix potential xss in raw html ([596805c](https://github.com/Tencent/cherry-markdown/commit/596805cc6eaff2d0528bb75956abaf7ffdc3f9fe))
- 修改示例中 emoji 表情的配置 ([66c3ecc](https://github.com/Tencent/cherry-markdown/commit/66c3ecca0e4e6cda7281f124f5063a116d772969))

### Code Refactoring

- **client:** use `cherry-markdown`'s TOC component ([#677](https://github.com/Tencent/cherry-markdown/issues/677)) ([b8899af](https://github.com/Tencent/cherry-markdown/commit/b8899af1052ec5b1f2ac1a2537b02a1000b0ea23))

### [0.8.33](https://github.com/Tencent/cherry-markdown/compare/v0.8.32...v0.8.33) (2023-12-25)

### [0.8.34](https://github.com/Tencent/cherry-markdown/compare/v0.8.32...v0.8.34) (2023-12-26)

### Bug Fixes

- [#657](https://github.com/Tencent/cherry-markdown/issues/657) closed 修复复制按钮点击报错问题 ([de3f368](https://github.com/Tencent/cherry-markdown/commit/de3f36859e58e2171726346a69fb58030e724b3b))
- [#673](https://github.com/Tencent/cherry-markdown/issues/673) closed 修复粘贴 excel 只有图片的问题 ([9f46d5e](https://github.com/Tencent/cherry-markdown/commit/9f46d5e667e44d96f546bd0064332a37b212f184))
- 额外兼容 node 场景 ([0d04a68](https://github.com/Tencent/cherry-markdown/commit/0d04a680f88fefd5516b9325e16adf59990b16ea))
- 修复 pointer event 导致的误触，兼容浏览器不支持 pointer event 的情况 ([08965e5](https://github.com/Tencent/cherry-markdown/commit/08965e5dc05e2036c2443ed0ba089f4014c180e9))
- 重构表格逆解析时，处理空格的逻辑 ([49e4907](https://github.com/Tencent/cherry-markdown/commit/49e49072f3224a04e07db2bb026a41db1302c0ea))

### [0.8.31](https://github.com/Tencent/cherry-markdown/compare/v0.8.30...v0.8.31) (2023-12-07)

### [0.8.33](https://github.com/Tencent/cherry-markdown/compare/v0.8.32...v0.8.33) (2023-12-25)

### Bug Fixes

- 额外兼容 node 场景 ([0d04a68](https://github.com/Tencent/cherry-markdown/commit/0d04a680f88fefd5516b9325e16adf59990b16ea))
- 修复 pointer event 导致的误触，兼容浏览器不支持 pointer event 的情况 ([08965e5](https://github.com/Tencent/cherry-markdown/commit/08965e5dc05e2036c2443ed0ba089f4014c180e9))

### [0.8.31](https://github.com/Tencent/cherry-markdown/compare/v0.8.30...v0.8.31) (2023-12-07)

### [0.8.32](https://github.com/Tencent/cherry-markdown/compare/v0.8.30...v0.8.32) (2023-12-18)

### Features

- [#658](https://github.com/Tencent/cherry-markdown/issues/658) 增加悬浮目录及相关配置、记忆、回显、跳转等功能 ([308b15b](https://github.com/Tencent/cherry-markdown/commit/308b15b45a697a9761c72936529d06f82670f29e))
- 目录滚动效果不再依赖 scrollIntoView ([6b9fdef](https://github.com/Tencent/cherry-markdown/commit/6b9fdef22c8059f35466b0fe4d353d7ae7ac0a65))

### Bug Fixes

- [#667](https://github.com/Tencent/cherry-markdown/issues/667) closed 修复视频封面无法展示的问题 ([b38dc15](https://github.com/Tencent/cherry-markdown/commit/b38dc152bd1319ae32a3f57b9aa38a68869174e0))
- [#668](https://github.com/Tencent/cherry-markdown/issues/668) [#662](https://github.com/Tencent/cherry-markdown/issues/662) closed 修复表格所见即所得编辑定位的问题，解决方案：先屏蔽拖拽行列的功能 ([ad8e9e4](https://github.com/Tencent/cherry-markdown/commit/ad8e9e452bbd9d1933732e24b4d12e57f812f7b1))
- 修改@关键字及默认 keyword 顺序 ([#664](https://github.com/Tencent/cherry-markdown/issues/664)) ([d35f790](https://github.com/Tencent/cherry-markdown/commit/d35f790699e11ba6e9425eda0ed3d457b694938c))

### [0.8.31](https://github.com/Tencent/cherry-markdown/compare/v0.8.30...v0.8.31) (2023-12-07)

### [0.8.30--skip.tag](https://github.com/Tencent/cherry-markdown/compare/v0.8.29...v0.8.30--skip.tag) (2023-12-07)

### Features

- [#642](https://github.com/Tencent/cherry-markdown/issues/642) close 增加配置，是否在初始化时保持页面的滚动位置 ([b58de6d](https://github.com/Tencent/cherry-markdown/commit/b58de6d83fba8ab1ff12a039f529f43e9f3e8447))
- [#642](https://github.com/Tencent/cherry-markdown/issues/642) 修改配置的默认值为 false（与旧版本效果保持一致） ([c7a800d](https://github.com/Tencent/cherry-markdown/commit/c7a800d4bb762f026b616c78e7b4d454abec8a42))
- [#642](https://github.com/Tencent/cherry-markdown/issues/642) 在调用 setMarkdown/setValue 时保持页面的滚动位置 ([5106859](https://github.com/Tencent/cherry-markdown/commit/51068590a67d52e33ccd9fd9dcad2b52dd306e25))
- [#653](https://github.com/Tencent/cherry-markdown/issues/653) 增加新的配置开关，打开后 cherry 完成初始化后会根据 hash 进行 滚动定位 ([50bc19d](https://github.com/Tencent/cherry-markdown/commit/50bc19d6ed73e644a0f610face5eb644220dacd3))
- [#653](https://github.com/Tencent/cherry-markdown/issues/653) 增加新的配置开关，打开后 cherry 完成初始化后会根据 hash 进行 滚动定位 在 demo 里默认打开 ([029f3d2](https://github.com/Tencent/cherry-markdown/commit/029f3d2840ea8b1eeba19fcd7d76ec15522cceb0))
- 优化处理 base64 数据的时机和正则，确保 base64 数据能够及时被替换成占位符 ([5bbb803](https://github.com/Tencent/cherry-markdown/commit/5bbb8034c1a7bc31b88c473599301a6a1f2f4ff4))
- 增加字数统计功能 ([#659](https://github.com/Tencent/cherry-markdown/issues/659)) ([e313d0c](https://github.com/Tencent/cherry-markdown/commit/e313d0c3f6da6642db49b72fc7ddeac82616a897))

### Bug Fixes

- [#650](https://github.com/Tencent/cherry-markdown/issues/650) switchModel()API 切换预览模式时隐藏工具栏 ([b573fd3](https://github.com/Tencent/cherry-markdown/commit/b573fd3b8f800044520ebbdcc3944510f08a2ee3))
- [#650](https://github.com/Tencent/cherry-markdown/issues/650) 修复切换主题时原始 class 被改错的问题 ([30be078](https://github.com/Tencent/cherry-markdown/commit/30be078aec720a69b160e9cb54121481d21d1c7b))
- 修复 formatFullWidthMark 函数 ([#655](https://github.com/Tencent/cherry-markdown/issues/655)) ([8d34763](https://github.com/Tencent/cherry-markdown/commit/8d3476318914297ad0952658377184f29dbe7ae9))

### Code Refactoring

- **client:** add sidebar tags ([#644](https://github.com/Tencent/cherry-markdown/issues/644)) ([32e8525](https://github.com/Tencent/cherry-markdown/commit/32e8525a8b7b55d9c03f7d8280f5a2209880227a))

### [0.8.29](https://github.com/Tencent/cherry-markdown/compare/v0.8.28...v0.8.29) (2023-11-20)

### [0.8.28](https://github.com/Tencent/cherry-markdown/compare/v0.8.27...v0.8.28) (2023-11-20)

### Bug Fixes

- [#621](https://github.com/Tencent/cherry-markdown/issues/621) closed 修复纯预览模式切换成编辑模式时工具栏不显示的问题 ([8d31d89](https://github.com/Tencent/cherry-markdown/commit/8d31d898ca28e51ac3b247640f144a86e7828b6d))
- [#623](https://github.com/Tencent/cherry-markdown/issues/623) 重构代码块预览区编辑功能，同时修复预览区工具栏滚动时超出界面的问题，增加是否允许切换代码块语言的功能 ([1fed833](https://github.com/Tencent/cherry-markdown/commit/1fed833a17365249f53ae01b2a505ad613f71720))

### [0.8.27](https://github.com/Tencent/cherry-markdown/compare/v0.8.26...v0.8.27) (2023-11-07)

### Features

- 输入中文符号时给出英文联想 [#541](https://github.com/Tencent/cherry-markdown/issues/541) ([#585](https://github.com/Tencent/cherry-markdown/issues/585)) ([c02887d](https://github.com/Tencent/cherry-markdown/commit/c02887d31e94d68b2af5fc1a3b3d45a433c731f3))
- 支持表格行和列拖拽改变位置所见即所得 ([#584](https://github.com/Tencent/cherry-markdown/issues/584)) ([e230b2b](https://github.com/Tencent/cherry-markdown/commit/e230b2b552b7f14043a652fd2acf67846907a984))
- **client:** add `Toc` side panel ([#612](https://github.com/Tencent/cherry-markdown/issues/612)) ([3a0e55b](https://github.com/Tencent/cherry-markdown/commit/3a0e55b3fe6c7434c904bafa93b5f3204eb129e2))

### Bug Fixes

- List 预览编辑会导致格式失效 ([#593](https://github.com/Tencent/cherry-markdown/issues/593)) ([04c0341](https://github.com/Tencent/cherry-markdown/commit/04c03416328343039138ef68f3e88542b337fb57)), closes [#579](https://github.com/Tencent/cherry-markdown/issues/579) [#579](https://github.com/Tencent/cherry-markdown/issues/579)
- types of external `api`, `Engine` and `toolbarHandlers` APIs, ([#580](https://github.com/Tencent/cherry-markdown/issues/580)) ([8b05654](https://github.com/Tencent/cherry-markdown/commit/8b056540d7f0da526062d8ab4243d7e5fb94fa64))
- `CherryEngine` type declaration ([#630](https://github.com/Tencent/cherry-markdown/issues/630)) ([9d93b32](https://github.com/Tencent/cherry-markdown/commit/9d93b322d4af35b75b29408ac1f84392a62167d6)), closes [#628](https://github.com/Tencent/cherry-markdown/issues/628)
- 类型构建的路径替换脚本遇到错误需抛出 ([f9b86a9](https://github.com/Tencent/cherry-markdown/commit/f9b86a93ec2c354680e65844dc4a98f22cb7495b))
- 修复对齐方式没有翻译的问题 [#603](https://github.com/Tencent/cherry-markdown/issues/603) ([0b7c3e1](https://github.com/Tencent/cherry-markdown/commit/0b7c3e17f8e6b72e86e07583c5105cebde316429))
- 修复默认为 editOnly 时 status 错误的问题 ([#608](https://github.com/Tencent/cherry-markdown/issues/608)) ([8af042a](https://github.com/Tencent/cherry-markdown/commit/8af042ae159ebd4ce025cdd6408ff9600f2d3d7c))
- 修复生成类型中的 path 错误导致 ([5523433](https://github.com/Tencent/cherry-markdown/commit/5523433040b24802ba0b1ad6fe84996b46e21aee))
- 修复无法导出图片的问题，修复导出图片时没有传文件名时没有给出默认文件名的问题 ([8cadbea](https://github.com/Tencent/cherry-markdown/commit/8cadbea6fa0799ca03e7a9161ba977be6aa59a47))
- 修复粘贴图片时 fileUpload 的 callback 需要 params 参数的问题 ([7609a0d](https://github.com/Tencent/cherry-markdown/commit/7609a0d5b69abfde616745634b08cc3e9f8fbc54))
- enable `list` and `graph` to support the use of method names ([#581](https://github.com/Tencent/cherry-markdown/issues/581)) ([7276f6a](https://github.com/Tencent/cherry-markdown/commit/7276f6a4c220b69a1af7a8acc2a6d88d1afe734c))
- graph 无法翻译的问题 ([5ea2d4d](https://github.com/Tencent/cherry-markdown/commit/5ea2d4df6c92081814cc03f40c835fdfea84a22b))
- issue[#583](https://github.com/Tencent/cherry-markdown/issues/583) ([#591](https://github.com/Tencent/cherry-markdown/issues/591)) ([7e866c7](https://github.com/Tencent/cherry-markdown/commit/7e866c7f007321c4d7bc929d2007dcbfc3dd03ae))
- issue[#595](https://github.com/Tencent/cherry-markdown/issues/595) 全角替换半角存在定位问题 ([#596](https://github.com/Tencent/cherry-markdown/issues/596)) ([624c748](https://github.com/Tencent/cherry-markdown/commit/624c748974e0bb44cac8c426c8d4318b9402b5ac))

### Performance Improvements

- **split:** fixed toolbar split line height ([#611](https://github.com/Tencent/cherry-markdown/issues/611)) ([58883b5](https://github.com/Tencent/cherry-markdown/commit/58883b5369e1a2a5b196cd67b138f9e6d009e527))

### [0.8.26](https://github.com/Tencent/cherry-markdown/compare/v0.8.25...v0.8.26) (2023-09-14)

### Bug Fixes

- **emphasis:** fix poor performance when matching across lines ([6246d87](https://github.com/Tencent/cherry-markdown/commit/6246d874f5cc7afc87dfa33fa8f7412ee79f3185))

### [0.8.25](https://github.com/Tencent/cherry-markdown/compare/v0.8.24...v0.8.25) (2023-09-05)

### Features

- 有序列表、无序列表、checklist 支持所见即所得编辑 [#543](https://github.com/Tencent/cherry-markdown/issues/543) ([#553](https://github.com/Tencent/cherry-markdown/issues/553)) ([47770e8](https://github.com/Tencent/cherry-markdown/commit/47770e8d7ba8f4770a1f64db648218c191862534))
- add issue templates ([#570](https://github.com/Tencent/cherry-markdown/issues/570)) ([faf53c0](https://github.com/Tencent/cherry-markdown/commit/faf53c05f40be89933da68539112e33b4b87f7a7)), closes [#565](https://github.com/Tencent/cherry-markdown/issues/565)
- **client:** add `SidePanel` file directory ([#554](https://github.com/Tencent/cherry-markdown/issues/554)) ([d1e7d65](https://github.com/Tencent/cherry-markdown/commit/d1e7d6569d30a1332e22452858e2628c04071bbe))
- CodeBlock 所见即所得支持 ([#549](https://github.com/Tencent/cherry-markdown/issues/549)) ([aba8877](https://github.com/Tencent/cherry-markdown/commit/aba8877a5aa202bf99627dfd3c9c2a4495c88f72))

### Bug Fixes

- [#560](https://github.com/Tencent/cherry-markdown/issues/560) toolbar 合并 hooks 时，重名的处理方式改为保留 toolbar 原有 hook ([#568](https://github.com/Tencent/cherry-markdown/issues/568)) ([d69c0ad](https://github.com/Tencent/cherry-markdown/commit/d69c0ad60fb5589e3d2928c22d2c59751e722157))
- [#567](https://github.com/Tencent/cherry-markdown/issues/567) toolbar 子类重写 init 导致未执行部分初始化 ([#569](https://github.com/Tencent/cherry-markdown/issues/569)) ([b8244f6](https://github.com/Tencent/cherry-markdown/commit/b8244f616920a667b7edf7103d6364dfae6358d2))
- **DrawIo:** 支持 cherry-dialog 拖拽 ([#442](https://github.com/Tencent/cherry-markdown/issues/442)) ([#559](https://github.com/Tencent/cherry-markdown/issues/559)) ([491cb0e](https://github.com/Tencent/cherry-markdown/commit/491cb0e96e9bd999703aefaf7b6a3c2a9dfe48c5))

### Code Refactoring

- suggester 初始化机制；refactor: 最简版 demo；fix: 超链接规则过严导致带感叹号的 url 被转义 ([c40d25d](https://github.com/Tencent/cherry-markdown/commit/c40d25dbfbe5f88fde99f3df1a07a9d8ac38fd8a))

### [0.8.24](https://github.com/Tencent/cherry-markdown/compare/v0.8.23-1.0...v0.8.24) (2023-08-28)

### Features

- 当没有配置图片上传回调接口时，粘贴、拖拽上传的图片以 base64 格式展示 close [#545](https://github.com/Tencent/cherry-markdown/issues/545) ([ec88880](https://github.com/Tencent/cherry-markdown/commit/ec88880b33020aaf7c22274b32e0ec6bbaf83d82))

### [0.8.23-1.0](https://github.com/Tencent/cherry-markdown/compare/v0.8.23-lastest...v0.8.23-1.0) (2023-08-25)

### [0.8.23-lastest](https://github.com/Tencent/cherry-markdown/compare/v0.8.23...v0.8.23-lastest) (2023-08-25)

### Bug Fixes

- [#546](https://github.com/Tencent/cherry-markdown/issues/546) 在 node 环境下，输入联想会引发报错 ([e24f1e1](https://github.com/Tencent/cherry-markdown/commit/e24f1e1db09b198c63b8b47ab3d16b91eb3bf0a7))

### [0.8.23](https://github.com/Tencent/cherry-markdown/compare/v0.8.22...v0.8.23) (2023-08-24)

### ⚠ BREAKING CHANGES

- @tencent/cherry-markdown no longer supports node < 14

- chore(\*): track dist files with lfs

- chore(\*): fix styles output path & update docs

### Features

- [#437](https://github.com/Tencent/cherry-markdown/issues/437) 优化插入公式选择模板的功能，并增加预览区域公式导出、复制操作 ([#537](https://github.com/Tencent/cherry-markdown/issues/537)) ([0e40577](https://github.com/Tencent/cherry-markdown/commit/0e4057793c4a4ee1bc67ff984cd5ef4dfbcbafd6))
- 434 vscode 插件支持配置图床 ([#534](https://github.com/Tencent/cherry-markdown/issues/534)) ([4fdbb93](https://github.com/Tencent/cherry-markdown/commit/4fdbb93fbc50493d499c962eedfdcbbbdf0e81b3))
- 增加配置快捷键的功能 close [#406](https://github.com/Tencent/cherry-markdown/issues/406) ([55e582f](https://github.com/Tencent/cherry-markdown/commit/55e582f2abe6bab54c4e1f76163f5091bb0aa124))

### Bug Fixes

- [#387](https://github.com/Tencent/cherry-markdown/issues/387) CherryEngine TypeError ([#535](https://github.com/Tencent/cherry-markdown/issues/535)) ([56165bf](https://github.com/Tencent/cherry-markdown/commit/56165bf01bb67a0fe2474873e036024968d987ae))
- 复制 html 内容时有报错 [#536](https://github.com/Tencent/cherry-markdown/issues/536)；更新 vscode 插件 ([402a05d](https://github.com/Tencent/cherry-markdown/commit/402a05d0e702c71a942fe4226fad4ba1866f74f1))
- 修复右侧顶部工具栏不支持自定义菜单的问题，修复 cherry.toolbar.toolbarHandlers 收集按钮不全的问题 ([ca2347f](https://github.com/Tencent/cherry-markdown/commit/ca2347fbaabfbaa43699e4b5e8c2b35bff12bd6f))
- 修复右侧顶部工具栏不支持自定义菜单的问题，修复 cherry.toolbar.toolbarHandlers 收集按钮不全的问题 ([#531](https://github.com/Tencent/cherry-markdown/issues/531)) ([7e4a125](https://github.com/Tencent/cherry-markdown/commit/7e4a125e707f0b0e3be0931069976f5f4bac0c98))
- 支持空链接 [#530](https://github.com/Tencent/cherry-markdown/issues/530) ([0fc0399](https://github.com/Tencent/cherry-markdown/commit/0fc03992cbed61c19da581b246e50be19e2da212))
- close [#532](https://github.com/Tencent/cherry-markdown/issues/532) ([a1df190](https://github.com/Tencent/cherry-markdown/commit/a1df19037ba45945ccadcc6ebc1a566cf30e5bbc))
- syntax type err & formula config ([#539](https://github.com/Tencent/cherry-markdown/issues/539)) ([5484c4a](https://github.com/Tencent/cherry-markdown/commit/5484c4a0ae56896196fd7b482134bed7aa3da4b8)), closes [#437](https://github.com/Tencent/cherry-markdown/issues/437)
- **types:** fix type check & security issues ([#538](https://github.com/Tencent/cherry-markdown/issues/538)) ([0f036e9](https://github.com/Tencent/cherry-markdown/commit/0f036e964a8f53a545b1049d3e6a4424753389dd))

### chore

- upgrade mermaid@10.2.4 ([#520](https://github.com/Tencent/cherry-markdown/issues/520)) ([c842448](https://github.com/Tencent/cherry-markdown/commit/c842448139d9f1fd0af9e949469c9b36d838c9e8)), closes [#510](https://github.com/Tencent/cherry-markdown/issues/510)

### [0.8.22](https://github.com/Tencent/cherry-markdown/compare/v0.8.21...v0.8.22) (2023-08-01)

### Features

- 点击 chatgpt 的时候增加 loading ([ede7e45](https://github.com/Tencent/cherry-markdown/commit/ede7e45c48b93a33ace00e81b4f086eb6f16e41b))
- 增加超链接新页面打开配置能力，同时顺手关掉联想里的续写和总结功能 ([be1800a](https://github.com/Tencent/cherry-markdown/commit/be1800a64e9592f9f3b2c5c1ebd36b45ab471f14))
- 增加 chatgpt 输入联想功能 ([6714211](https://github.com/Tencent/cherry-markdown/commit/6714211187afb468e3a05dc40e8c6a825e35177d))
- custom export file name close([#506](https://github.com/Tencent/cherry-markdown/issues/506)) ([#517](https://github.com/Tencent/cherry-markdown/issues/517)) ([4b60dd7](https://github.com/Tencent/cherry-markdown/commit/4b60dd761848a57e3c124fca2894a174a88c3882))

### Bug Fixes

- 纯预览模式下不提供表格所见即所得编辑能力 close [#513](https://github.com/Tencent/cherry-markdown/issues/513) ([edbd0fe](https://github.com/Tencent/cherry-markdown/commit/edbd0fe4f13e06b5a2dd7d33f0086ed9a573fd4d))
- 导出时处理懒加载的图片 close [#504](https://github.com/Tencent/cherry-markdown/issues/504) ([8a26cda](https://github.com/Tencent/cherry-markdown/commit/8a26cda2233ae074b4da3c6f34e41cb2ef739fc5))
- 导出 PDF 不支持背景 closed [#456](https://github.com/Tencent/cherry-markdown/issues/456) ；fix: 表格里不支持转义符 ([7a4d5d2](https://github.com/Tencent/cherry-markdown/commit/7a4d5d2693da06cfdedbefd4274fe40570b5d969))
- 二级菜单定位错误 close [#514](https://github.com/Tencent/cherry-markdown/issues/514) ([a437562](https://github.com/Tencent/cherry-markdown/commit/a437562bb7d222284fc35cc8809da70caa9ffd69))
- 修复导出 PDF 的 bug close [#512](https://github.com/Tencent/cherry-markdown/issues/512) ([8fdaf6a](https://github.com/Tencent/cherry-markdown/commit/8fdaf6aa00db6be36a3bb97d1e27d15cefeed172))

### [0.8.21](https://github.com/Tencent/cherry-markdown/compare/v0.8.20...v0.8.21) (2023-07-14)

### Features

- 丰富表格所见即所得功能 ([#479](https://github.com/Tencent/cherry-markdown/issues/479)) ([aa574a7](https://github.com/Tencent/cherry-markdown/commit/aa574a78492783a8f8556a4f46943343c0494ee1))
- 优化输入联想的交互体验 ([2dcb231](https://github.com/Tencent/cherry-markdown/commit/2dcb231d5777ebb8e3444fefd913b355b5d2d176))
- 预览区支持 hover 相关逻辑、表格支持 hover 添加行列 ([#502](https://github.com/Tencent/cherry-markdown/issues/502)) ([57ba97b](https://github.com/Tencent/cherry-markdown/commit/57ba97bf4bb7da037ed6be3dc5032628cab86699))
- 支持专注模式、打字机模式 ([#503](https://github.com/Tencent/cherry-markdown/issues/503)) ([8c22aea](https://github.com/Tencent/cherry-markdown/commit/8c22aeaa334c8f62243a698ce4e069834d88b9d9))
- add mermaid error, issue [#488](https://github.com/Tencent/cherry-markdown/issues/488) ([5fcdbbe](https://github.com/Tencent/cherry-markdown/commit/5fcdbbee7e3e621a4e76171c6af3bb394c4c1d11))
- **docs:** add configuration option ([#468](https://github.com/Tencent/cherry-markdown/issues/468)) ([73be84c](https://github.com/Tencent/cherry-markdown/commit/73be84cfce5ee90ba2b4b0c2bfbe81c26d7bb5e7))
- **Editor:** 增加对罗马数字与汉字列表的换行自动补全 ([#493](https://github.com/Tencent/cherry-markdown/issues/493)) ([085b5ea](https://github.com/Tencent/cherry-markdown/commit/085b5ea28f841418e85fa63584f9095ee06c6465))
- **Suggester:** Suggester 扩展 [#430](https://github.com/Tencent/cherry-markdown/issues/430) ([#473](https://github.com/Tencent/cherry-markdown/issues/473)) ([d315708](https://github.com/Tencent/cherry-markdown/commit/d3157081396ef80c0247f0b70da92af2f6f10172))
- support switching language when previewing code ([#464](https://github.com/Tencent/cherry-markdown/issues/464)) ([21d5b98](https://github.com/Tencent/cherry-markdown/commit/21d5b98a141a21a2a5ac1fd1aa6f62f8f987a546))

### Bug Fixes

- [#466](https://github.com/Tencent/cherry-markdown/issues/466) 去掉时序图强制显示序号的逻辑 ([2bcefc7](https://github.com/Tencent/cherry-markdown/commit/2bcefc73366ff52f32cbf47d2ad50d1416aa733a))
- 避免出现 theme\_\_null class 以及修复了常用操作的一些 i18n 国际化问题 ([#463](https://github.com/Tencent/cherry-markdown/issues/463)) ([b2c0805](https://github.com/Tencent/cherry-markdown/commit/b2c0805685970c98775f32e3a69af7ce91eea0fe))
- close [#470](https://github.com/Tencent/cherry-markdown/issues/470) 点击 float 插入 menu 位置错位 ([1b0844d](https://github.com/Tencent/cherry-markdown/commit/1b0844d6af48634d33cd908bc7136ea7a73a6058))
- close [#472](https://github.com/Tencent/cherry-markdown/issues/472) 修复点击 draw.io 图片出现无法回显编辑内容的情况 ([047d48e](https://github.com/Tencent/cherry-markdown/commit/047d48ee3a5ab53c29e68f7e1de3a428b75a01e3))
- close [#476](https://github.com/Tencent/cherry-markdown/issues/476) 处理粘贴代码时出现多余换行的情况，同时顺便修复复制粘贴代码块出现 select 标签的情况 ([08c351b](https://github.com/Tencent/cherry-markdown/commit/08c351bf9c3c0af8a10d5f37a8e6b309374087ca))
- **Engine:** 修复 blockquote 里，代码块被渲染为行内代码的 bug ([#481](https://github.com/Tencent/cherry-markdown/issues/481)) ([22940ae](https://github.com/Tencent/cherry-markdown/commit/22940aea6dc85360659289b6fcdde32a0890a951))
- **preview:** 修复 html2canvas 导致的含 MathJax 的截图导出重影问题 ([#484](https://github.com/Tencent/cherry-markdown/issues/484)) ([855b633](https://github.com/Tencent/cherry-markdown/commit/855b633ed31c5b8f10c3724568ebb69b1f3d6435))
- **Unittest:** 修复了单元测试代码中的诸多小问题 ([#482](https://github.com/Tencent/cherry-markdown/issues/482)) ([58092e4](https://github.com/Tencent/cherry-markdown/commit/58092e46e5284a89ea581d12052dae17bb0b5ba4))

### [0.8.20](https://github.com/Tencent/cherry-markdown/compare/v0.8.19...v0.8.20) (2023-05-31)

### Features

- 增加 mermaid 配置功能，可指定 mermaid 生成的是 svg 还是图片 ([2bcded7](https://github.com/Tencent/cherry-markdown/commit/2bcded78dae523fb1e766a7b91389658d1e23f3b))
- **client:** add `cherry markdown` to use ([#451](https://github.com/Tencent/cherry-markdown/issues/451)) ([7054200](https://github.com/Tencent/cherry-markdown/commit/70542001c4ac0c47f69fdb88b1f709267b623ae5))
- **preview:** ([#432](https://github.com/Tencent/cherry-markdown/issues/432)) support checkbox what-you-see-is-what-you-get feature ([#457](https://github.com/Tencent/cherry-markdown/issues/457)) ([baf592f](https://github.com/Tencent/cherry-markdown/commit/baf592f7ad803c130ff4fef1f815e0efb22751cc))

### Bug Fixes

- [#444](https://github.com/Tencent/cherry-markdown/issues/444) 初始化 float 和 bubble 时传入 customMenu ([#446](https://github.com/Tencent/cherry-markdown/issues/446)) ([1fc0972](https://github.com/Tencent/cherry-markdown/commit/1fc0972d8d4629f679970047f4b0f91af410fbfe))
- 同一行多个 img 所见即所得编辑时无法选中正确的图片 ([f64430d](https://github.com/Tencent/cherry-markdown/commit/f64430d92c6d94e4305d1ab22c4f5a47df42c946))
- 限制表格预览区域编辑的判定范围 ([ee28d26](https://github.com/Tencent/cherry-markdown/commit/ee28d26531b1e0a8087a27b46c96652939745d03))
- 优化图片懒加载的配置判断逻辑 ([61974b9](https://github.com/Tencent/cherry-markdown/commit/61974b9d4aada1fc660ed4d5e30b51d19ff89f38))
- **fullScreen:** icon switch (close [#445](https://github.com/Tencent/cherry-markdown/issues/445)) ([#447](https://github.com/Tencent/cherry-markdown/issues/447)) ([bd310c1](https://github.com/Tencent/cherry-markdown/commit/bd310c16c9fa096fb4ba7281456efabc4850ba1a))
- **Previewer:** 调整暗黑模式下高亮行颜色 ([69ad07d](https://github.com/Tencent/cherry-markdown/commit/69ad07d9b48008512297c172a5ba1fa8f2e7b008))

### [0.8.19](https://github.com/Tencent/cherry-markdown/compare/v0.8.18...v0.8.19) (2023-04-24)

### Features

- [#412](https://github.com/Tencent/cherry-markdown/issues/412) 增加 textarea 的 name 属性配置能力 ([b20c260](https://github.com/Tencent/cherry-markdown/commit/b20c26061dea3c7d392a860bb5bb8fa150eeff4a))
- [#424](https://github.com/Tencent/cherry-markdown/issues/424) 增加对齐方式语法和对应按钮 ([f0973d6](https://github.com/Tencent/cherry-markdown/commit/f0973d6b7259f4ba2e51fe7f87a0a0e3c6c4a0d8))
- add fullScreen function ([#420](https://github.com/Tencent/cherry-markdown/issues/420)) ([#426](https://github.com/Tencent/cherry-markdown/issues/426)) ([843ad64](https://github.com/Tencent/cherry-markdown/commit/843ad647d8d6cfb1ed4eb247fee1a495c25dfce0))
- support drawIo in client ([92a3119](https://github.com/Tencent/cherry-markdown/commit/92a3119167e100ea8ec97dde91dd03ef58bc5560))
- vscode 插件支持预览工作区图片 ([cd09242](https://github.com/Tencent/cherry-markdown/commit/cd092429c13243e80dd3173d072a312544f8caec))

### Bug Fixes

- [#439](https://github.com/Tencent/cherry-markdown/issues/439) 修复 sidebar 设置为 false 失效的问题 ([4474e47](https://github.com/Tencent/cherry-markdown/commit/4474e478c1790b95125dbc6dc436388e63484bba))
- [#440](https://github.com/Tencent/cherry-markdown/issues/440) 修复顶格插入表格时，预览区域表格无法进行编辑 ([3e5b3b8](https://github.com/Tencent/cherry-markdown/commit/3e5b3b82e7547fbc78779ed79bee93814e5d4d82))
- 处理右对齐工具栏的默认值问题 ([dc9186d](https://github.com/Tencent/cherry-markdown/commit/dc9186df0e0c1748d0bdff5e62d320e236b33d4f))
- 修复侧边栏二级菜单定位不准确的问题 ([8bc6c3b](https://github.com/Tencent/cherry-markdown/commit/8bc6c3b21dd0c0beb97ed7544f8af4a8f769ba8f))
- 优化判断图片是否在视区内的判断逻辑 ([83efd75](https://github.com/Tencent/cherry-markdown/commit/83efd758e0b3a4621c4aa7cdbaf3c2f294f62f65))
- use up-to-date script for client to avoid drawIo not found error ([8ed9400](https://github.com/Tencent/cherry-markdown/commit/8ed9400c651b18f360ed0d2b14066bb5f7de3e90))

### [0.8.18](https://github.com/Tencent/cherry-markdown/compare/v0.8.16...v0.8.18) (2023-04-10)

### Features

- 对正在编辑的区域进行高亮 ([#413](https://github.com/Tencent/cherry-markdown/issues/413)) ([bac8173](https://github.com/Tencent/cherry-markdown/commit/bac8173dbad26c159bb179b7db18676e7c5614b4))
- 图片语法增加花括号扩展能力 ([44d8063](https://github.com/Tencent/cherry-markdown/commit/44d806355db28afe067c1c21041058673d9c1bd5))
- 增加插入 draw.io 功能；增加编辑 draw.io 机制；\n fix: 修复编辑图片尺寸时有可能受代码块语法影响的问题 ([e326b86](https://github.com/Tencent/cherry-markdown/commit/e326b86ddd85b680c34a5ca071a9d735a22c6148))
- 增加设置主题的 api ([681857f](https://github.com/Tencent/cherry-markdown/commit/681857f749e059290025e6bfd58fa37618473a4c))
- 增加 draw.io 示例里的图形种类 ([2aba33b](https://github.com/Tencent/cherry-markdown/commit/2aba33ba68d77e381edb33f78bf54344a45f9402))

### Bug Fixes

- [#395](https://github.com/Tencent/cherry-markdown/issues/395) 尝试无脑修复，需要 humyfred 确认 ([1f30506](https://github.com/Tencent/cherry-markdown/commit/1f305062f753355ee579ae42e946aba3f950f57d))
- 代码块逆解析成代码块语法时有多余的中括号产生 [#414](https://github.com/Tencent/cherry-markdown/issues/414) ([76acd94](https://github.com/Tencent/cherry-markdown/commit/76acd94450de761878832f06dcfbe89c3798c653))
- 非双栏模式，或者从双栏模式切换到单栏模式时，需要去掉高亮光标对应预览区域的机制 ([6cb9821](https://github.com/Tencent/cherry-markdown/commit/6cb98216264a61034be5c68e1fe1f32703889328))
- 删除多余逻辑 ([668993b](https://github.com/Tencent/cherry-markdown/commit/668993b7310fdd0485e517a77eec9b97c124a1d5))

### [0.8.17](https://github.com/Tencent/cherry-markdown/compare/v0.8.16...v0.8.17) (2023-03-27)

### Features

- 对正在编辑的区域进行高亮 ([#413](https://github.com/Tencent/cherry-markdown/issues/413)) ([bac8173](https://github.com/Tencent/cherry-markdown/commit/bac8173dbad26c159bb179b7db18676e7c5614b4))
- 图片语法增加花括号扩展能力 ([44d8063](https://github.com/Tencent/cherry-markdown/commit/44d806355db28afe067c1c21041058673d9c1bd5))
- 增加插入 draw.io 功能；增加编辑 draw.io 机制；\n fix: 修复编辑图片尺寸时有可能受代码块语法影响的问题 ([e326b86](https://github.com/Tencent/cherry-markdown/commit/e326b86ddd85b680c34a5ca071a9d735a22c6148))

### Bug Fixes

- 代码块逆解析成代码块语法时有多余的中括号产生 [#414](https://github.com/Tencent/cherry-markdown/issues/414) ([76acd94](https://github.com/Tencent/cherry-markdown/commit/76acd94450de761878832f06dcfbe89c3798c653))

### [0.8.16](https://github.com/Tencent/cherry-markdown/compare/v0.8.15...v0.8.16) (2023-03-13)

### Features

- 修改信息面板和手风琴语法 ([a7e1f96](https://github.com/Tencent/cherry-markdown/commit/a7e1f960944954c3d0b148b41f308988f0935289))

### Bug Fixes

- 改正了一处 typo，并且修复了子菜单关闭逻辑的 bug ([#410](https://github.com/Tencent/cherry-markdown/issues/410)) ([6ce02cf](https://github.com/Tencent/cherry-markdown/commit/6ce02cf1e2e0de7872a7b7fce5a85cdc6a376338))
- 将之前的更新适配至 electron 客户端 ([#405](https://github.com/Tencent/cherry-markdown/issues/405)) ([d8774c6](https://github.com/Tencent/cherry-markdown/commit/d8774c652b4274ccb110e02603972cdac76e3048))

### [0.8.15](https://github.com/Tencent/cherry-markdown/compare/v0.8.14...v0.8.15) (2023-03-06)

### Features

- 客户端增加关闭提醒和导出 markdown/HTML 文件功能 ([#399](https://github.com/Tencent/cherry-markdown/issues/399)) ([520eb00](https://github.com/Tencent/cherry-markdown/commit/520eb001e476c4ded2c25378ffc0d715da11f82f))
- 优化信息面板标题的背景色值 ([318740e](https://github.com/Tencent/cherry-markdown/commit/318740e5859b75f34efa1e176d192c8d9e25edfd))
- 增加手风琴语法和对应的按钮；fix: 修复换行、列表语法占位符没有行号信息的问题 ([e21cc35](https://github.com/Tencent/cherry-markdown/commit/e21cc35f180aaffafd2c86d08266f33f485bfad3))
- 增加信息面板语法和对应的按钮 ([fc7bc1f](https://github.com/Tencent/cherry-markdown/commit/fc7bc1f536022750971563cf7a99e27f77cb629e))

### Bug Fixes

- [#396](https://github.com/Tencent/cherry-markdown/issues/396) ([07ebfd5](https://github.com/Tencent/cherry-markdown/commit/07ebfd55edb12b93f1e6f50385bf89d2a16f864b))
- 修复翻译 ([4be5d37](https://github.com/Tencent/cherry-markdown/commit/4be5d37d8d7fe121a37dfb4cc64bf73fc9ab9b9e))

### [0.8.14](https://github.com/Tencent/cherry-markdown/compare/v0.8.13...v0.8.14) (2023-02-21)

### Bug Fixes

- 临时解决超链接和斜体语法冲突的问题，最终解决方案应该是 AutoLink 语法实现排他 ([9d23c56](https://github.com/Tencent/cherry-markdown/commit/9d23c565d682535b14d9bfbae3cefa35012b0b86))

### [0.8.13](https://github.com/Tencent/cherry-markdown/compare/v0.8.12...v0.8.13) (2023-02-17)

### Features

- (hooks) 自动超链接-支持展示固定长度字符 ([#391](https://github.com/Tencent/cherry-markdown/issues/391)) ([69056e4](https://github.com/Tencent/cherry-markdown/commit/69056e4ad9490bb09c1350b4f39a4d5b4e96e6fe))
- 丰富图标，优化侧边栏切换主题按钮的下拉框定位 ([d17d0fe](https://github.com/Tencent/cherry-markdown/commit/d17d0fee634fd0ced49c3102d3b372fda61e0542))
- 丰富图标，优化侧边栏切换主题按钮的下拉框定位 ([452ae1f](https://github.com/Tencent/cherry-markdown/commit/452ae1fd63a052efde307b689f61e14b291984ed))
- 增加 vscode plugin，可以在 vscode 扩展中输入 cherry-markdown 搜索安装该插件 ([61be297](https://github.com/Tencent/cherry-markdown/commit/61be29709f7b1c4cbc107c00e3ed5711d3b67554))

### Bug Fixes

- [#388](https://github.com/Tencent/cherry-markdown/issues/388) 修复复制粘贴图片时，图片 alt 属性丢失的问题 ([21a505a](https://github.com/Tencent/cherry-markdown/commit/21a505af9a772307183e9ea54338cbfec8850943))
- unity header anchor safe id ([d28c488](https://github.com/Tencent/cherry-markdown/commit/d28c4883dd0c215726ec4e5f41914026b6a94104))
- 复制粘贴代码块的时候会丢失\t ([a1179c5](https://github.com/Tencent/cherry-markdown/commit/a1179c5004c8e58efe243418217e9b764419846b))

### [0.8.12](https://github.com/Tencent/cherry-markdown/compare/v0.8.11...v0.8.12) (2023-01-13)

### Features

- [#379](https://github.com/Tencent/cherry-markdown/issues/379) 通过引入第三方组件 cm-search-replace 实现左侧编辑器搜索、替换功能 ([3b7d17d](https://github.com/Tencent/cherry-markdown/commit/3b7d17dce78a0f736b011f5c1cd02a4a96156c58))

### Bug Fixes

- [#374](https://github.com/Tencent/cherry-markdown/issues/374) 光标处于编辑区域最低部时，预览区域滚动到了顶部 ([cfdfd0d](https://github.com/Tencent/cherry-markdown/commit/cfdfd0dcec1f9071bb797a2980a8c1f33615b17c))
- [#380](https://github.com/Tencent/cherry-markdown/issues/380) 修复粘贴时转义&的问题，同时修复粘贴 table 时出现过多换行的问题\n feat: 当表格 thead 为空的时候，不再渲染<thead> ([266a5f1](https://github.com/Tencent/cherry-markdown/commit/266a5f1716810f2b75348a8ecf3a38c15b510743))

### [0.8.11](https://github.com/Tencent/cherry-markdown/compare/v0.8.10...v0.8.11) (2022-12-28)

### Bug Fixes

- **insert:** Fix insert code instruction failure ([#373](https://github.com/Tencent/cherry-markdown/issues/373)) ([a1b3914](https://github.com/Tencent/cherry-markdown/commit/a1b39142d90861964c9b25f04f76dd38b99f50a0))

### [0.8.10](https://github.com/Tencent/cherry-markdown/compare/v0.8.9...v0.8.10) (2022-12-21)

### Features

- [#370](https://github.com/Tencent/cherry-markdown/issues/370) 增加 refreshPreviewer 方法，可以强制重新渲染预览区域 ([c347640](https://github.com/Tencent/cherry-markdown/commit/c3476407f5dd12ae85cd0069c18b44d0c09fbe12))

### Bug Fixes

- 跨单元格的行内公式、行内代码语法改成不生效 ([178a6ac](https://github.com/Tencent/cherry-markdown/commit/178a6acddd38c17ec109a194139bba175428a64b))

### [0.8.9](https://github.com/Tencent/cherry-markdown/compare/v0.8.8...v0.8.9) (2022-11-29)

### Features

- delete unnecessary observer to adapt old version browers ([869963c](https://github.com/Tencent/cherry-markdown/commit/869963cfe58a082604a9bd6b7ec9e19d27114e68))
- localisation support ([7ca12b7](https://github.com/Tencent/cherry-markdown/commit/7ca12b7e2de2d79ee5bf8ac6524277f2a76701bf)), closes [#217](https://github.com/Tencent/cherry-markdown/issues/217)
- 增加有序列表、无序列表按钮 ([f52ff42](https://github.com/Tencent/cherry-markdown/commit/f52ff427d752c44855e8a3c57bf3b030de7eee34))

### Bug Fixes

- [#357](https://github.com/Tencent/cherry-markdown/issues/357) 优化 z-index 的取值 ([729b404](https://github.com/Tencent/cherry-markdown/commit/729b404386c72005bb028a4e6d209cabfb1b0669))
- [#358](https://github.com/Tencent/cherry-markdown/issues/358) ([56ceedc](https://github.com/Tencent/cherry-markdown/commit/56ceedc498d256af89a265adb84a8c1efd27a3bd))
- issue 350 ([ebce611](https://github.com/Tencent/cherry-markdown/commit/ebce6111ee6fec87434478be6eacd2d5880825b2))
- 修复无浏览器模式报错 [#353](https://github.com/Tencent/cherry-markdown/issues/353) ([5571a4f](https://github.com/Tencent/cherry-markdown/commit/5571a4ff49e03338d8efdf38d4b6ce1d899185d4))

### [0.8.8](https://github.com/Tencent/cherry-markdown/compare/v0.8.6...v0.8.8) (2022-11-08)

### Features

- support more code highlight ([#347](https://github.com/Tencent/cherry-markdown/issues/347)) ([a37c0ac](https://github.com/Tencent/cherry-markdown/commit/a37c0ac13289757f5419d3fd611702d68ff465b1))
- support protobuf code highlight ([ddfd8f6](https://github.com/Tencent/cherry-markdown/commit/ddfd8f6769b1f0f1616613dc2a6d109343b1cfd5))
- 增加切换主题的功能，本次提交实现了切换主题、记忆主题功能 ([c4eeb34](https://github.com/Tencent/cherry-markdown/commit/c4eeb3492302a8a862704ceca36051d00222ec05))
- 增加四个默认的主题 ([d068772](https://github.com/Tencent/cherry-markdown/commit/d0687722fced763dadf39e1013f1ae102376c286))

### Bug Fixes

- **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([e55673f](https://github.com/Tencent/cherry-markdown/commit/e55673f720dfce0c32a134afb25c86f6a1276a61))
- **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([4596b4a](https://github.com/Tencent/cherry-markdown/commit/4596b4a5d4f1bdfc6177c4d1b5a260174e9270dc))
- 优化拖拽时插入的位置 [#338](https://github.com/Tencent/cherry-markdown/issues/338) ([d7269fb](https://github.com/Tencent/cherry-markdown/commit/d7269fb5470bcd12d98efb78577fd076f8f02cc9))
- 修复设置换行模式的时候有报错，增加换行模式本地记忆功能 [#339](https://github.com/Tencent/cherry-markdown/issues/339) ([3facef0](https://github.com/Tencent/cherry-markdown/commit/3facef025f3585879cfd3014712fc74db1307039))
- 复制代码快功能不再受 preview bubble 控制 [#337](https://github.com/Tencent/cherry-markdown/issues/337) (同时增加图片懒加载的注释) ([4dbabd0](https://github.com/Tencent/cherry-markdown/commit/4dbabd01ddb0a6d4127cc780a9411a3957ef85db))
- 粘贴企业微信内容时编辑器有报错 [#336](https://github.com/Tencent/cherry-markdown/issues/336) ([d333504](https://github.com/Tencent/cherry-markdown/commit/d33350407279eab4218c52ae3cb75d0d96872002))

### [0.8.7](https://github.com/Tencent/cherry-markdown/compare/v0.8.6...v0.8.7) (2022-11-08)

### Features

- support more code highlight ([#347](https://github.com/Tencent/cherry-markdown/issues/347)) ([a37c0ac](https://github.com/Tencent/cherry-markdown/commit/a37c0ac13289757f5419d3fd611702d68ff465b1))
- support protobuf code highlight ([ddfd8f6](https://github.com/Tencent/cherry-markdown/commit/ddfd8f6769b1f0f1616613dc2a6d109343b1cfd5))
- 增加切换主题的功能，本次提交实现了切换主题、记忆主题功能 ([c4eeb34](https://github.com/Tencent/cherry-markdown/commit/c4eeb3492302a8a862704ceca36051d00222ec05))
- 增加四个默认的主题 ([d068772](https://github.com/Tencent/cherry-markdown/commit/d0687722fced763dadf39e1013f1ae102376c286))

### Bug Fixes

- **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([e55673f](https://github.com/Tencent/cherry-markdown/commit/e55673f720dfce0c32a134afb25c86f6a1276a61))
- **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([4596b4a](https://github.com/Tencent/cherry-markdown/commit/4596b4a5d4f1bdfc6177c4d1b5a260174e9270dc))
- 优化拖拽时插入的位置 [#338](https://github.com/Tencent/cherry-markdown/issues/338) ([d7269fb](https://github.com/Tencent/cherry-markdown/commit/d7269fb5470bcd12d98efb78577fd076f8f02cc9))
- 修复设置换行模式的时候有报错，增加换行模式本地记忆功能 [#339](https://github.com/Tencent/cherry-markdown/issues/339) ([3facef0](https://github.com/Tencent/cherry-markdown/commit/3facef025f3585879cfd3014712fc74db1307039))
- 复制代码快功能不再受 preview bubble 控制 [#337](https://github.com/Tencent/cherry-markdown/issues/337) (同时增加图片懒加载的注释) ([4dbabd0](https://github.com/Tencent/cherry-markdown/commit/4dbabd01ddb0a6d4127cc780a9411a3957ef85db))
- 粘贴企业微信内容时编辑器有报错 [#336](https://github.com/Tencent/cherry-markdown/issues/336) ([d333504](https://github.com/Tencent/cherry-markdown/commit/d33350407279eab4218c52ae3cb75d0d96872002))

### [0.8.6](https://github.com/Tencent/cherry-markdown/compare/v0.8.5...v0.8.6) (2022-10-28)

### Bug Fixes

- use appendChild instead of append to adapt chrome version 53 and lower ([a21925a](https://github.com/Tencent/cherry-markdown/commit/a21925a4267cf67c5acb003a44106d8523abbd75))

### [0.8.5](https://github.com/Tencent/cherry-markdown/compare/v0.8.4...v0.8.5) (2022-10-21)

### Features

- transform header id to avoid being sanitized ([#324](https://github.com/Tencent/cherry-markdown/issues/324)) ([44935d9](https://github.com/Tencent/cherry-markdown/commit/44935d97ab87e1fb594d3e9337c1c325d5658bd1))
- 增加上传文件格式限制，优化上传文件回调逻辑，增加视频封面功能 [#328](https://github.com/Tencent/cherry-markdown/issues/328) ([dbf8788](https://github.com/Tencent/cherry-markdown/commit/dbf87885f0272a6edc24f69cf10bdf0adb5d6af9))

### Bug Fixes

- [#321](https://github.com/Tencent/cherry-markdown/issues/321) merge from [@ufec](https://github.com/ufec) ([90fb48e](https://github.com/Tencent/cherry-markdown/commit/90fb48e1fa4491cb89634ddaf23a05a18f534846))
- [#325](https://github.com/Tencent/cherry-markdown/issues/325) 连续字号时出现间隔识别的情况 ([0fb533c](https://github.com/Tencent/cherry-markdown/commit/0fb533c2411dcf87e69d954b1680f638d250f493))
- update babel-jest version to solve conflict in node 16 ([ad4dbd5](https://github.com/Tencent/cherry-markdown/commit/ad4dbd5e3ffa4bcbe3a5f0c630da5e9ee1f8c77f))
- 修复目录不展示的问题 ([8308b5c](https://github.com/Tencent/cherry-markdown/commit/8308b5c1541197fc5dc76c215b13f7e7deea490f))

### [0.8.4](https://github.com/Tencent/cherry-markdown/compare/v0.8.3...v0.8.4) (2022-10-13)

### [0.8.3](https://github.com/Tencent/cherry-markdown/compare/v0.8.2...v0.8.3) (2022-10-13)

### Bug Fixes

- **husky:** init husky in prepare instead of postinstall ([37ada7d](https://github.com/Tencent/cherry-markdown/commit/37ada7d8ed8cdda8126548c245620e40760f03ec))

### [0.8.2](https://github.com/Tencent/cherry-markdown/compare/v0.8.1...v0.8.2) (2022-09-16)

### Features

- 丰富快捷键 ([07f30c9](https://github.com/Tencent/cherry-markdown/commit/07f30c9b93a51456856e8d998b932cd09723c194)), closes [#319](https://github.com/Tencent/cherry-markdown/issues/319)

### Bug Fixes

- 懒加载机制没有考虑预览区域完全撑开的情况 ([a35ce1b](https://github.com/Tencent/cherry-markdown/commit/a35ce1b552205f85da0e29342c021c9ada813d28))
- 修复懒加载时占位图没有展示的问题 ([3dd20fe](https://github.com/Tencent/cherry-markdown/commit/3dd20feb97798e4180107a55ac5b038e4f87ce39))
- 自定义菜单有问题，修复并增加例子 [#317](https://github.com/Tencent/cherry-markdown/issues/317) [#315](https://github.com/Tencent/cherry-markdown/issues/315) ([09ccd30](https://github.com/Tencent/cherry-markdown/commit/09ccd30072cc55d7e27341d3c44c6ece449b32fb))

### [0.8.1](https://github.com/Tencent/cherry-markdown/compare/v0.8.0...v0.8.1) (2022-09-06)

### Bug Fixes

- 懒加载逻辑不能幂等 ([a2198cb](https://github.com/Tencent/cherry-markdown/commit/a2198cb9f6b0ecb720be3e2c26a4385e9b49e7d7))

## [0.8.0](https://github.com/Tencent/cherry-markdown/compare/v0.7.9...v0.8.0) (2022-09-01)

### Features

- 实现快捷键显示/隐藏 toolbar [#268](https://github.com/Tencent/cherry-markdown/issues/268) ([10cce7d](https://github.com/Tencent/cherry-markdown/commit/10cce7defa5d07420fa5849a970b3ac0bc594a2a))
- 通过快捷键来实现显示|隐藏 toolbar 或 设置按钮子菜单隐藏 toolbar [#268](https://github.com/Tencent/cherry-markdown/issues/268) ([8c05a87](https://github.com/Tencent/cherry-markdown/commit/8c05a87a22f78b11ce7a50951e35b5e203123783))
- 优化字体大小按钮的选区，并增加快捷键 ([901db75](https://github.com/Tencent/cherry-markdown/commit/901db75b5e058322f26a66c6163616348af5f421))
- 优化 toolbar 插入内容时的选区逻辑 ([3b02d07](https://github.com/Tencent/cherry-markdown/commit/3b02d07dca4c562426787e77206397a073550d88))

### Bug Fixes

- [#301](https://github.com/Tencent/cherry-markdown/issues/301) ([#302](https://github.com/Tencent/cherry-markdown/issues/302)) ([f8bae8b](https://github.com/Tencent/cherry-markdown/commit/f8bae8bdb5fa5c981ee280f81e487f5de2a81ac0))
- 暗黑模式下调色盘文字看不清楚 ([fef4aba](https://github.com/Tencent/cherry-markdown/commit/fef4aba6c54cb6dfb95d53a75f2b4e4f636810fb))
- 无法使用 Ctrl+Shift 组合键 [#290](https://github.com/Tencent/cherry-markdown/issues/290) ([e07e9ac](https://github.com/Tencent/cherry-markdown/commit/e07e9acb0648333b292f97bde9ccc1afbd5b8679))
- Cannot read properties of undefined (reading 'createBtn') [#303](https://github.com/Tencent/cherry-markdown/issues/303) ([#304](https://github.com/Tencent/cherry-markdown/issues/304)) ([1fc3689](https://github.com/Tencent/cherry-markdown/commit/1fc3689c8ef9b95fb16ec8ef216deb9a462d6d3f))
- lint err Expected '!==' and instead saw '!=' ([90a410b](https://github.com/Tencent/cherry-markdown/commit/90a410bef5810b1814d3728d02652d0dc945c7a9))

### [0.7.9](https://github.com/Tencent/cherry-markdown/compare/v0.7.8...v0.7.9) (2022-08-12)

### Bug Fixes

- **imageLazyLoad:** 修复懒加载开关配置 ([01543f8](https://github.com/Tencent/cherry-markdown/commit/01543f8b51cdb217694efd6f7d0386e8f37add4c))

### Css or Code Change

- remove ambiguous css reset ([e159254](https://github.com/Tencent/cherry-markdown/commit/e159254333f4923f450ae36499d8024931b1e7b8))

### [0.7.8](https://github.com/Tencent/cherry-markdown/compare/v0.7.7...v0.7.8) (2022-08-04)

### Bug Fixes

- install husky when dev only ([#289](https://github.com/Tencent/cherry-markdown/issues/289)) ([51d864c](https://github.com/Tencent/cherry-markdown/commit/51d864cda43df0b41f371eef6868f37432035ac1))

### [0.7.7](https://github.com/Tencent/cherry-markdown/compare/v0.7.6...v0.7.7) (2022-08-04)

### Features

- add ruby syntax ([710d65b](https://github.com/Tencent/cherry-markdown/commit/710d65b5f280df2aa67b3d4def8b8bcc920d2672))
- **eslint:** setup husky and lint-staged ([487ec2d](https://github.com/Tencent/cherry-markdown/commit/487ec2d9e0bf2e7eed6b077a8d66b6f51ba92986))
- support data-cm-atomic for dom plugins ([01d51a3](https://github.com/Tencent/cherry-markdown/commit/01d51a30b0c0172283835712267d53a3b4168a90))
- update sidebar style ([70d5260](https://github.com/Tencent/cherry-markdown/commit/70d5260d508d9d73ba76c863cbd879f086dd1f19))
- 增加 ruby 语法（拼音语法）的 toolbar 和 demo ([297ef97](https://github.com/Tencent/cherry-markdown/commit/297ef978c036812a31cb54fa33e68933cc1ba638))
- 增加新的图片懒加载机制 ([735b9cc](https://github.com/Tencent/cherry-markdown/commit/735b9cccbf4e453c3ccd06ecdefb68f7d03bb2ed))

### Bug Fixes

- vdom 的 style 写法有误导致每次都会重建元素 ([3ba6f36](https://github.com/Tencent/cherry-markdown/commit/3ba6f36071fe2cf93a0c2c17030a9ea9041e7726))
- 编辑时更新预览时，DOM 若存在相邻的 TextNode 会导致文字渲染两次 ([4256eb4](https://github.com/Tencent/cherry-markdown/commit/4256eb484a50b5e312acc7579e20c1648c1eadfa))

### [0.7.6](https://github.com/Tencent/cherry-markdown/compare/v0.7.5...v0.7.6) (2022-07-11)

### Features

- 代码块增加复制功能 ([ac48904](https://github.com/Tencent/cherry-markdown/commit/ac48904fbd0fef929b39f40a93b1c610bef65adf)), closes [#239](https://github.com/Tencent/cherry-markdown/issues/239)
- 代码块增加复制功能 ([856b5fd](https://github.com/Tencent/cherry-markdown/commit/856b5fd0346cff0bbb124659b78737fcd0f67927)), closes [#239](https://github.com/Tencent/cherry-markdown/issues/239)
- 代码块增加复制功能 更换复制到剪贴板的方法 ([ac38a7f](https://github.com/Tencent/cherry-markdown/commit/ac38a7f7a59de360aceefb07fe43f47185a219cb))
- 代码块增加复制功能 更换复制到剪贴板的方法 ([0b28b05](https://github.com/Tencent/cherry-markdown/commit/0b28b05a7f54f6e15b784669e33dc4718d95be41))
- 没有选中文字的时候点击工具栏会自动选中光标附近的文字或行 ([61ed011](https://github.com/Tencent/cherry-markdown/commit/61ed01140f3ea78f402e2adb96cc28e416fe2eeb)), closes [#261](https://github.com/Tencent/cherry-markdown/issues/261)
- 增加图片样式（边框、阴影、圆角） ([01775bd](https://github.com/Tencent/cherry-markdown/commit/01775bdd902932a3f148ca6b68d3144070f9722b)), closes [#264](https://github.com/Tencent/cherry-markdown/issues/264)
- border support for image ([6df8fdc](https://github.com/Tencent/cherry-markdown/commit/6df8fdc80ac7924a36a4b0cac4ff7c8daf507a45))

### Bug Fixes

- 修复可能的报错 ([43e4e90](https://github.com/Tencent/cherry-markdown/commit/43e4e901e35299f98f99089dbe47c300b0351547))
- Link hook 对 url 进行排他处理 ([767bc80](https://github.com/Tencent/cherry-markdown/commit/767bc803255df047d211d0710586c570af52ae13))

### [0.7.5](https://github.com/Tencent/cherry-markdown/compare/v0.7.4...v0.7.5) (2022-07-01)

### Features

- 把二级菜单里的 toolbar 开放出来([#199](https://github.com/Tencent/cherry-markdown/issues/199)） ([95a3e09](https://github.com/Tencent/cherry-markdown/commit/95a3e09b36dee371067e9ab89298f0cd47a464cd))
- 暴露预览区域图片点击事件的回调 ([34725a8](https://github.com/Tencent/cherry-markdown/commit/34725a868261615d226812c66461cbf33961521c))
- 暴露预览区域图片点击事件的回调 ([203ff13](https://github.com/Tencent/cherry-markdown/commit/203ff13422bdcec2ccfb925107dc83dadc5767f7))
- **emphasis:** add chinese punctuations as word's boundary ([6d8a769](https://github.com/Tencent/cherry-markdown/commit/6d8a769e45e08b8a43cc11b8b282afacd0cad834))
- support configure plantuml args ([ec97968](https://github.com/Tencent/cherry-markdown/commit/ec979681edb134ac84c31c6ec6c9705700fbb64d))

### Code Refactoring

- **build/addons:** use rollup to generate addon bundles ([86a5705](https://github.com/Tencent/cherry-markdown/commit/86a57052e702649b2de3f8ce8bc7fb311dbcdd8f))

### [0.7.4](https://github.com/Tencent/cherry-markdown/compare/v0.7.3...v0.7.4) (2022-06-07)

### Bug Fixes

- 删除线配置失效，顺便优化注释 ([b819667](https://github.com/Tencent/cherry-markdown/commit/b819667cd908ef89e1f5f7daf8cf974d0a4addf8))
- 只读模式下出现了两个问题(1、只读模式下宽度变成 50%了；2、只读模式下可以编辑图片尺寸) ([ff46352](https://github.com/Tencent/cherry-markdown/commit/ff46352d2709af3bf5784f9ea8812bf8d0c9d614)), closes [#246](https://github.com/Tencent/cherry-markdown/issues/246)

### [0.7.3](https://github.com/Tencent/cherry-markdown/compare/v0.7.2...v0.7.3) (2022-05-26)

### [0.7.1](https://github.com/Tencent/cherry-markdown/compare/v0.7.0...v0.7.1) (2022-05-10)

### Features

- **toolbar:** add quote hook & optimize quote level implementation ([2416e93](https://github.com/Tencent/cherry-markdown/commit/2416e93b2c87c591193640bceabeec42308976dc))
- 插入有序列表的时候，序号自增 [#160](https://github.com/Tencent/cherry-markdown/issues/160) ([b49d47a](https://github.com/Tencent/cherry-markdown/commit/b49d47ad41f06bad0612444a9b6733f8292c3840))

### Bug Fixes

- **checklist:** illegal inline checklist ([#200](https://github.com/Tencent/cherry-markdown/issues/200)) ([f3fa79a](https://github.com/Tencent/cherry-markdown/commit/f3fa79a6ff7fee6d05a36f80de187ad8eb154feb))
- **code-block:** fix [#166](https://github.com/Tencent/cherry-markdown/issues/166) parse hr and indent code ([#205](https://github.com/Tencent/cherry-markdown/issues/205)) ([8320f5b](https://github.com/Tencent/cherry-markdown/commit/8320f5bf3021d42197e200f8981015093057f6d3))
- **comment-reference:** fix npe problem when there is a comment reference at the beginning of the document ([b97fc8f](https://github.com/Tencent/cherry-markdown/commit/b97fc8f77902f4a3f977a9b9ca9c751c7c062c2a))
- update blockquote regex to split list ([8b86eb3](https://github.com/Tencent/cherry-markdown/commit/8b86eb36efdaad95fc2737e2824034776b756ea1)), closes [#165](https://github.com/Tencent/cherry-markdown/issues/165)
- update list type regex to avoid content lost ([#196](https://github.com/Tencent/cherry-markdown/issues/196)) ([017dc43](https://github.com/Tencent/cherry-markdown/commit/017dc43faa1f297433e6310e2a259d696223fb35)), closes [#194](https://github.com/Tencent/cherry-markdown/issues/194)
- 修复批量拖拽上传文件没回调就插入内容的 bug ([20d6ddf](https://github.com/Tencent/cherry-markdown/commit/20d6ddfa1f4e53aa8e06774f019aba4b90627dc4))
- 修复缩进代码块行号计算不准的问题 ([fe129b0](https://github.com/Tencent/cherry-markdown/commit/fe129b0ca70209f916e4d89f448036f8e10327ee))
- 最小高度调整 [#207](https://github.com/Tencent/cherry-markdown/issues/207) ([58a090b](https://github.com/Tencent/cherry-markdown/commit/58a090b390106d0d16f9155b1cd31aac00ac45b3))
- 增加使用 el 初始化编辑器的能力 [#203](https://github.com/Tencent/cherry-markdown/issues/203) ([e48d8e8](https://github.com/Tencent/cherry-markdown/commit/e48d8e8ed4ae1030f312d8b947f6cfa4005d25fe))
- 通过工具栏插入内容时，默认选中被插入的内容 [#206](https://github.com/Tencent/cherry-markdown/issues/206) ([678f695](https://github.com/Tencent/cherry-markdown/commit/678f69576074b21faeeb1c8a741ad3b63901f7e3))

## [0.7.0](https://github.com/Tencent/cherry-markdown/compare/v0.6.12...v0.7.0) (2022-04-12)

### Features

- add table wysiwyg v1.0 ([#189](https://github.com/Tencent/cherry-markdown/issues/189)) ([39a5a9e](https://github.com/Tencent/cherry-markdown/commit/39a5a9e68583d59291621f19f66a9424001a9f2a))
- update unit test ([#188](https://github.com/Tencent/cherry-markdown/issues/188)) ([50d2218](https://github.com/Tencent/cherry-markdown/commit/50d22182d70f533459b2d1a0fdc67cf696ceefbb))
- 增加表格编辑文档 ([46accca](https://github.com/Tencent/cherry-markdown/commit/46acccaee6bca431dade29dd151d7a45991380fc))

### Bug Fixes

- **code-block:** fix language matching regex ([4fa3b43](https://github.com/Tencent/cherry-markdown/commit/4fa3b43fbac75ac93e5e021ceb945c4801060eeb)), closes [#90](https://github.com/Tencent/cherry-markdown/issues/90)
- **link:** add bracket match check ([2bf3fa8](https://github.com/Tencent/cherry-markdown/commit/2bf3fa86acccf2757553104bdfbdec3f46b9a36f))
- **suggester:** fix keydown 'enter' affect the default logic of newlineAndIndentContinueMarkdownList ([#190](https://github.com/Tencent/cherry-markdown/issues/190)) ([ed0a5dd](https://github.com/Tencent/cherry-markdown/commit/ed0a5ddacec41fa596671002afa6909aa45fc8b8))

### [0.6.12](https://github.com/Tencent/cherry-markdown/compare/v0.6.11...v0.6.12) (2022-03-23)

### Bug Fixes

- **list:** use list start number ([d93b242](https://github.com/Tencent/cherry-markdown/commit/d93b24203e4881135a340a20aa590ea5d7606be2))

### [0.6.11](https://github.com/Tencent/cherry-markdown/compare/v0.6.10...v0.6.11) (2022-03-17)

### Bug Fixes

- replace lookbehind in math regex ([4dc2a7e](https://github.com/Tencent/cherry-markdown/commit/4dc2a7ee9bbed0da99d270e360c45614a35a543a))

### [0.6.10](https://github.com/Tencent/cherry-markdown/compare/v0.6.9...v0.6.10) (2022-03-17)

### [0.6.9](https://github.com/Tencent/cherry-markdown/compare/v0.6.8...v0.6.9) (2022-03-14)

### Bug Fixes

- **table-head:** fix th content not rendering ([98ce938](https://github.com/Tencent/cherry-markdown/commit/98ce938af72a71c9be6a9dfade4c2c5870b2aa4a))

### [0.6.8](https://github.com/Tencent/cherry-markdown/compare/v0.6.7...v0.6.8) (2022-02-28)

### Features

- add commonmark test suites ([ef2c950](https://github.com/Tencent/cherry-markdown/commit/ef2c950f03cbc391018fd57655d8413bb37aa780))
- add commonmark test suites ([c2e0c56](https://github.com/Tencent/cherry-markdown/commit/c2e0c56acdc2b19a52b623d6ba9fe352013063b4))
- add commonmark test suites ([44287e3](https://github.com/Tencent/cherry-markdown/commit/44287e3b39adea318c9a1832467811c61b77ded4))
- improve content cache for paragraph ([a7661d7](https://github.com/Tencent/cherry-markdown/commit/a7661d70fa65f0749758abe60ed128bd4f6568bb))

### Bug Fixes

- eslint fix & list test case fix ([2b8cb1a](https://github.com/Tencent/cherry-markdown/commit/2b8cb1a55d5922cd4c2396061a558aa9b68fd3e3))

### [0.6.7](https://github.com/Tencent/cherry-markdown/compare/v0.6.6...v0.6.7) (2022-02-28)

### Features

- add code tag in indent code block ([f9f2aaa](https://github.com/Tencent/cherry-markdown/commit/f9f2aaaef4bac71b4ca8b919925ef03fbc4f520d))
- 增加拖拽上传功能; Fixed:[#36](https://github.com/Tencent/cherry-markdown/issues/36) ([#146](https://github.com/Tencent/cherry-markdown/issues/146)) ([74b100b](https://github.com/Tencent/cherry-markdown/commit/74b100b72a3e061652eaf6a3aa1ce21a6f3cbf3c))

### Bug Fixes

- add no-escape regex in math ([541b210](https://github.com/Tencent/cherry-markdown/commit/541b2100b88392faddb3f44ef313d69b85ccbece))
- **editor:** fix the compatibility issue of cjk ime ([#150](https://github.com/Tencent/cherry-markdown/issues/150)) ([05703a3](https://github.com/Tencent/cherry-markdown/commit/05703a3cb1221033713f1ab49892c828821b3b78)), closes [#82](https://github.com/Tencent/cherry-markdown/issues/82)
- refresh codemirror while toggling fullscreen ([a8ed1a4](https://github.com/Tencent/cherry-markdown/commit/a8ed1a4c5ff5ff7646622b64988666f60d8636f0))
- 修复代码块内嵌套缩进时出现占位字符的情况 ([999581e](https://github.com/Tencent/cherry-markdown/commit/999581ea20fe181cefad98efb9b185055e7c5e45))

### [0.6.6](https://github.com/Tencent/cherry-markdown/compare/v0.6.5...v0.6.6) (2022-02-18)

### Features

- optimize error output ([1282583](https://github.com/Tencent/cherry-markdown/commit/12825831fcf875f52f6b4f1a913d7be636d44429))

### Bug Fixes

- fix README content of engine mode. ([4388bfa](https://github.com/Tencent/cherry-markdown/commit/4388bfaea60857faf515be6ee3606761f2455eaf))
- **list:** adapt list cases to avoid array out of boundary ([4061e50](https://github.com/Tencent/cherry-markdown/commit/4061e50c2a56eb38e5345f17bc5139a3a7bd3654))

### [0.6.5](https://github.com/Tencent/cherry-markdown/compare/v0.6.4...v0.6.5) (2022-01-24)

### Features

- optimize error output ([ed7323c](https://github.com/Tencent/cherry-markdown/commit/ed7323c798d8daf98589d3d79d37fbdd08ff2e98))

### Bug Fixes

- **list:** adapt list cases to avoid array out of boundary ([4c5a23c](https://github.com/Tencent/cherry-markdown/commit/4c5a23c72f50ee0cc2fc1589681e9f47c91a459c))
- **ts file:** fix ts file couldn't submit ([6ab75b3](https://github.com/Tencent/cherry-markdown/commit/6ab75b36ad48ff4b4273172d39fcdcef04ab04f1))

### Performance Improvements

- **image:** fix poor performance when referencing data-url images ([37ac086](https://github.com/Tencent/cherry-markdown/commit/37ac0861ffeee052e8f1ba1dbef720b663dcb2db))

### Css or Code Change

- lint ([f4e156f](https://github.com/Tencent/cherry-markdown/commit/f4e156ffa2f9495b77d22e12ce4720ce2c310bdd))

### [0.6.4](https://github.com/Tencent/cherry-markdown/compare/v0.6.3...v0.6.4) (2022-01-13)

### [0.6.3](https://github.com/Tencent/cherry-markdown/compare/v0.6.2...v0.6.3) (2022-01-12)

### Features

- add force append ([c97f65b](https://github.com/Tencent/cherry-markdown/commit/c97f65bf852f54a855030525a29fd7b025b5bef4))
- api:setValue() 更新内容时支持保持光标位置 ([#106](https://github.com/Tencent/cherry-markdown/issues/106)) ([fa346c8](https://github.com/Tencent/cherry-markdown/commit/fa346c8e5710a0725b8755d74e44b6f79f0a95ea))

### Bug Fixes

- **Image:** encode poster url ([e73403d](https://github.com/Tencent/cherry-markdown/commit/e73403d98b9172c490838b0829bb513189c9e983))
- **list:** avoid string collect error while building tree ([031a359](https://github.com/Tencent/cherry-markdown/commit/031a359f81e743c73ea65b803a8b8ed0579942f2))

### [0.6.2](https://github.com/Tencent/cherry-markdown/compare/v0.6.1...v0.6.2) (2022-01-10)

### Bug Fixes

- delay backslash tranform time ([8e32e73](https://github.com/Tencent/cherry-markdown/commit/8e32e739aef6be480360f77db0fe00b62f74cbfa))
- mathjax script duplicate with multiple cherry instances ([5ba3ddd](https://github.com/Tencent/cherry-markdown/commit/5ba3ddd0b42dd163ef5bb599577bb5bbba0b5e1f)), closes [#73](https://github.com/Tencent/cherry-markdown/issues/73)
- type error in mathjax ([a5e6820](https://github.com/Tencent/cherry-markdown/commit/a5e6820aa403ce7ec713bd69ac46a30ae3783ea2))
- fix usage of lookbehind support ([d9dc315](https://github.com/Tencent/cherry-markdown/commit/d9dc315473fbae385692f20adaf5e49cbefabca6))
- **lookbehind:** fix `replaceStringByBuffer` returns empty string when nothing to replace ([525a5ab](https://github.com/Tencent/cherry-markdown/commit/525a5ab6ba467830c42fe432faea59bb0eef47b2))
- **suggester:** adapt empty regex in safari ([a3027f7](https://github.com/Tencent/cherry-markdown/commit/a3027f784dd007293db6a7b07b3c9d5545e45f9e))
- **suggester:** add leadingChars ([a1fb8b1](https://github.com/Tencent/cherry-markdown/commit/a1fb8b13e28e5e5df34316c021e071bb2030254c))
- **suggester:** extract replacer from toHtml to avoid regex error in safari ([760449e](https://github.com/Tencent/cherry-markdown/commit/760449e9639524b03a77834208c8542333ab7d7a))
- **suggester:** suggester lookbehind regex support & fix list test case ([879a523](https://github.com/Tencent/cherry-markdown/commit/879a523256d1422cc4cf926ffc714408d5f91249))
- 0xA0 need to be treated as space ([75eee5b](https://github.com/Tencent/cherry-markdown/commit/75eee5bdb5ecab4ee5b6daaf923e985e2ec8dbb7)), closes [#83](https://github.com/Tencent/cherry-markdown/issues/83)
- use 0xa0 unicode instead ([ec9cbac](https://github.com/Tencent/cherry-markdown/commit/ec9cbac6d041ee103b0036101a17e274e8ff92fc)), closes [/github.com/Tencent/cherry-markdown/pull/84#discussion_r778531298](https://github.com/Tencent//github.com/Tencent/cherry-markdown/pull/84/issues/discussion_r778531298) [#84](https://github.com/Tencent/cherry-markdown/issues/84)

### Css or Code Change

- eslint fix ([6cb72fe](https://github.com/Tencent/cherry-markdown/commit/6cb72feb409c41392232543a3b1affecaaa30555))

### [0.6.1](https://github.com/Tencent/cherry-markdown/compare/v0.5.15...v0.6.1) (2021-12-30)

### Features

- 预览区域跟随编辑区域光标滚动 ([#72](https://github.com/Tencent/cherry-markdown/issues/72)) ([02c500b](https://github.com/Tencent/cherry-markdown/commit/02c500b24fe4ce4ad4772337e6665ac24c4dcc6f))
- **suggester:** add suggester function ([a8c35ed](https://github.com/Tencent/cherry-markdown/commit/a8c35ed9c03cb4c1eebfcb2afdc8722d16c251da))
- **suggester:** improve css ([4ab4bb6](https://github.com/Tencent/cherry-markdown/commit/4ab4bb6981747ed8fea7986b226df9c286e4888e))
- **suggester:** improve css code ([b333c71](https://github.com/Tencent/cherry-markdown/commit/b333c711ade436e1cf300707a88f419cff42e17b))
- add eslint jest plugin ([23bcbb3](https://github.com/Tencent/cherry-markdown/commit/23bcbb34fd4263075fdfa6e75c9702f8c0feea4e))
- add yarnrc & update dependencies ([ba8b5cd](https://github.com/Tencent/cherry-markdown/commit/ba8b5cdc5eb158d4052441e9351d6259de9a6892))
- init client project ([#53](https://github.com/Tencent/cherry-markdown/issues/53)) ([9f46acf](https://github.com/Tencent/cherry-markdown/commit/9f46acf009889bd7a8d77f4507e658f403023cc6))
- use jest for unit test ([0b15764](https://github.com/Tencent/cherry-markdown/commit/0b157645abd5564ec906ca1277287af9b1a79668))
- **sanitizer:** remove jsdom from browser builds & add new commonjs bundle for node env ([#62](https://github.com/Tencent/cherry-markdown/issues/62)) ([c61df0d](https://github.com/Tencent/cherry-markdown/commit/c61df0d14855cc88253545f57a686e990d067be3))

### Bug Fixes

- **list:** fix magic number ([34224a8](https://github.com/Tencent/cherry-markdown/commit/34224a8bd3e1aedab9168806f9e96e0bbad57983))
- **list:** support checklist && add test case ([f4d6a2a](https://github.com/Tencent/cherry-markdown/commit/f4d6a2acad817c11ed785f4a1704e3145db6684a))
- suggester 初始化判断有问题 ([cb22da6](https://github.com/Tencent/cherry-markdown/commit/cb22da6e252dfd216f49855a2966fa88198910ff))
- **custom-syntax:** revert get config from customSyntax & fix type error ([ebc5aee](https://github.com/Tencent/cherry-markdown/commit/ebc5aee4262d40f6755c759247515ddb66939225))

### Code Refactoring

- **list:** implement list with tree ([43ba79a](https://github.com/Tencent/cherry-markdown/commit/43ba79a09e948a499178bcfe9cb334efb378741e))

### [0.5.15](https://github.com/Tencent/cherry-markdown/compare/v0.5.14...v0.5.15) (2021-12-12)

### Features

- mocha support typescript & add list unit test ([a198733](https://github.com/Tencent/cherry-markdown/commit/a1987337df6aade66f137ac3700eb7c30fe9aa45))
- 在 cherry 上暴露导出接口，并修复导出没考虑多实例的情况 ([e21895b](https://github.com/Tencent/cherry-markdown/commit/e21895b096c564be03b4450fd27bc5fc44cad3d3))
- **Export:** export toolbar handler api ([#38](https://github.com/Tencent/cherry-markdown/issues/38)) ([360de5f](https://github.com/Tencent/cherry-markdown/commit/360de5f4d128a8bbaf619aadb9da8157592d2562))

### Bug Fixes

- fix cherry overflow & fix customHook could config params on the Cherry config ([#61](https://github.com/Tencent/cherry-markdown/issues/61)) ([1e24f12](https://github.com/Tencent/cherry-markdown/commit/1e24f127d88947206aa98835034246368c7ed04e))
- 连续多个音视频无法正确解析 ([74426b2](https://github.com/Tencent/cherry-markdown/commit/74426b20c33e114d2dad04788f4c8a8dfc46bbcf))
- 连续多个音视频无法正确解析 ([#34](https://github.com/Tencent/cherry-markdown/issues/34)) ([10008e9](https://github.com/Tencent/cherry-markdown/commit/10008e9bcf0396a462b1e1e90f16eb091041f11c))
- 列表内的行内语法污染了列表 Fixed [#40](https://github.com/Tencent/cherry-markdown/issues/40) ([#41](https://github.com/Tencent/cherry-markdown/issues/41)) ([d7546b8](https://github.com/Tencent/cherry-markdown/commit/d7546b8c24020a6ec731d645b5ebc7dd998e4a12))
- **api-demo:** basic config undefined ([#37](https://github.com/Tencent/cherry-markdown/issues/37)) ([f269eb3](https://github.com/Tencent/cherry-markdown/commit/f269eb38b4febcb2810174fdbb4300e60d30fb36))
- demo image's url ([2c933f1](https://github.com/Tencent/cherry-markdown/commit/2c933f1012b508c2c538e66e16cf3218ef089954))
- editor handleUpload has Invalid function parameter problem ([1f1d92e](https://github.com/Tencent/cherry-markdown/commit/1f1d92eb20062e20b53f8c2cee7e846bfcb60040))
- table's space and color picker's 'null' color Fixed [#30](https://github.com/Tencent/cherry-markdown/issues/30) ([244c190](https://github.com/Tencent/cherry-markdown/commit/244c1907e534ebcb6f959bb386183bfce4acfe74))
- use replaceLookBehind for bg、color、sub、sup ([0bd9229](https://github.com/Tencent/cherry-markdown/commit/0bd92295510edf12923933ff85a1bade7ea8cb9f))
- variable fix in demo scripts ([97bf5b5](https://github.com/Tencent/cherry-markdown/commit/97bf5b5ecb6a1941976553842ed9e84aa3f0b7cd))
- **toolbar:** init br button name by options ([174a4cd](https://github.com/Tencent/cherry-markdown/commit/174a4cd48c82b804d4c430e853a85557a1ca0b50))

### 0.5.13 (2021-10-27)

### Bug Fixes

- fix dependabot alerts ([54f4ab5](https://github.com/Tencent/cherry-markdown/commit/54f4ab599a6bf611966a66697e2e57a436431075))
- **menu:** avoid infinite loop in get shortcutKeys ([#2](https://github.com/Tencent/cherry-markdown/issues/2)) ([38d387c](https://github.com/Tencent/cherry-markdown/commit/38d387cde7bfbdf49bb8585c63b990ecc09a58e0))
- **plantuml:** use svg output to avoid font issue ([3bab59a](https://github.com/Tencent/cherry-markdown/commit/3bab59aa0fff88e58d381719d472a6f303f0af7a))
