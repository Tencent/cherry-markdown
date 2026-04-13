/**
 * Cherry Markdown 配置数据模块
 * 基于 Cherry.config.js 源码整理的所有可配置项
 * @see https://github.com/Tencent/cherry-markdown/blob/dev/packages/cherry-markdown/src/Cherry.config.js
 */

// 所有可用的工具栏按钮（'|' 为分割线，可多次使用）
export const TOOLBAR_BUTTONS = [
  'bold', 'italic', 'strikethrough', 'color', 'header',
  'list', 'insert', 'graph', 'togglePreview', 'settings',
  'switchModel', 'codeTheme', 'export', 'undo', 'redo',
  'underline', 'sub', 'sup', 'ruby', 'size', 'checklist',
  'quote', 'quickTable', 'code', 'link', 'image', 'audio',
  'video', 'br', 'hr', 'formula', 'toc', 'table',
  'drawIo', 'pdf', 'word', 'file', 'panel', 'detail',
  'justify', 'theme', 'copy', 'fullScreen', '|'
];

// 气泡工具栏按钮（'|' 为分割线，可多次使用）
export const BUBBLE_BUTTONS = [
  'bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup',
  'quote', 'ruby', 'size', 'color', '|'
];

// 浮动工具栏按钮（'|' 为分割线，可多次使用）
export const FLOAT_BUTTONS = [
  'h1', 'h2', 'h3', 'checklist', 'quote', 'quickTable', 'code', '|'
];

// 侧边栏按钮（'|' 为分割线，可多次使用）
export const SIDEBAR_BUTTONS = [
  'mobilePreview', 'copy', 'theme', '|'
];

