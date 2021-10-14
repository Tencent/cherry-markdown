## 配置项
| 参数            | 说明                 | 类型   | 可选值 | 默认值 | 必填 |
| --------------- | -------------------- | ------ | ------ | ------ | --------------- |
| value | 绑定值(markdown原文) | string | -      | -      | 是 |
| editor    | 编辑器配置           | object | 见下方   | -  | 否 |
| toolbars   | 工具栏配置 | object | 见下方   | -   | 否 |
| engine     | 使用文档链接          | object | 见下方   | -   | 否 |
| fileUpload | 静态资源上传配置 | function | 见下方      | -  | 是 |
| externals | 引入第三方组件配置 | object | 见下方      | -  | 否 |

#### 编辑器配置
可传入codemirror实例化参数，用来配置一些编辑器行为，比如主题(theme)等
```js
editor: {
    theme: 'default'
}
```

#### 工具栏配置
Cherry Editor包含三种可配置的工具栏，包括toolbar(上方固定工具栏)、bubble(选中文本弹出工具栏)与float(创建新行弹出工具栏)，在其中自定义增加需要的功能。
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

#### 引擎配置
可通过配置engine对象来配置markdown的解析规则，比如table是否可使用chart
```js
engine: {
    // 内置语法配置
    syntax: {
        // 语法开关
        // 'hookName': false,
        // 语法配置
        // 'hookName': {
        // 
        // }
        list: {
            listNested: true // 同级列表类型转换后变为子级
        },
        table: {
            enableChart: true,
            chartRenderEngine: EChartsTableEngine,
            externals: [ 'echarts' ]
        },
        codeBlock: {
            customRenderer: { // 自定义语法渲染器
                mermaid: new MermaidCodeEngine({ mermaidAPI, theme: 'neutral' })
            }
        }
    },
    // 自定义语法
    customSyntax: {
        // 'SyntaxClass': SyntaxClass
        // 名字冲突时强制覆盖内置语法解析器
        // 'SyntaxClass': {
        //    syntax: SyntaxClass,
        //    force: true,
        //    before: 'HOOK_NAME',
        //    after: 'HOOK_NAME'
        // }
    }
}
```


#### 静态资源上传配置

Cherry Editor不会直接上传图片或是文件，只会通过钩子函数(fileUpload)向上游提供用户所选择的图片、word文档等，fileUpload函数接受两个传入参数：

1. file: 用户选择用来上传的文件对象
2. callback: 当上游处理好静态资源后，应调用callback并传入上传好的静态资源路径回显在markdown编辑器中。

```js
new Cherry({
  id: 'markdown',
  value: '',
  fileUpload(file, callback) {
    callback(url);
  },
});
```






