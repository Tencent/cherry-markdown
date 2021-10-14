# Cherry Editor 使用文档

# 开始使用

## Cherry Editor 介绍

Cherry Editor 是由腾讯 markdown Oteam 团队出品的一款 markdown 编辑器，具有开箱即用、轻量简洁、高度可定制等特点。

## 安装 Cherry Markdown

```bash
# 推荐使用yarn
yarn add cherry-markdown
# 或使用npm
npm install cherry-markdown --save
```

如果需要开启 `mermaid` 画图、表格自动转图表功能，需要同时添加`mermaid` 与`echarts`包。

目前**Cherry**推荐的插件版本为`echarts@4.6.0`、`mermaid@8.11.1`

```bash
# 安装mermaid依赖开启mermaid画图功能
yarn add mermaid@8.11.1
# 安装echarts依赖开启表格自动转图表功能
yarn add echarts@4.6.0
```

## 开始使用 Markdown

### 通过 `script` 引入

使用时引入对应的资源文件，然后填入下面的代码，即可开启轻松愉悦的编辑旅程。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>cherry Editor demo</title>
    <link href="cheery-editor.min.css" />
  </head>
  <body>
    <div id="markdown-container"></div>
    <script src="cherry-editor.min.js"></script>
    <script>
      new Cherry({
        id: 'markdown-container',
        value: '# welcome to cherry editor!',
      });
    </script>
  </body>
</html>
```

### 通过 `npm` 引入

按照指引安装了`cherry-markdown`包后，可以按以下方式作为模块引入。

```javascript
// es6
import Cherry from 'cherry-markdown';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});

// commonjs
const { default: Cherry } = require('cherry-markdown');
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### 使用核心构建(Core Build)

因 mermaid 库尺寸非常大，Cherry 构建产物中包含了不内置 mermaid 的核心构建包，可按以下方式引入核心构建。

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
// 引入Cherry引擎核心构建
// 引擎配置项与Cherry通用，以下文档内容仅介绍Cherry核心包
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine({
  value: '# welcome to cherry editor!',
});
```

⚠️ **需要注意**，核心构建包不包含 mermaid 依赖，需要手动引入相关插件。

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// 插件注册必须在Cherry实例化之前完成
Cherry.usePlugin(CherryMermaidPlugin, {
  mermaid, // 传入mermaid引用
  // mermaidAPI: mermaid.mermaidAPI, // 也可以传入mermaid API
  // 同时可以在这里配置mermaid的行为，可参考mermaid官方文档
  // theme: 'neutral',
  // sequence: { useMaxWidth: false, showSequenceNumbers: true }
});

const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

**推荐**使用异步引入，以下为 webpack 异步引入样例。

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';

const registerPlugin = async () => {
  const [{ default: CherryMermaidPlugin }, mermaid] = await Promise.all([
    import('cherry-markdown/src/addons/cherry-code-block-mermaid-plugin'),
    import('mermaid'),
  ]);
  Cherry.usePlugin(CherryMermaidPlugin, {
    mermaid, // 传入mermaid引用
  });
};

registerPlugin().then(() => {
  // 插件注册必须在Cherry实例化之前完成
  const cherryInstance = new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
});
```

## 默认配置

```js
  const defaultConfigs = {
    editor: {
      theme: 'default'
    },
    toolbars:{
      theme: 'dark'
      toolbar : ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'insert', 'graph', 'togglePreview'],
      bubble : ['bold', 'italic', 'strikethrough', 'sub', 'sup', '|', 'size'],
      float : ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'],
      customMenu: []
    },
    engine: {
      syntax: {
        table: {
          enableChart: false,
          externals: [ 'echarts' ]
        },
      },
      customSyntax: {}
    },
    externals: {},
    fileUpload(file, callback) {
      // api.post(file).then(url => {
      //   callback(url)
      // })
    }
  }
```

# 配置说明

## editor

- `theme` <[String]> 主题
  - 'default' 默认主题

## toolbars

- `theme` <[String]> toolbars 主题
  - 'light' 浅色主题
  - 'dark' 深色主题
- `toolbar` <[Array]> 顶部 toolbar
  - '|' : 菜单分割线，无实际功能
  - 'bold': 加粗
  - 'italic': 斜体
  - 'strikethrough': 删除线
  - 'header': 标题
  - 'list': 列表
  - 'insert': 插入类（默认包含以下配置）
    - 'image': 图片
    - 'video': 图片
    - 'hr': 横线
    - 'code': 代码
    - 'formula': 公式
    - 'toc': 目录
    - 'table': 表格
    - 'pdf': pdf
    - 'word': word
  - 'graph': 流程图
    - 'insertFlow': 流程图
    - 'insertSeq': 时序图
    - 'insertState': 状态图
    - 'insertClass': 类图
    - 'insertPie': 饼图
    - 'insertGantt': 甘特图
  - 'togglePreview': 启用编辑预览
- `bubble` <[Array]> 选中时的 toolbar， 配置同顶部
- `float` <[Array]> 行内的 toolbar， 配置同顶部

## engine

- `syntax` <[Object]> 语法规则
  - 'table' <[Object]> 表格
    - 'enableChart': <[Boolean]> 激活表格绘制图形
    - 'externals': <[Array]> 绘制图形的依赖
    - 'chartRenderEngine': <[Constructor]> 绘制图形的类，应该包括以下方法
      - 待完善