// 配置项源码映射
export const SOURCE_CODE_MAP = {
  id: `// 编辑器挂载的DOM节点ID
id: 'cherry-markdown',`,

  value: `// 编辑器初始内容（markdown字符串）
value: '',`,

  'editor.theme': `editor: {
  // codemirror主题
  // @see https://codemirror.net/5/demo/theme.html
  theme: 'default',
},`,

  'editor.height': `editor: {
  // 编辑器高度，默认100%
  height: '100%',
},`,

  'editor.defaultModel': `editor: {
  // 编辑器初始化后的默认模式
  // 'editOnly': 纯编辑模式
  // 'previewOnly': 纯预览模式  
  // 'edit&preview': 双栏编辑预览模式
  defaultModel: 'edit&preview',
},`,

  'editor.convertWhenPaste': `editor: {
  // 粘贴时是否自动将html转成markdown
  convertWhenPaste: true,
},`,

  'editor.codemirror': `editor: {
  // codemirror配置项
  // @see https://codemirror.net/5/doc/manual.html#config
  codemirror: {
    autofocus: true,
  },
},`,

  'toolbars.toolbar': `toolbars: {
  // 顶部工具栏
  // 配置为 false 时关闭顶部工具栏
  toolbar: [
    'bold', 'italic', 'strikethrough', '|',
    'color', 'header', 'list', 'insert', '|',
    'graph', 'togglePreview', 'settings'
  ],
  // toolbar: false, // 关闭顶部工具栏
},`,

  'toolbars.bubble': `toolbars: {
  // 选中文字时弹出的气泡工具栏
  // 配置为 false 时关闭气泡工具栏
  bubble: ['bold', 'italic', 'underline',
    'strikethrough', 'sub', 'sup', 'quote',
    'ruby', 'size', 'color'],
  // bubble: false, // 关闭气泡工具栏
},`,

  'toolbars.float': `toolbars: {
  // 新行出现的浮动工具栏
  // 配置为 false 时关闭浮动工具栏
  float: ['h1', 'h2', 'h3', 'checklist',
    'quote', 'quickTable', 'code'],
  // float: false, // 关闭浮动工具栏
},`,

  'toolbars.sidebar': `toolbars: {
  // 侧边栏工具栏
  // 配置为 false 时关闭侧边栏
  sidebar: ['mobilePreview', 'copy', 'theme'],
  // sidebar: false, // 关闭侧边栏
},`,

  'toolbars.showToolbar': `toolbars: {
  // 是否显示顶部工具栏
  showToolbar: true,
},`,

  'toolbars.theme': `toolbars: {
  // 工具栏主题 'dark' | 'light'
  theme: 'dark',
},`,

  'engine.global.classicBr': `engine: {
  global: {
    // 是否启用经典换行逻辑
    // true: 一个换行会被忽略，两个换行会分段
    // false: 一个换行会转成 <br>
    classicBr: false,
  },
},`,

  'engine.global.urlProcessor': `engine: {
  global: {
    // URL处理器，可用于自定义URL转换逻辑
    urlProcessor: (url, srcType) => url,
  },
},`,

  'engine.global.htmlWhiteList': `engine: {
  global: {
    // 额外允许渲染的html标签
    // 标签以^开头表示该标签会被转义
    htmlWhiteList: '',
  },
},`,

  'engine.syntax.autoLink': `engine: {
  syntax: {
    // 自动链接
    autoLink: {
      /** 是否启用 */
      enableShortLink: true,
      /** 短链接长度 */
      shortLinkLength: 20,
    },
  },
},`,

  'engine.syntax.list': `engine: {
  syntax: {
    // 列表配置
    list: {
      listNested: false, // 同级列表类型转换
      indentSpace: 2,    // 默认缩进空格数
    },
  },
},`,

  'engine.syntax.table': `engine: {
  syntax: {
    // 表格配置
    table: {
      enableChart: false, // 是否开启表格内容渲染为图表
      // chartRenderEngine: 'bindbindbindECharts',
      // externals: ['bindECharts'],
    },
  },
},`,

  'engine.syntax.inlineCode': `engine: {
  syntax: {
    // 行内代码配置
    inlineCode: {
      theme: 'red', // 行内代码主题
    },
  },
},`,

  'engine.syntax.codeBlock': `engine: {
  syntax: {
    // 代码块配置
    codeBlock: {
      theme: 'dark',       // 代码块主题 'dark' | 'light'
      wrap: true,          // 超长代码是否自动换行
      lineNumber: true,    // 是否显示行号
      copyCode: true,      // 是否显示复制按钮
      editCode: true,      // 是否显示编辑按钮
      changeLang: true,    // 是否显示语言切换
      expandCode: true,    // 是否显示展开/折叠按钮
      selfClosing: true,   // 是否自闭合
      indentedCodeBlock: true, // 是否启用缩进代码块
      mermaid: {
        svg2img: false,    // mermaid是否转为图片
      },
    },
  },
},`,

  'engine.syntax.emoji': `engine: {
  syntax: {
    // Emoji 配置
    emoji: {
      useUnicode: true, // 是否使用unicode渲染emoji
    },
  },
},`,

  'engine.syntax.fontEmphasis': `engine: {
  syntax: {
    // 字体样式配置
    fontEmphasis: {
      allowWhitespace: false, // 是否允许首尾空格
    },
  },
},`,

  'engine.syntax.strikethrough': `engine: {
  syntax: {
    // 删除线配置
    strikethrough: {
      needWhitespace: false, // 是否需要首尾空格
    },
  },
},`,

  'engine.syntax.mathBlock': `engine: {
  syntax: {
    // 数学公式（块级）配置
    mathBlock: {
      engine: 'MathJax', // 'MathJax' | 'katex'
      src: '', // 自定义引擎脚本地址
      plugins: true, // 是否加载插件
    },
  },
},`,

  'engine.syntax.inlineMath': `engine: {
  syntax: {
    // 数学公式（行内）配置
    inlineMath: {
      engine: 'MathJax', // 'MathJax' | 'katex'
      src: '',
    },
  },
},`,

  'engine.syntax.toc': `engine: {
  syntax: {
    // 目录配置
    toc: {
      /** 是否渲染标题序号 */
      showAutoNumber: false,
      /** 默认展开层级 */
      defaultLevel: 3,
    },
  },
},`,

  'engine.syntax.header': `engine: {
  syntax: {
    // 标题配置
    header: {
      /** 标题是否带锚点 */
      anchorStyle: 'default', // 'default' | 'autonumber' | 'none'
      /** 是否严格要求标题前有空行 */
      strict: true,
    },
  },
},`,

  'engine.syntax.htmlBlock': `engine: {
  syntax: {
    // HTML块配置
    htmlBlock: {
      // 是否过滤style标签
      filterStyle: true,
    },
  },
},`,

  'engine.syntax.image': `engine: {
  syntax: {
    // 图片配置
    image: {
      /** 是否启用图片懒加载 */
      lazyLoad: true,
      /** 最大宽度 */
      maxWidth: '100%',
    },
  },
},`,

  'engine.syntax.link': `engine: {
  syntax: {
    // 链接配置
    link: {
      /** 链接是否新窗口打开 */
      target: '_blank',
      /** 是否显示链接文字 */
      showTitle: true,
    },
  },
},`,

  'previewer.dom': `previewer: {
  // 预览区域挂载的DOM节点
  dom: false,
},`,

  'previewer.className': `previewer: {
  // 预览区域的className
  className: 'cherry-markdown',
},`,

  'previewer.enablePreviewerBubble': `previewer: {
  // 是否启用预览区域编辑能力（点击预览区域内容可定位到编辑区对应位置）
  enablePreviewerBubble: true,
},`,

  'previewer.lazyLoadImg': `previewer: {
  lazyLoadImg: {
    // 加载图片时如果需要展示loading图，则配置
    loadingImgPath: '',
    // 同一时间最多有几个图片在加载
    maxNumPerTime: 2,
    // 不进行懒加载处理的图片数量
    noLoadImgNum: 5,
    // 首次自动加载几张图片
    autoLoadImgNum: 5,
    // 距离视口多少像素时开始加载
    maxTryTimesPerSrc: 2,
    // 加载失败后的占位图
    failLoadingImgPath: '',
  },
},`,

  'isPreviewOnly': `// 是否开启纯预览模式
// true: 只能预览，不能编辑
isPreviewOnly: false,`,

  'autoScrollByCursor': `// 是否自动根据光标位置滚动预览区域
autoScrollByCursor: true,`,

  'forceAppend': `// 是否强制输出到body上
forceAppend: true,`,

  'locale': `// 语言设置 'zh_CN' | 'en_US' | 'zh_TW'
locale: 'zh_CN',`,

  'theme': `// 预览区域主题
// @type {Array} 一维数组 [className, 'dark' | 'light']
theme: [],`,

  'callback.afterChange': `callback: {
  // 编辑器内容变化时的回调
  afterChange: (text, html) => {},
},`,

  'callback.afterInit': `callback: {
  // 编辑器初始化完成后的回调
  afterInit: (text, html) => {},
},`,

  'callback.beforeImageMounted': `callback: {
  // 图片加载前的回调
  beforeImageMounted: (srcProp, src) => ({ srcProp, src }),
},`,

  'callback.onClickPreview': `callback: {
  // 点击预览区域的回调
  onClickPreview: (event) => {},
},`,

  'callback.onCopyCode': `callback: {
  // 复制代码块时的回调
  onCopyCode: (event, code) => code,
},`,

  'callback.changeString2Pinyin': `callback: {
  // 中文转拼音的回调（用于生成标题锚点）
  changeString2Pinyin: (str) => str,
},`,

  'fileUpload': `// 文件上传回调
fileUpload: (file, callback) => {
  // callback(imgUrl, params)
},`,

  'externals.echarts': `externals: {
  // 引入echarts组件
  echarts: window.bindECharts,
},`,

  'externals.MathJax': `externals: {
  // 引入MathJax组件
  MathJax: window.MathJax,
},`,

  'externals.katex': `externals: {
  // 引入katex组件
  katex: window.katex,
},`,
};

