# 配置选项

:::tip
如果你想快速使用,请直接参考 [快速配置](./quick-configuration)。
:::

## 基础配置

| 参数       | 说明                  | 类型     | 可选值                                 | 默认值              | 必填 |
| ---------- | --------------------- | -------- | -------------------------------------- | ------------------- | ---- |
| value      | 绑定值(markdown 原文) | string   | -                                      | -                   | 否   |
| id         | 绑定编辑器dom         | string   | -                                      |` 'cherry-markdown'` | 否   |
| editor     | 编辑器配置            | object   | [见下方](#editor-编辑器配置)           | -                   | 否   |
| toolbars   | 工具栏配置            | object   | [见下方](#toolbars-工具栏配置)         | -                   | 否   |
| engine     | 引擎配置              | object   | [见下方](#engine-引擎配置)             | -                   | 否   |
| externals  | 引入第三方组件配置    | object   | [见下方](#externals-拓展配置)          | -                   | 否   |
| fileUpload | 静态资源上传配置      | function | [见下方](#fileupload-静态资源上传配置) | -                   | 否   |

## `editor` 编辑器配置

可用来配置一些编辑器行为，比如主题(theme)等，也可以传入 `codemirror` 实例化参数。

```js
editor: {
  id: "code",
  name: "code",
  autoSave2Textarea: false,
  theme: "default",
  height: "100%",
  defaultModel: "edit&preview",
  convertWhenPaste: true,
  codemirror: {
    // 是否自动focus 默认为true
    autofocus: true,
  },
},
```

#### `id`(editor)

- Description: textarea 的id属性值
- Type: `String`
- Default: `'code'`

#### `name`(editor)

:::tip
可以用来声明form表单提交的字段。
:::

- Description: textarea 的name属性值
- Type: `String`
- Default: `'code'`

#### `autoSave2Textarea`

:::warning
如果`autoSave2Textarea`为`false` 则form表单提交的时候不能自动获取cherry的内容,需通过cherry的api来获取。

:::

- Description: 是否自动将编辑区的内容回写到textarea里。
  当为true的时候会自动把cherry的最新markdown内容更新到textarea里面，为false的时候不会自动更新。
- Type: `Boolean`
- Default: `true`

#### `theme`(editor)

- Description: 用于配置编辑区域的主题
- Type: `String`
- Default: `default`
- Options: 参考[CodeMirror主题配置](https://codemirror.net/demo/theme.html)

#### `height`

- Description: 用于配置编辑区域的高度，当挂载点存在内联设置的 **height** 样式时，以内联样式为主
- Type: `String`
- Default: `100%`

#### `defaultModel`

- Description: 用于配置编辑器的初始编辑模式
- Type: `String`
- Default: `'edit&preview'`
- Options:
  - `editOnly`: 纯编辑模式（没有预览，可通过toolbar切换成双栏或预览模式）
  - `edit&preview`: 双栏编辑预览模式
  - `previewOnly`: 预览模式（没有编辑框，toolbar只显示“返回编辑”按钮，可通过toolbar切换成编辑模式）

#### `codemirror`

- Description: 可传入 codemirror 实例化参数
- Type: `{}`
- Default:
- Options: 参考[CodeMirror配置选项](<https://codemirror.net/5/doc/manual.html#config>)

## `toolbars` 工具栏配置

Cherry Markdown Editor 包含三种可配置的工具栏，包括 toolbar(上方固定工具栏)、bubble(选中文本弹出工具栏)与 float(创建新行弹出工具栏)，在其中自定义增加需要的功能。

```js
toolbars:{                                                                                                     
  theme: "dark", // light or dark
  showToolbar: true,
  toolbar: [
    "bold",
    "italic",
    "strikethrough",
    "|",
    "header",
    "list",
    "insert",
    "graph",
    "togglePreview",
  ],
  toolbarRight: ["fullScreen", "|"],
  sidebar: ["mobilePreview", "copy", "theme", "customMenu_question"],
  bubble: ["bold", "italic", "strikethrough", "sub", "sup", "|", "size"], // array or false
  float: ["h1", "h2", "h3", "|", "checklist", "quote", "quickTable", "code"], // array or false
  customMenu: {},
}
```

#### `theme`(toolbars)

- Description: 用于配置编辑区域的主题
- Type: `String`
- Default: `'dark'`
- Options:
  - `light`: 亮色主题
  - `dark`: 暗色主题

#### `showToolbar`

- Description: 是否展示工具栏
- Type: `Boolean`
- Default: `true`

#### `toolbar`

- Description: 用于配置顶部工具栏及菜单按钮顺序
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'strikethrough', '|', 'color', 'header', '|', 'list', { insert: [ 'image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'pdf', 'word', ], }, 'graph', 'settings']`
- Options:
  - `false`: 传入 **false** 时关闭顶部菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

#### `toolbarRight`

- Description: 顶部工具栏右侧展示的工具选项
- Type: `Array<string | { insert: Array<string> }> | false`
- Default:[]
- Options:
  - `false`: 传入 `false` 时关闭顶部菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

#### `sidebar`

- Description: 右侧侧边工具栏展示的工具选项
- Type: `Array<string | { insert: Array<string> }> | false`
- Default:`['mobilePreview', 'copy', 'theme', 'customMenu_question']`
- Options:
  - `false`: 传入 **false** 时关闭顶部菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

#### `bubble`

- Description: 用于配置选中后的悬浮菜单
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', '|', 'size', 'color']`
- Options:
  - `false`: 传入 **false** 时关闭悬浮菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

#### `float`

- Description: 用于配置新行的行内菜单
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', '|', 'size', 'color']`
- Options:
  - `false`: 传入 **false** 时关闭新行行内菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

#### `customMenu`

- Description:声明自定义菜单按钮。声明后可在toolbar、bubble等配置里使用。
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `{}`


## toolbars **内置菜单名称参考**

:::tip
这是 [toolbars-工具栏配置](#toolbars-工具栏配置):toolbar(上方固定工具栏)、bubble(选中文本弹出工具栏)与 float(创建新行弹出工具栏)
内可选Options的详细参考。
:::

- Options:
  - ~~**audio**: 插入音频~~<Badge type="danger" text="敬请期待" />
  - ~~**bartable**:  插入柱状图图+表格~~<Badge type="danger" text="敬请期待" />
  - **bold**:  加粗按钮
  - **br**:   插入换行
  - **checklist**:  下标的按钮
  - **code**:   插入代码块的按钮
  - **codetheme**:  设置代码块的主题
  - **color**:  插入字体颜色或者字体背景颜色的按钮
  - **copy**:  复制按钮，用来复制预览区的html内容
  - **detail**:  插入手风琴
  - **drawio**:  打开draw.io画图对话框，点击确定后向编辑器插入图片语法
  - **export**:  导出
  - **file**:  插入文件
  - **formula**:  插入行内公式
  - **fullscreen**:  全屏按钮
  - **graph**: 画图(需要引入**mermaid**)
  - **header**: 插入1级~5级标题
  - **h1**:  插入1级标题
  - **h2**:  插入2级标题
  - **h3**:  插入3级标题
  - **hr**:  插入分割线
  - **image**:  插入图片
  - **insert**:  "插入"按钮
  - ~~**italic**:  插入斜体的按钮~~<Badge type="danger" text="敬请期待" />
  - ~~**justify**:  插入对齐方式~~<Badge type="danger" text="敬请期待" />
  - ~~**link**:  插入超链接~~<Badge type="danger" text="敬请期待" />
  - ~~**linetable**:  插入折线图+表格~~<Badge type="danger" text="敬请期待" />
  - **list**:  插入有序/无序/checklist列表的按钮
  - **mobilepreview**:  预览区域切换到“移动端视图”的按钮
  - **ol**:  无序列表
  - ~~**panel**:  插入面板~~<Badge type="danger" text="敬请期待" />
  - ~~**pdf**:  插入pdf~~<Badge type="danger" text="敬请期待" />
  - ~~**quote**:  插入“引用”的按钮~~<Badge type="danger" text="敬请期待" />
  - ~~**quicktable**:  插入“简单表格”的按钮;所谓简单表格，是源于[TAPD](https://tapd.cn) wiki应用里的一种表格语法(该表格语法不是markdown通用语法，请慎用)~~<Badge type="danger" text="敬请期待" />
  - **redo**:  撤销/重做 里的“重做”按键
  - **ruby**:  生成ruby，使用场景：给中文增加拼音、给中文增加英文、给英文增加中文等等
  - **settings**:  设置按钮
  - **size**:  设置字体大小
  - **split**:  工具栏里的分割线，用来切分不同类型按钮的区域
  - **strikethrough**:  删除线的按钮
  - **sub**:  下标的按钮
  - **sup**:  上标的按钮
  - **switchmodel**:  切换预览/编辑模式的按钮(只能切换成纯编辑模式和纯预览模式)
  - **table**:  插入普通表格
  - **theme**:  修改主题
  - **toc**:  插入目录
  - **togglepreview**: 关闭/展示预览区域的按钮
  - **ul**: 有序列表
  - **underline**: 下划线按钮
  - **undo**:  撤销回退按钮，点击后触发编辑器的undo操作
  - **video**:  插入视频
  - **word**:插入word

## `engine` 引擎配置

可通过配置 engine 对象来配置 markdown 的解析规则

```js
  engine: {
  // 全局配置
  global: {
    // 是否启用经典换行逻辑
    // true：一个换行会被忽略，两个以上连续换行会分割成段落，
    // false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
    classicBr: false,
    /**
     * 全局的URL处理器
     * @param {string} url 来源url
     * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
     * @returns
     */
    urlProcessor: callbacks.urlProcessor,
    /**
     * 额外允许渲染的html标签
     * 标签以英文竖线分隔，如：htmlWhiteList: 'iframe|script|style'
     * 默认为空，默认允许渲染的html见src/utils/sanitize.js whiteList 属性
     * 需要注意：
     *    - 启用iframe、script等标签后，会产生xss注入，请根据实际场景判断是否需要启用
     *    - 一般编辑权限可控的场景（如api文档系统）可以允许iframe、script等标签
     */
    htmlWhiteList: '',
  },
  // 内置语法配置
  syntax: {
    // 语法开关
    // 'hookName': false,
    // 语法配置
    // 'hookName': {
    //
    // }
    autoLink: {
      /** 是否开启短链接 */
      enableShortLink: true,
      /** 短链接长度 */
      shortLinkLength: 20,
    },
    list: {
      listNested: false, // 同级列表类型转换后变为子级
      indentSpace: 2, // 默认2个空格缩进
    },
    table: {
      enableChart: false,
      // chartRenderEngine: EChartsTableEngine,
      // externals: ['echarts'],
    },
    inlineCode: {
      theme: 'red',
    },
    codeBlock: {
      theme: 'dark', // 默认为深色主题
      wrap: true, // 超出长度是否换行，false则显示滚动条
      lineNumber: true, // 默认显示行号
      copyCode: true, // 是否显示“复制”按钮
      customRenderer: {
        // 自定义语法渲染器
      },
      mermaid: {
        svg2img: false, // 是否将mermaid生成的画图变成img格式
      },
      /**
       * indentedCodeBlock是缩进代码块是否启用的开关
       *
       *    在6.X之前的版本中默认不支持该语法。
       *    因为cherry的开发团队认为该语法太丑了（容易误触）
       *    开发团队希望用```代码块语法来彻底取代该语法
       *    但在后续的沟通中，开发团队发现在某些场景下该语法有更好的显示效果
       *    因此开发团队在6.X版本中才引入了该语法
       *    已经引用6.x以下版本的业务如果想做到用户无感知升级，可以去掉该语法：
       *        indentedCodeBlock：false
       */
      indentedCodeBlock: true,
    },
    emoji: {
      useUnicode: true, // 是否使用unicode进行渲染
    },
    fontEmphasis: {
      /**
       * 是否允许首尾空格
       * 首尾、前后的定义： 语法前**语法首+内容+语法尾**语法后
       * 例：
       *    true:
       *           __ hello __  ====>   <strong> hello </strong>
       *           __hello__    ====>   <strong>hello</strong>
       *    false:
       *           __ hello __  ====>   <em>_ hello _</em>
       *           __hello__    ====>   <strong>hello</strong>
       */
      allowWhitespace: false,
    },
    strikethrough: {
      /**
       * 是否必须有前后空格
       * 首尾、前后的定义： 语法前**语法首+内容+语法尾**语法后
       * 例：
       *    true:
       *            hello wor~~l~~d     ====>   hello wor~~l~~d
       *            hello wor ~~l~~ d   ====>   hello wor <del>l</del> d
       *    false:
       *            hello wor~~l~~d     ====>   hello wor<del>l</del>d
       *            hello wor ~~l~~ d     ====>   hello wor <del>l</del> d
       */
      needWhitespace: false,
    },
    mathBlock: {
      engine: 'MathJax', // katex或MathJax
      src: '',
      plugins: true, // 默认加载插件
    },
    inlineMath: {
      engine: 'MathJax', // katex或MathJax
      src: '',
    },
    toc: {
      /** 默认只渲染一个目录 */
      allowMultiToc: false,
    },
    header: {
      /**
       * 标题的样式：
       *  - default       默认样式，标题前面有锚点
       *  - autonumber    标题前面有自增序号锚点
       *  - none          标题没有锚点
       */
      anchorStyle: 'default',
    },
  },
},
```

### `global`

- Description: 全局配置
- Type: {classicBr:boolean;urlProcessor:('image'|'audio'|'video'|'autolink'|'link')=>string
- Default: `{}`

### `syntax`

- Description: 编辑器内置语法配置
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`

#### `customSyntax`

- Description: 自定义语法配置
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`

如果你想了解更多有关 Cherry Markdown 自定义拓展， 可以看这里 [extensions](./extensions.md)。


## `externals` 拓展配置

<!-- 外部依赖配置

- Type: `{ [packageName: string]: Object }`
- Default: `{}`
- Usage:
  从全局对象引入

```Javascript
new Cherry({
    externals: {
        echarts: window.echarts
    }
});
```

通过`import`引入

```Javascript
import echarts from 'echarts';

new Cherry({
    externals: {
        echarts
    }
});
``` -->

## `fileUpload` 静态资源上传配置

Cherry Markdown Editor 不会直接上传图片或是文件，只会通过钩子函数(fileUpload)向上游提供用户所选择的图片、word 文档等，fileUpload 函数接受两个传入参数：

1. file: 用户选择用来上传的文件对象
2. callback: 当上游处理好静态资源后，应调用 callback 并传入上传好的静态资源路径回显在 markdown 编辑器中。

```js
new Cherry({
  id: 'markdown',
  value: '',
  fileUpload(file, callback) {
    callback(url);
  },
});
```
