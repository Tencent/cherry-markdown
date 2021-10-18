
## Configuration

| 参数       | 说明                  | 类型     | 可选值 | 默认值 | 必填 |
| ---------- | --------------------- | -------- | ------ | ------ | ---- |
| value      | 绑定值(markdown 原文) | string   | -      | -      | 是   |
| editor     | 编辑器配置            | object   | 见下方 | -      | 否   |
| toolbars   | 工具栏配置            | object   | 见下方 | -      | 否   |
| engine     | 使用文档链接          | object   | 见下方 | -      | 否   |
| fileUpload | 静态资源上传配置      | function | 见下方 | -      | 是   |
| externals  | 引入第三方组件配置    | object   | 见下方 | -      | 否   |

### 编辑配置

可传入 codemirror 实例化参数，用来配置一些编辑器行为，比如主题(theme)等

```js
editor: {
  theme: 'default',
  height: '',
  defaultModel: '',
}
```

- Key: `theme`
- Description: 用于配置编辑区域的主题
- Type: `String`
- Default: `default`
- Options: 参考[CodeMirror主题配置](https://codemirror.net/demo/theme.html)

--------

- Key: `height`
- Description: 用于配置编辑区域的高度，当挂载点存在内联设置的 **height** 样式时，以内联样式为主
- Type: `String`
- Default: `100%`

--------

- Key: `defaultModel`
- Description: 用于配置编辑器的初始编辑模式
- Type: `String`
- Default: `'edit&preview'`
- Options:
  - `editOnly`: 纯编辑模式（没有预览，可通过toolbar切换成双栏或预览模式）
  - `edit&preview`: 双栏编辑预览模式
  - `previewOnly`: 预览模式（没有编辑框，toolbar只显示“返回编辑”按钮，可通过toolbar切换成编辑模式）
  
### 工具栏配置

Cherry Markdown Editor 包含三种可配置的工具栏，包括 toolbar(上方固定工具栏)、bubble(选中文本弹出工具栏)与 float(创建新行弹出工具栏)，在其中自定义增加需要的功能。

```js
toolbars:{                                                                                                     
    theme: 'dark', // light or dark                                                                            
    toolbar : ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'insert', 'graph', 'togglePreview'],   
    bubble : ['bold', 'italic', 'strikethrough', 'sub', 'sup', '|', 'size'], // array or false                 
    float : ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'], // array or false         
    customMenu: {

    }
}
```

- Key: `theme`
- Description: 用于配置编辑区域的主题
- Type: `String`
- Default: `'dark'`
- Options:
  - `light`: 亮色主题
  - `dark`: 暗色主题

--------

- Key: `toolbar`
- Description: 用于配置顶部工具栏及菜单按钮顺序
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'strikethrough', '|', 'color', 'header', '|', 'list', { insert: [ 'image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'line-table', 'bar-table', 'pdf', 'word', ], }, 'graph', 'settings']`
- Options:
  - `false`: 传入 **false** 时关闭顶部菜单 **(v4.0.11及以前版本不支持)**
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

--------

- Key: `bubble`
- Description: 用于配置选中后的悬浮菜单
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', '|', 'size', 'color']`
- Options:
  - `false`: 传入 **false** 时关闭悬浮菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

--------

- Key: `float`
- Description: 用于配置新行的行内菜单
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', '|', 'size', 'color']`
- Options:
  - `false`: 传入 **false** 时关闭新行行内菜单
  - `string[]`: 菜单名称的集合，渲染的菜单按钮顺序跟随数组的元素顺序

--------

- Key: `customMenu`
- Description: 用于配置编辑区域的主题
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `{}`

--------

#### **内置菜单名称参考**

- Options:
  - **|**: 分隔符
  - **bold**: 加粗
  - **italic**: 斜体
  - **underline**: 下划线
  - **strikethrough**: 删除线
  - **sub**: 下标
  - **sup**: 上标
  - **size**: 文字尺寸
  - **color**: 文字颜色
  - **header**: 标题菜单
  - **h1**: 一级标题
  - **h2**: 二级标题
  - **h3**: 三级标题
  - **checklist**: 任务列表
  - **list**: 列表菜单
  - **insert**: 插入菜单（可定制插入项）
  - **image**: 插入图片
  - **audio**: 插入音频
  - **video**: 插入视频
  - **pdf**: 插入pdf
  - **word**: 插入word文档
  - **link**: 插入链接
  - **hr**: 插入水平分割线
  - **br**: 插入新行
  - **code**: 插入代码块
  - **formula**: 插入数学公式
  - **toc**: 插入目录
  - **table**: 插入表格(gfm)
  - **line-table**: 插入带折线图的高级表格(需要引入**echarts**)
  - **bar-table**: 插入带柱状图的高级表格(需要引入**echarts**)
  - **graph**: 画图(需要引入**mermaid**)
  - **settings**: 设置
  - **switchModel**: 切换编辑/预览模式(用于单栏编辑/预览模式)
  - **togglePreview**: 打开/关闭预览区(用于左右分栏模式)

### 引擎配置

可通过配置 engine 对象来配置 markdown 的解析规则，比如 table 是否可使用 chart（pro 版本可用）

```js
engine: {
    // 内置语法配置
    syntax: {                                       <[Object]> 语法规则
        // 语法开关
        // 'hookName': false,
        // 语法配置
        // 'hookName': {
        //
        // }
        list: {
            listNested: true // 同级列表类型转换后变为子级
        },
        // pro 版本功能
        table: {
            enableChart: true,                        <[Boolean]> 激活表格绘制图形
            chartRenderEngine: EChartsTableEngine,    <[Array]> 绘制图形的依赖
            externals: [ 'echarts' ]                  <[Constructor]> 绘制图形的类，应该包括以下方法
        },
        codeBlock: {
            customRenderer: { // 自定义语法渲染器
                mermaid: new MermaidCodeEngine({ mermaidAPI, theme: 'neutral' })
            }
        }
    },
    // 自定义语法
    customSyntax: {
        // 'SyntaxClass': SyntaxClass   <[Object]> 自定义语法规则，同名语法会覆盖编辑器默认的语法
        // 名字冲突时强制覆盖内置语法解析器
        // 'SyntaxClass': {             <[String]> hook 名字
        //    syntax: SyntaxClass,      <[SyntaxBase]> hook 构造函数
        //    force: true,              <[Boolean]> 是否强制覆盖同名 hook
        //    before: 'HOOK_NAME',      <[String]> hookName，在这个 hook 之前执行
        //    after: 'HOOK_NAME'        <[String]> hookName，在这个 hook 之后执行
        // }
    }
}
```

- Key: `syntax`
- Description: 编辑器内置语法配置
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`

--------

- Key: `customSyntax`
- Description: 自定义语法配置
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`

如果你想了解更多有关 Cherry Markdown 自定义拓展， 可以看这里 [extensions](./extensions.md)
--------

### 拓展配置

外部依赖配置

- Type: `{ [packageName: string]: Object }`
- Default: `{}`
- Usage:
  从全局对象引入

```Javascript
new Markdown({
    externals: {
        echarts: window.echarts
    }
});
```

通过`import`引入

```Javascript
import echarts from 'echarts';

new Markdown({
    externals: {
        echarts
    }
});
```

### 静态资源上传配置

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

### Markdown.constants

Markdown 编辑器常量

#### Markdown.constants.HOOKS_TYPE_LIST

语法 Hook 类型常量列表

- Type: `enum`
- Value: `{ DEFAULT: 'sentence', SEN: 'sentence', PAR: 'paragraph' }`