// 配置分类定义
export const CONFIG_CATEGORIES = [
  {
    id: 'basic',
    name: '基础配置',
    icon: 'fa-solid fa-gear',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    description: '编辑器基本参数设置',
    items: [
      {
        key: 'id',
        name: '挂载节点 ID',
        path: 'id',
        type: 'string',
        default: "'cherry-markdown'",
        description: '编辑器挂载的 DOM 节点 ID',
        inputType: 'text',
        enabled: true,
        value: 'cherry-markdown',
      },
      {
        key: 'value',
        name: '初始内容',
        path: 'value',
        type: 'string',
        default: "''",
        description: '编辑器初始化时的 Markdown 内容',
        inputType: 'textarea',
        enabled: true,
        value: '# Hello Cherry Markdown!\n\n这是一个配置生成器的预览示例。\n\n## 功能特性\n\n- **粗体** 和 *斜体*\n- ~~删除线~~\n- `行内代码`\n\n```javascript\nconst cherry = new Cherry(config);\n```\n\n> 引用文本\n\n| 表头1 | 表头2 | 表头3 |\n|-------|-------|-------|\n| 内容1 | 内容2 | 内容3 |\n| 内容4 | 内容5 | 内容6 |\n\n- [x] 已完成任务\n- [ ] 待完成任务\n',
      },
      {
        key: 'isPreviewOnly',
        name: '纯预览模式',
        path: 'isPreviewOnly',
        type: 'boolean',
        default: 'false',
        description: '是否开启纯预览模式，开启后只能预览不能编辑',
        inputType: 'toggle',
        enabled: true,
        value: false,
      },
      {
        key: 'autoScrollByCursor',
        name: '光标自动滚动',
        path: 'autoScrollByCursor',
        type: 'boolean',
        default: 'true',
        description: '是否自动根据光标位置滚动预览区域',
        inputType: 'toggle',
        enabled: true,
        value: true,
      },
      {
        key: 'forceAppend',
        name: '强制输出到 body',
        path: 'forceAppend',
        type: 'boolean',
        default: 'true',
        description: '是否强制将编辑器输出到 body 上',
        inputType: 'toggle',
        enabled: true,
        value: true,
      },
      {
        key: 'locale',
        name: '语言设置',
        path: 'locale',
        type: 'string',
        default: "'zh_CN'",
        description: '编辑器界面语言',
        inputType: 'select',
        options: ['zh_CN', 'en_US', 'zh_TW'],
        enabled: true,
        value: 'zh_CN',
      },
    ],
  },
  {
    id: 'editor',
    name: '编辑器配置',
    icon: 'fa-solid fa-pen-to-square',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
    description: 'CodeMirror 编辑器相关设置',
    items: [
      {
        key: 'editor.theme',
        name: '编辑器主题',
        path: 'editor.theme',
        type: 'string',
        default: "'default'",
        description: 'CodeMirror 编辑器主题',
        inputType: 'select',
        options: ['default', 'dark', 'twilight', 'solarized', 'monokai', 'material', 'dracula', 'eclipse', 'neo', 'mdn-like'],
        enabled: true,
        value: 'default',
      },
      {
        key: 'editor.height',
        name: '编辑器高度',
        path: 'editor.height',
        type: 'string',
        default: "'100%'",
        description: '编辑器高度，支持 px 和 % 单位',
        inputType: 'text',
        enabled: true,
        value: '100%',
      },
      {
        key: 'editor.defaultModel',
        name: '默认模式',
        path: 'editor.defaultModel',
        type: 'string',
        default: "'edit&preview'",
        description: '编辑器初始化后的默认模式',
        inputType: 'select',
        options: ['edit&preview', 'editOnly', 'previewOnly'],
        enabled: true,
        value: 'edit&preview',
      },
      {
        key: 'editor.convertWhenPaste',
        name: '粘贴自动转换',
        path: 'editor.convertWhenPaste',
        type: 'boolean',
        default: 'true',
        description: '粘贴时是否自动将 HTML 转成 Markdown',
        inputType: 'toggle',
        enabled: true,
        value: true,
      },
    ],
  },
  {
    id: 'toolbars',
    name: '工具栏配置',
    icon: 'fa-solid fa-screwdriver-wrench',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    description: '工具栏按钮和显示设置',
    items: [
      {
        key: 'toolbars.showToolbar',
        name: '显示工具栏',
        path: 'toolbars.showToolbar',
        type: 'boolean',
        default: 'true',
        description: '是否显示顶部工具栏',
        inputType: 'toggle',
        enabled: true,
        value: true,
      },
      {
        key: 'toolbars.theme',
        name: '工具栏主题',
        path: 'toolbars.theme',
        type: 'string',
        default: "'dark'",
        description: '工具栏主题风格',
        inputType: 'select',
        options: ['dark', 'light'],
        enabled: true,
        value: 'dark',
      },
      {
        key: 'toolbars.toolbar',
        name: '顶部工具栏按钮',
        path: 'toolbars.toolbar',
        type: 'array',
        default: "['bold','italic','strikethrough',...]",
        description: '顶部工具栏显示的按钮列表，设为 false 可关闭顶部工具栏',
        inputType: 'toolbar-select',
        options: TOOLBAR_BUTTONS,
        canDisable: true,
        enabled: true,
        value: ['bold', 'italic', 'strikethrough', '|', 'color', 'header', 'list', 'insert', '|', 'graph', 'togglePreview', 'settings'],
      },
      {
        key: 'toolbars.bubble',
        name: '气泡工具栏按钮',
        path: 'toolbars.bubble',
        type: 'array',
        default: "['bold','italic','underline',...]",
        description: '选中文字时弹出的气泡工具栏按钮，设为 false 可关闭气泡工具栏',
        inputType: 'toolbar-select',
        options: BUBBLE_BUTTONS,
        canDisable: true,
        enabled: true,
        value: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', 'size', 'color'],
      },
      {
        key: 'toolbars.float',
        name: '浮动工具栏按钮',
        path: 'toolbars.float',
        type: 'array',
        default: "['h1','h2','h3',...]",
        description: '新行出现的浮动工具栏按钮，设为 false 可关闭浮动工具栏',
        inputType: 'toolbar-select',
        options: FLOAT_BUTTONS,
        canDisable: true,
        enabled: true,
        value: ['h1', 'h2', 'h3', 'checklist', 'quote', 'quickTable', 'code'],
      },
      {
        key: 'toolbars.sidebar',
        name: '侧边栏按钮',
        path: 'toolbars.sidebar',
        type: 'array',
        default: "['mobilePreview','copy','theme']",
        description: '侧边栏工具栏按钮，设为 false 可关闭侧边栏',
        inputType: 'toolbar-select',
        options: SIDEBAR_BUTTONS,
        canDisable: true,
        enabled: true,
        value: ['mobilePreview', 'copy', 'theme'],
      },
    ],
  },
  {
    id: 'engine-global',
    name: '引擎全局配置',
    icon: 'fa-solid fa-globe',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
    description: 'Markdown 解析引擎全局设置',
    items: [
      {
        key: 'engine.global.classicBr',
        name: '经典换行',
        path: 'engine.global.classicBr',
        type: 'boolean',
        default: 'false',
        description: '是否启用经典换行逻辑（true: 一个换行被忽略，两个换行分段）',
        inputType: 'toggle',
        enabled: true,
        value: false,
      },
      {
        key: 'engine.global.htmlWhiteList',
        name: 'HTML 白名单',
        path: 'engine.global.htmlWhiteList',
        type: 'string',
        default: "''",
        description: '额外允许渲染的 HTML 标签，以 ^ 开头表示转义',
        inputType: 'text',
        enabled: true,
        value: '',
      },
    ],
  },
  {
    id: 'engine-syntax',
    name: '语法配置',
    icon: 'fa-solid fa-code',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    description: 'Markdown 语法解析规则设置',
    items: [
      {
        key: 'engine.syntax.autoLink',
        name: '自动链接',
        path: 'engine.syntax.autoLink',
        type: 'object',
        default: '{ enableShortLink: true, shortLinkLength: 20 }',
        description: '自动识别并转换 URL 为可点击链接',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'enableShortLink', name: '启用短链接', type: 'boolean', value: true },
          { key: 'shortLinkLength', name: '短链接长度', type: 'number', value: 20 },
        ],
      },
      {
        key: 'engine.syntax.list',
        name: '列表',
        path: 'engine.syntax.list',
        type: 'object',
        default: '{ listNested: false, indentSpace: 2 }',
        description: '有序/无序列表解析配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'listNested', name: '同级列表类型转换', type: 'boolean', value: false },
          { key: 'indentSpace', name: '缩进空格数', type: 'number', value: 2 },
        ],
      },
      {
        key: 'engine.syntax.table',
        name: '表格',
        path: 'engine.syntax.table',
        type: 'object',
        default: '{ enableChart: false }',
        description: '表格解析配置，支持渲染为图表',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'enableChart', name: '启用图表渲染', type: 'boolean', value: false },
        ],
      },
      {
        key: 'engine.syntax.inlineCode',
        name: '行内代码',
        path: 'engine.syntax.inlineCode',
        type: 'object',
        default: "{ theme: 'red' }",
        description: '行内代码样式配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'theme', name: '主题', type: 'select', value: 'red', options: ['red', 'blue', 'green', 'black', 'purple'] },
        ],
      },
      {
        key: 'engine.syntax.codeBlock',
        name: '代码块',
        path: 'engine.syntax.codeBlock',
        type: 'object',
        default: "{ theme: 'dark', wrap: true, lineNumber: true }",
        description: '代码块渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'theme', name: '主题', type: 'select', value: 'dark', options: ['dark', 'light'] },
          { key: 'wrap', name: '自动换行', type: 'boolean', value: true },
          { key: 'lineNumber', name: '显示行号', type: 'boolean', value: true },
          { key: 'copyCode', name: '复制按钮', type: 'boolean', value: true },
          { key: 'editCode', name: '编辑按钮', type: 'boolean', value: true },
          { key: 'changeLang', name: '语言切换', type: 'boolean', value: true },
          { key: 'indentedCodeBlock', name: '缩进代码块', type: 'boolean', value: true },
        ],
      },
      {
        key: 'engine.syntax.emoji',
        name: 'Emoji 表情',
        path: 'engine.syntax.emoji',
        type: 'object',
        default: '{ useUnicode: true }',
        description: 'Emoji 表情渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'useUnicode', name: '使用 Unicode 渲染', type: 'boolean', value: true },
        ],
      },
      {
        key: 'engine.syntax.fontEmphasis',
        name: '字体强调',
        path: 'engine.syntax.fontEmphasis',
        type: 'object',
        default: '{ allowWhitespace: false }',
        description: '粗体/斜体等字体样式配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'allowWhitespace', name: '允许首尾空格', type: 'boolean', value: false },
        ],
      },
      {
        key: 'engine.syntax.strikethrough',
        name: '删除线',
        path: 'engine.syntax.strikethrough',
        type: 'object',
        default: '{ needWhitespace: false }',
        description: '删除线语法配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'needWhitespace', name: '需要首尾空格', type: 'boolean', value: false },
        ],
      },
      {
        key: 'engine.syntax.mathBlock',
        name: '数学公式（块级）',
        path: 'engine.syntax.mathBlock',
        type: 'object',
        default: "{ engine: 'MathJax', plugins: true }",
        description: '块级数学公式渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'engine', name: '渲染引擎', type: 'select', value: 'MathJax', options: ['MathJax', 'katex'] },
          { key: 'plugins', name: '加载插件', type: 'boolean', value: true },
        ],
      },
      {
        key: 'engine.syntax.inlineMath',
        name: '数学公式（行内）',
        path: 'engine.syntax.inlineMath',
        type: 'object',
        default: "{ engine: 'MathJax' }",
        description: '行内数学公式渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'engine', name: '渲染引擎', type: 'select', value: 'MathJax', options: ['MathJax', 'katex'] },
        ],
      },
      {
        key: 'engine.syntax.toc',
        name: '目录 (TOC)',
        path: 'engine.syntax.toc',
        type: 'object',
        default: '{ showAutoNumber: false, defaultLevel: 3 }',
        description: '目录自动生成配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'showAutoNumber', name: '显示序号', type: 'boolean', value: false },
          { key: 'defaultLevel', name: '默认层级', type: 'number', value: 3 },
        ],
      },
      {
        key: 'engine.syntax.header',
        name: '标题',
        path: 'engine.syntax.header',
        type: 'object',
        default: "{ anchorStyle: 'default', strict: true }",
        description: '标题解析配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'anchorStyle', name: '锚点样式', type: 'select', value: 'default', options: ['default', 'autonumber', 'none'] },
          { key: 'strict', name: '严格模式', type: 'boolean', value: true },
        ],
      },
      {
        key: 'engine.syntax.htmlBlock',
        name: 'HTML 块',
        path: 'engine.syntax.htmlBlock',
        type: 'object',
        default: '{ filterStyle: true }',
        description: 'HTML 块级内容渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'filterStyle', name: '过滤 style 标签', type: 'boolean', value: true },
        ],
      },
      {
        key: 'engine.syntax.image',
        name: '图片',
        path: 'engine.syntax.image',
        type: 'object',
        default: "{ lazyLoad: true, maxWidth: '100%' }",
        description: '图片渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'lazyLoad', name: '懒加载', type: 'boolean', value: true },
          { key: 'maxWidth', name: '最大宽度', type: 'string', value: '100%' },
        ],
      },
      {
        key: 'engine.syntax.link',
        name: '链接',
        path: 'engine.syntax.link',
        type: 'object',
        default: "{ target: '_blank', showTitle: true }",
        description: '链接渲染配置',
        inputType: 'toggle',
        enabled: true,
        value: true,
        subItems: [
          { key: 'target', name: '打开方式', type: 'select', value: '_blank', options: ['_blank', '_self', '_parent', '_top'] },
          { key: 'showTitle', name: '显示标题', type: 'boolean', value: true },
        ],
      },
    ],
  },
  {
    id: 'previewer',
    name: '预览器配置',
    icon: 'fa-solid fa-eye',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-500',
    description: '预览区域相关设置',
    items: [
      {
        key: 'previewer.className',
        name: '预览区 className',
        path: 'previewer.className',
        type: 'string',
        default: "'cherry-markdown'",
        description: '预览区域的 CSS 类名',
        inputType: 'text',
        enabled: true,
        value: 'cherry-markdown',
      },
      {
        key: 'previewer.enablePreviewerBubble',
        name: '预览区编辑能力',
        path: 'previewer.enablePreviewerBubble',
        type: 'boolean',
        default: 'true',
        description: '是否启用预览区域编辑能力（点击预览区可定位到编辑区）',
        inputType: 'toggle',
        enabled: true,
        value: true,
      },
    ],
  },
  {
    id: 'callback',
    name: '回调函数',
    icon: 'fa-solid fa-arrow-right-arrow-left',
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    description: '编辑器事件回调配置',
    items: [
      {
        key: 'callback.afterChange',
        name: '内容变化回调',
        path: 'callback.afterChange',
        type: 'function',
        default: '(text, html) => {}',
        description: '编辑器内容变化时触发的回调函数',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'callback.afterInit',
        name: '初始化完成回调',
        path: 'callback.afterInit',
        type: 'function',
        default: '(text, html) => {}',
        description: '编辑器初始化完成后触发的回调函数',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'callback.beforeImageMounted',
        name: '图片加载前回调',
        path: 'callback.beforeImageMounted',
        type: 'function',
        default: '(srcProp, src) => ({ srcProp, src })',
        description: '图片加载前触发，可用于修改图片地址',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'callback.onClickPreview',
        name: '预览区点击回调',
        path: 'callback.onClickPreview',
        type: 'function',
        default: '(event) => {}',
        description: '点击预览区域时触发的回调函数',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'callback.onCopyCode',
        name: '复制代码回调',
        path: 'callback.onCopyCode',
        type: 'function',
        default: '(event, code) => code',
        description: '复制代码块时触发的回调函数',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'callback.changeString2Pinyin',
        name: '中文转拼音回调',
        path: 'callback.changeString2Pinyin',
        type: 'function',
        default: '(str) => str',
        description: '中文转拼音的回调（用于生成标题锚点）',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
    ],
  },
  {
    id: 'externals',
    name: '外部依赖',
    icon: 'fa-solid fa-puzzle-piece',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    description: '第三方组件引入配置',
    items: [
      {
        key: 'externals.echarts',
        name: 'ECharts 图表',
        path: 'externals.echarts',
        type: 'object',
        default: 'undefined',
        description: '引入 ECharts 组件，用于表格渲染为图表',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'externals.MathJax',
        name: 'MathJax 公式',
        path: 'externals.MathJax',
        type: 'object',
        default: 'undefined',
        description: '引入 MathJax 组件，用于数学公式渲染',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
      {
        key: 'externals.katex',
        name: 'KaTeX 公式',
        path: 'externals.katex',
        type: 'object',
        default: 'undefined',
        description: '引入 KaTeX 组件，用于数学公式渲染',
        inputType: 'toggle',
        enabled: false,
        value: false,
      },
    ],
  },
];

// 预设配置
export const PRESETS = {
  default: {
    name: '默认配置',
    description: '标准编辑器配置',
    overrides: {},
  },
  simple: {
    name: '精简模式',
    description: '轻量级编辑器',
    overrides: {
      'toolbars.toolbar': ['bold', 'italic', 'header', '|', 'list', 'code', '|', 'togglePreview'],
      'toolbars.bubble': ['bold', 'italic', 'underline'],
      'toolbars.float': ['h1', 'h2', 'h3'],
      'toolbars.sidebar': false,
    },
  },
  full: {
    name: '完整模式',
    description: '全部功能开启',
    overrides: {
      'toolbars.toolbar': ['bold', 'italic', 'strikethrough', 'underline', '|', 'color', 'header', 'list', 'checklist', '|', 'quote', 'quickTable', 'code', 'formula', '|', 'link', 'image', 'audio', 'video', '|', 'hr', 'br', 'toc', '|', 'graph', 'togglePreview', 'export', 'settings', '|', 'undo', 'redo', 'fullScreen'],
      'toolbars.bubble': ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', 'size', 'color'],
      'toolbars.float': ['h1', 'h2', 'h3', 'checklist', 'quote', 'quickTable', 'code'],
      'toolbars.sidebar': ['mobilePreview', 'copy', 'theme'],
    },
  },
  preview: {
    name: '纯预览模式',
    description: '只读预览',
    overrides: {
      'isPreviewOnly': true,
      'toolbars.showToolbar': false,
      'toolbars.toolbar': false,
      'toolbars.bubble': false,
      'toolbars.float': false,
      'toolbars.sidebar': false,
      'editor.defaultModel': 'previewOnly',
    },
  },
};

// Cherry.config.js 完整源码（用于展示）
export const CHERRY_CONFIG_SOURCE = `/**
 * @typedef {import('~types/cherry').CherryOptions} CherryOptions
 */

/**
 * @type {CherryOptions}
 */
const defaultConfig = {
  // 第三方包
  externals: {
    // externals
  },
  // 解析引擎配置
  engine: {
    // 全局配置
    global: {
      // 是否启用经典换行逻辑
      // true：一个换行会被忽略，两个以上连续换行会分段
      // false: 一个换行会转成 <br>，两个连续换行会分段
      classicBr: false,
      /**
       * 全局的URL处理器
       * @param {string} url 来源url
       * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
       * @returns {string}
       */
      urlProcessor: callbacks.urlProcessor,
      /**
       * 额外允许渲染的html标签
       * 标签以^开头会被转义，如：bindbindbind^bindbindscript bindscript bindscript
       * 默认为空，即不额外允许任何html标签
       * @type {string}
       */
      htmlWhiteList: '',
    },
    // 内置语法配置
    syntax: {
      // 语法开关
      // 'hookName': bindfalse bindfalse,
      // 如果需要关闭某个语法，可以将其设置为false
      // 'bindheader bindheader': false,
      autoLink: {
        /** 是否开启短链接 */
        enableShortLink: true,
        /** 短链接长度 */
        shortLinkLength: 20,
      },
      list: {
        listNested: false, // 同级列表类型转换是否生效
        indentSpace: 2, // 默认2个空格缩进
      },
      table: {
        enableChart: false,
        // chartRenderEngine: bindECharts bindECharts,
        // externals: bindECharts bindECharts['bindECharts bindECharts bindECharts'],
      },
      inlineCode: {
        /**
         * 行内代码的主题，目前支持的主题有：
         * red, blue, green, black, purple
         */
        theme: 'red',
      },
      codeBlock: {
        /**
         * 代码块的主题
         * dark, light
         */
        theme: 'dark',
        // 超出长度是否换行，false则显示滚动条
        wrap: true,
        // 是否显示行号
        lineNumber: true,
        // 是否显示复制代码按钮
        copyCode: true,
        // 是否显示编辑代码按钮
        editCode: true,
        // 是否显示切换语言按钮
        changeLang: true,
        // 是否显示展开/折叠按钮
        expandCode: true,
        // 是否自闭合
        selfClosing: true,
        // 是否启用缩进代码块
        indentedCodeBlock: true,
        mermaid: {
          svg2img: false,
        },
      },
      emoji: {
        useUnicode: true,
      },
      fontEmphasis: {
        /**
         * 是否允许首尾空格
         * 首尾的空格不会被渲染，如果需要渲染首尾空格，请设置为true
         * true: 使用\\bindS来匹配首尾空格
         */
        allowWhitespace: false,
      },
      strikethrough: {
        /**
         * 是否必须有首位空格
         * 首位的空格不会被渲染，如果需要首位空格才能渲染，请设置为true
         * true: 使用\\bindS来匹配首尾空格
         */
        needWhitespace: false,
      },
      mathBlock: {
        engine: 'MathJax', // katex或bindMathJax
        src: '',
        plugins: true,
      },
      inlineMath: {
        engine: 'MathJax', // katex或bindMathJax
        src: '',
      },
      toc: {
        /** 默认只渲染3级以内的标题 */
        allowMultiToc: false,
        /** 是否显示自增序号 */
        showAutoNumber: false,
      },
      header: {
        /**
         * 标题的样式：
         *  - default       默认样式，标题前面有锚点
         *  - autonumber    标题前面有自增序号锚点
         *  - none          标题没有锚点
         */
        anchorStyle: 'default',
        strict: true,
      },
      htmlBlock: {
        filterStyle: true,
      },
    },
  },
  editor: {
    codemirror: {
      // depend bindcodemirror bindcodemirror bindcodemirror bindcodemirror theme bindname bindname bindname
    },
    // 编辑器的高度，默认100%，如果挂载点存在内联设置的height则以内联样式为主
    height: '100%',
    // defaultModel 编辑器初始化后的默认模式，一共有三种模式：
    // 1. edit&preview 默认模式，一边编辑一边预览
    // 2. editOnly 纯编辑模式
    // 3. previewOnly 纯预览模式
    defaultModel: 'edit&preview',
    // 粘贴时是否自动将html转成markdown
    convertWhenPaste: true,
  },
  toolbars: {
    // 工具栏主题 dark | light
    theme: 'dark',
    // 是否显示工具栏
    showToolbar: true,
    // 工具栏按钮
    toolbar: [
      'bold', 'italic', 'strikethrough', '|',
      'color', 'header', 'list', 'insert', '|',
      'graph', 'togglePreview', 'settings',
    ],
    // 选中文字时弹出的气泡工具栏
    bubble: ['bold', 'italic', 'underline', 'strikethrough',
      'sub', 'sup', 'quote', 'ruby', 'size', 'color'],
    // 新行出现的浮动工具栏
    float: ['h1', 'h2', 'h3', 'checklist', 'quote',
      'quickTable', 'code'],
    sidebar: ['mobilePreview', 'copy', 'theme'],
  },
  // 预览区域配置
  previewer: {
    dom: false,
    className: 'cherry-markdown',
    enablePreviewerBubble: true,
    lazyLoadImg: {
      loadingImgPath: '',
      maxNumPerTime: 2,
      noLoadImgNum: 5,
      autoLoadImgNum: 5,
      maxTryTimesPerSrc: 2,
      failLoadingImgPath: '',
    },
  },
  // 是否开启纯预览模式
  isPreviewOnly: false,
  // 预览区域跟随编辑器光标自动滚动
  autoScrollByCursor: true,
  // 是否强制输出到body上
  forceAppend: true,
  // 语言设置
  locale: 'zh_CN',
  // 预览区域主题
  theme: [],
  // 回调函数
  callback: {
    afterChange: callbacks.afterChange,
    afterInit: callbacks.afterInit,
    beforeImageMounted: callbacks.beforeImageMounted,
    onClickPreview: callbacks.onClickPreview,
    onCopyCode: callbacks.onCopyCode,
    changeString2Pinyin: callbacks.changeString2Pinyin,
  },
  // 文件上传回调
  fileUpload: callbacks.fileUpload,
};

export default cloneDeep(defaultConfig);`;