- `customSyntax` <[Object]> 自定义语法规则，同名语法会覆盖编辑器默认的语法
  - [hookName] <[String]> hook 名字
    - 'syntaxClass': <[SyntaxBase]> hook 构造函数
    - 'force' : <[Boolean]> 是否强制覆盖同名 hook
    - 'befor': <[String]> hookName，在这个 hook 之前执行
    - 'after': <[String]> hookName，在这个 hook 之后执行

## externals

外部依赖，用于支持自定义语法等拓展功能

## fileUpload(file, callback)

上传文件回调函数，当执行图片、视频、word 文档等上传文件的操作时，会调用此函数

- `file` <[Array]> 用户选择的文件
- `callback` <[Function]> 当处理好静态资源后，应调用 callback 并传入上传好的静态资源
  的 url 回显在 markdown 编辑器中。

# 二次开发

当编辑器的功能不能满足当前需求时，可以用两种方式来扩展编辑器的功能，一是使用 cherry editor 提供的插件机制，在外部编写好自定义解析引擎或菜单，在对应的位置注册使用。二则是直接 frock 源码，自行编辑构建。当前我们更加提倡第一种方式，因为自定义功能插件未来可以上传到插件市场，你可以在插件市场上传或者获取自定义功能，更加方便快捷。下面我们来简单介绍自定义插件怎么开发：

## 自定义语法

在开始编写自定义语法之前，你需要使用一个 cheery 提供的创建自定义语法的工厂函数 createSyntaxHook，使用方法可见 API 列表。
自定义语法可以分两步；

1. 生成一个 hook 构造函数
2. 注入编辑器的自定义语法中

下面我们以屏蔽敏感词汇为例，实现一个自定义语法的功能：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>cherry Editor demo</title>
    <link href="cheery-editor.min.css" />
  </head>
  <body>
    <div id="markdown-container"></div>
    <script src="cherry-editor.min.js"></script>
    <script>
      /*
       * 生成一个屏蔽敏感词汇的hook
       * 名字叫blockSensitiveWords
       * 范围是整个页面
       * 匹配规则会挂载到实例的RULE属性上
       */
      let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', 'page', {
        makeHtml(str) {
          return str.replace(this.RULE.reg, '***');
        },
        rule(str) {
          return {
            reg: /敏感词汇/g,
          };
        },
      });
      new Cherry({
        id: 'markdown-container',
        value: '# welcome to cherry editor!',
        engine: {
          customSyntax: {
            // 注入编辑器的自定义语法中
            BlockSensitiveWordsHook: {
              syntaxClass: BlockSensitiveWordsHook,
              // 有同名hook则强制覆盖
              force: true,
              // 在处理图片的hook之前调用
              // before: 'image',
            },
          },
        },
      });
    </script>
  </body>
</html>
```

## 自定义菜单

自定义菜单也采取同样的步骤，下面以添加一个模板快捷菜单为例:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>cherry Editor demo</title>
    <link href="cheery-editor.min.css" />
  </head>
  <body>
    <div id="markdown-container"></div>
    <script src="cherry-editor.min.js"></script>
    <script>
      /*
       * 生成一个添加前缀模板的hook
       * 名字叫AddPrefixTemplate
       * 图标类名icon-add-prefix
       */
      let AddPrefixTemplate = Cherry.createSyntaxHook('AddPrefixTemplate', 'icon-add-prefix', {
        onClick(selection) {
          return 'Prefix-' + selection;
        },
      });
      new Cherry({
        id: 'markdown-container',
        value: '# welcome to cherry editor!',
        toolbars: {
          customMenu: {
            // 注入编辑器的菜单中
            AddPrefixTemplate,
          },
        },
      });
    </script>
  </body>
</html>
```

# 常用 API 列表

## 自定义语法

```javascript
createSyntaxHook(name, type[, options])
`name` <[String]> 自定义语法的名字
`type` <[String]> 语法类型，当语法类型为段落时，只有当对应段落的文档有变更才会调用
    'paragraph': 段落语法
    'page': 页面语法
`options` <[Object]> 语法钩子集合
    beforeMakeHtml(str) <[Function]> 调用自定义语法前
        'str': 变更的段落或者全部内容
        returns: <String> 处理后的内容
    makeHtml(str) <[Function]> 自定义语法
        'str': beforeMakeHtml处理后的内容
        returns: <String> 处理后的内容
    afterMakeHtml(str) <[Function]> 调用自定义语法后
        'str': makeHtml处理后的内容
        returns: <String> 处理后的内容
    rule() <[Function]> 匹配规则
        returns: <Object> 匹配正则
          'reg': `<RegExp>`
```

## 自定义菜单

```javascript
createMenuHook(name, options)
`name` <[String]> 自定义菜单名字
`options` <[Object]> 菜单钩子
    'iconName' <[String]> 图标类名
    onClick(selection) <[Function]> 点击时的回调函数
        'selection' <[String]> 当前选中的内容
        returns <[String]> 处理完的内容
    'shortcutKeys' <[Array]> 快捷键集合, 用于注册键盘函数，当匹配的快捷键组合命中时，也会调用click函数
    'subMenuConfig' <[Array<Object>]> 子菜单集合
        'name' <[String]> 菜单项名字
        'iconName' <[String]> 图标类名
        'noIcon' <[Boolean]> 无图标模式
        onClick(selection) <[Function]> 点击回调函数
            异步调用待完善...
```
