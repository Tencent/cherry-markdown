import CodeMirror from 'codemirror';
import SyntaxBase from '../src/core/SyntaxBase';
import { FormulaMenu } from '@/toolbars/BubbleFormula';

export interface CherryExternalsOptions {
  [key: string]: any;
}

/**
* 自定义toolbar键名[key]
*/
export interface CustomMenuType {
  [key: string]: any;
}

type CherryToolbarsCustomType = {
  CustomMenuType: CustomMenuType
}

type CherryCustomOptions = {
  CustomToolbar: CherryToolbarsCustomType
}


/**
* @description By by default, the types declared by Cherry markdown are supported.
* @description If you want to force the **custom toolbar** key type, please refer to the following.
* @example  
* ```
* type CustomConfig = {
*  CustomToolbar: {
*    CustomMenuType: {
*      customMenu_fileUpload: string
*    },
*  },
* }
* 
* const cherryConfig: CherryOptions<CustomConfig> = {
*  ...
*  toolbars: {
*    toolbar: [
*     'bold',
*     'italic',
*       "customMenu_fileUpload",
*       {
*         customMenu_fileUpload: [
*           'image',
*           'audio',
*         ],
*       },
*       'settings',
*     ],
*     customMenu: {
*       customMenu_fileUpload: customMenu_fileUpload,
*    },
* }
* ```
* Among them, `customMenu` is the fixed attribute of the custom menu, and `customMenu_fileUpload` is the key name of the custom button
*/

export interface Cherry<T extends CherryCustomOptions = CherryCustomOptions> {
  options: CherryOptions<T>;
}

export type CherryOptions<T extends CherryCustomOptions = CherryCustomOptions> = Partial<_CherryOptions<T>>;

export interface _CherryOptions<T extends CherryCustomOptions = CherryCustomOptions> {
  openai: any;
  /** 第三方依赖 */
  externals: CherryExternalsOptions;
  /** 引擎配置 */
  engine: CherryEngineOptions;
  /** 编辑区域配置 */
  editor: CherryEditorOptions;
  /** 工具栏区域配置 */
  toolbars: CherryToolbarsOptions<T['CustomToolbar']> | undefined;
  // 打开draw.io编辑页的url，如果为空则drawio按钮失效
  drawioIframeUrl: string;
  // drawio iframe的样式
  drawioIframeStyle: string;
  /** 文件上传回调 */
  fileUpload: CherryFileUploadHandler;
  /** 上传文件的时候用来指定文件类型 */
  fileTypeLimitMap: {
    video: string,
    audio: string,
    image: string,
    word: string,
    pdf: string,
    file: string,
  };
  /** 文件是否支持多选 */
  multipleFileSelection: {
    video: boolean;
    audio: boolean;
    image: boolean;
    word: boolean;
    pdf: boolean;
    file: boolean;
  };
  /** 定义cherry缓存的作用范围，相同nameSpace的实例共享localStorage缓存 */
  nameSpace: string;
  /**
   * 有哪些主题，第三方可以自行扩展主题
   * @deprecated 不再支持theme的配置，统一在`themeSettings.themeList`中配置
   */
  theme: { className: string, label: string }[];
  /**
   * 定义主题的作用范围，相同themeNameSpace的实例共享主题配置
   * @deprecated 不再支持themeNameSpace的配置，统一在`nameSpace`中配置
   */
  themeNameSpace: string,
  themeSettings: {
    /** 主题列表，用于切换主题 */
    themeList: {
      /** 主题对应的class名 */
      className: string,
      /** 主题名称 */
      label: string
    }[],
    /** cherry主题，控制工具栏、编辑区、预览区的样式 */
    mainTheme: string,
    /** 代码块主题 */
    codeBlockTheme: string,
    /** 行内代码主题，只有 red 和 black 两个主题 */
    inlineCodeTheme: 'red' | 'black',
    /** 工具栏主题，只有 light 和 dark 两个主题，优先级低于 mainTheme */
    toolbarTheme: 'light' | 'dark',
  }
  callback: {
    /**
     * 全局的URL处理器，返回值将填充到编辑区域
     * @param url 来源url
     * @param srcType 来源类型
     */
    urlProcessor?: (url: string, srcType: 'image' | 'audio' | 'video' | 'autolink' | 'link') => string;
    /** 文件上传回调 */
    fileUpload?: CherryFileUploadHandler;
    /** 多文件上传回调 */
    fileUploadMulti?: CherryFileUploadHandler;
    /** 编辑器内容改变并完成渲染后触发 */
    afterChange?: CherryLifecycle;
    /** 编辑器完成初次渲染后触发 */
    afterInit?: CherryLifecycle;
    /** img 标签挂载前触发，可用于懒加载等场景 */
    beforeImageMounted?: (srcProp: string, src: string) => { srcProp: string; src: string };
    onClickPreview?: (e: MouseEvent) => void;
    onCopyCode?: (e: ClipboardEvent, code: string) => string | false;
    changeString2Pinyin?: (str: string) => string;
    onPaste?: (clipboardData: ClipboardEvent['clipboardData'], cherry: Cherry) => string | boolean;
    onExpandCode?: (e: MouseEvent, code: string) => string;
    onUnExpandCode?: (e: MouseEvent, code: string) => string;
  };
  event: {
    focus?: ({ e: MouseEvent, cherry: Cherry }) => void;
    blur?: ({ e: MouseEvent, cherry: Cherry }) => void;
    /** 编辑器内容改变并完成渲染后触发 */
    afterChange?: CherryLifecycle;
    /** 编辑器完成初次渲染后触发 */
    afterInit?: CherryLifecycle;
    /** 编辑器选区变化时触发 */
    selectionChange?: ({ selections: [], lastSelections: [], info }) => void;
    /** 变更语言时触发 */
    afterChangeLocale?: (locale: string) => void;
    /** 变更主题时触发 */
    changeMainTheme?: (theme: string) => void;
    /** 变更代码块主题时触发 */
    changeCodeBlockTheme?: (theme: string) => void;
  };
  /** 预览区域配置 */
  previewer: CherryPreviewerOptions;
  /** 是否开启仅预览模式 */
  isPreviewOnly: boolean;
  /** 预览区域跟随编辑器光标自动滚动 */
  autoScrollByCursor: boolean;
  /** 外层容器不存在时，是否强制输出到body上 */
  forceAppend: boolean;
  /** cherry初始化后是否检查 location.hash 尝试滚动到对应位置 */
  autoScrollByHashAfterInit: boolean;
  /** 挂载DOM节点ID，引擎模式下不生效 */
  id?: string;
  /** 挂载DOM节点，引擎模式下不生效 */
  el?: HTMLElement;
  /** 初始内容，引擎模式下不生效 */
  value: string;
  instanceId?: string;
  /** Locale **/
  locale: string;
  locales: {
    [locale: string]: Record<string, string>
  }
}

/**
 *  自定义语法注册配置
 */
export interface CustomSyntaxRegConfig {
  /** 语法class */
  syntaxClass: typeof SyntaxBase;
  /** 在某个hook前执行，填入hookName */
  before?: string;
  /** 在某个hook后执行，填入hookName */
  after?: string;
  /** 强制覆盖同名hook */
  force?: boolean;
}

export interface CherryEngineOptions {
  /** 引擎的全局配置 */
  global?: {
    /**
     * 是否启用经典换行逻辑
     * true：一个换行会被忽略，两个以上连续换行会分割成段落，
     * false： 一个换行会转成<br>，两个连续换行会分割成段落，三个以上连续换行会转成<br>并分割段落
     */
    classicBr?: boolean;
    /**
     * 全局的URL处理器，返回值将填充到编辑区域
     * @param url 来源url
     * @param srcType 来源类型
     */
    urlProcessor?: (url: string, srcType: 'image' | 'audio' | 'video' | 'autolink' | 'link') => string;
    /**
     * 额外允许渲染的html标签
     * 标签以英文竖线分隔，如：htmlWhiteList: 'iframe|script|style'
     * 默认为空，默认允许渲染的html见src/utils/sanitize.js whiteList 属性
     * 需要注意：
     *    - 启用iframe、script等标签后，会产生xss注入，请根据实际场景判断是否需要启用
     *    - 一般编辑权限可控的场景（如api文档系统）可以允许iframe、script等标签
     */
    htmlWhiteList?: string;
    /**
       * 适配流式会话的场景，开启后将具备以下特性：
       * 1. 代码块自动闭合，相当于强制 `engine.syntax.codeBlock.selfClosing=true`
       * 2. 文章末尾的段横线标题语法（`\n-`）失效
       *
       * 后续如果有新的需求，可提issue反馈
       */
    flowSessionContext?: boolean;
    /**
     * 流式会话时，在最后位置增加一个类似光标的dom
     * - 'default'：用cherry提供的默认样式
     * - ''：不增加任何dom
     * - '<span class="custom-cursor"></span>': 自定义的dom
     */
    flowSessionCursor?: string;
  };
  /** 内置语法配置 */
  syntax?: {
    // 语法开关
    // 'hookName': false,
    // 语法配置
    // 'hookName': {
    //
    // }
    link?: {
      /** 生成的<a>标签追加target属性的默认值 空：在<a>标签里不会追加target属性， _blank：在<a>标签里追加target="_blank"属性 */
      target?: '_blank' | '',
      /** 生成的<a>标签追加rel属性的默认值 空：在<a>标签里不会追加rel属性， nofollow：在<a>标签里追加rel="nofollow：在"属性*/
      rel?: '_blank' | 'nofollow' | '',
    },
    autoLink?: {
      /** 生成的<a>标签追加target属性的默认值 空：在<a>标签里不会追加target属性， _blank：在<a>标签里追加target="_blank"属性 */
      target?: '_blank' | '',
      /** 生成的<a>标签追加rel属性的默认值 空：在<a>标签里不会追加rel属性， nofollow：在<a>标签里追加rel="nofollow：在"属性*/
      rel?: '_blank' | 'nofollow' | '',
      /** 是否开启短链接 默认:true */
      enableShortLink?: boolean,
      /** 短链接长度 默认:20 */
      shortLinkLength?: number,
    },
    list?: {
      listNested?: boolean, // 同级列表类型转换后变为子级
      indentSpace?: number, // 默认2个空格缩进
    },
    table: {
      enableChart?: boolean,
      selfClosing?: boolean, // 自动闭合，为true时，当输入第一行table内容时，cherry会自动按表格进行解析
      // chartRenderEngine: EChartsTableEngine,
      // externals: ['echarts'],
    },
    inlineCode?: {
      /**
       * @deprecated 不再支持theme的配置，统一在`themeSettings.inlineCodeTheme`中配置
       */
      // theme: 'red',
    },
    codeBlock?: {
      /**
       * @deprecated 不再支持theme的配置，统一在`themeSettings.codeBlockTheme`中配置
       */
      // theme: 'dark', // 默认为深色主题
      wrap?: boolean, // 超出长度是否换行，false则显示滚动条
      lineNumber?: boolean, // 默认显示行号
      copyCode?: boolean, // 是否显示“复制”按钮
      editCode?: boolean, // 是否显示“编辑”按钮
      changeLang?: boolean, // 是否显示“切换语言”按钮
      expandCode?: boolean, // 是否展开/收起代码块，当代码块行数大于10行时，会自动收起代码块
      selfClosing?: boolean, // 自动闭合，为true时，当md中有奇数个```时，会自动在md末尾追加一个```
      customRenderer?: {
        // 自定义语法渲染器
      },
      mermaid?: {
        svg2img?: boolean, // 是否将mermaid生成的画图变成img格式
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
      indentedCodeBlock?: boolean,
      /**
         * 自定义按钮，出现在代码块右上角
         **/
      customBtns?: {
        'html': '',
        'onClick': (event: MouseEvent, code: string, language: string) => {},
      }[],
    },
    emoji?: {
      useUnicode?: boolean, // 是否使用unicode进行渲染
    },
    fontEmphasis?: {
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
      allowWhitespace?: boolean,
      selfClosing?: boolean, // 自动闭合，为true时，当输入**XXX时，会自动在末尾追加**
    },
    strikethrough?: {
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
      needWhitespace?: boolean,
    },
    mathBlock?: {
      engine?: 'katex' | 'MathJax', // katex或MathJax
      src?: string,
      plugins?: boolean, // 加载插件
    },
    inlineMath?: {
      engine?: 'katex' | 'MathJax', // katex或MathJax
      src?: string,
    },
    toc?: {
      /** 默认只渲染一个目录 */
      allowMultiToc?: boolean,
      /** 是否显示自增序号 */
      showAutoNumber?: boolean,
    },
    header?: {
      /**
       * 标题的样式：
       *  - default       默认样式，标题前面有锚点
       *  - autonumber    标题前面有自增序号锚点
       *  - none          标题没有锚点
       */
      anchorStyle?: 'default' | 'autonumber' | 'none',
      /**
       * 是否开启严格模式
       *    true：严格模式
       *      # head ⭕️ valid
       *      #head ❌ invalid
       *    false：宽松模式
       *      # head ⭕️ valid
       *      #head ⭕️ valid
       */
      strict?: boolean,
    },
    htmlBlock?: {
      /**
       * 是否过滤html标签中的style属性
       *    true：过滤style属性
       *    false：不过滤style属性
       */
      filterStyle?: boolean,
    },
  };
  /** 自定义语法 */
  customSyntax?: Record<string, CustomSyntaxRegConfig['syntaxClass'] | CustomSyntaxRegConfig>;
}

export type EditorMode =
  /** 仅编辑 */
  | 'editOnly'
  /** 仅预览 */
  | 'previewOnly'
  /** 双栏编辑 */
  | 'edit&preview';

export interface CherryEditorOptions {
  id?: string; // textarea 的id属性值
  name?: string; // textarea 的name属性值
  autoSave2Textarea?: boolean; // 是否自动将编辑区的内容回写到textarea里
  /**
   * @deprecated 不再支持theme的配置，废弃该功能，统一由`themeSettings.mainTheme`配置
   */
  theme?: string;
  /** 编辑器的高度，默认100%，如果挂载点存在内联设置的height则以内联样式为主 */
  height?: string;
  /** 编辑器初始化后的模式 */
  defaultModel?: EditorMode;
  /** 粘贴时是否自动将html转成markdown */
  convertWhenPaste?: boolean;
  /** 快捷键风格，目前仅支持 sublime 和 vim */
  keyMap?: 'sublime' | 'vim';
  /** 透传给codemirror的配置项 */
  codemirror?: object;
  /** 书写风格，normal 普通 | typewriter 打字机 | focus 专注，默认normal */
  writingStyle?: string;
  editor?: CodeMirror.Editor;
  /** 在初始化后是否保持网页的滚动，true：保持滚动；false：网页自动滚动到cherry初始化的位置 */
  keepDocumentScrollAfterInit?: boolean;
  /** 是否高亮全角符号 ·|￥|、|：|“|”|【|】|（|）|《|》 */
  showFullWidthMark?: boolean;
  /** 是否显示联想框 */
  showSuggestList?: boolean;
}

export type CherryLifecycle = (text: string, html: string) => void;

export interface CherryPreviewerOptions {
  dom?: HTMLDivElement | false;
  /** 预览区域的DOM className */
  className?: string;
  enablePreviewerBubble?: boolean;
  floatWhenClosePreviewer?: boolean;
  // 配置图片懒加载的逻辑
  lazyLoadImg?: {
    // 加载图片时如果需要展示loaing图，则配置loading图的地址
    loadingImgPath?: string;
    // 同一时间最多有几个图片请求，最大同时加载6张图片
    maxNumPerTime?: 1 | 2 | 3 | 4 | 5 | 6,
    // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
    noLoadImgNum?: number,
    // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
    autoLoadImgNum?: -1 | number;
    // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
    maxTryTimesPerSrc?: 0 | 1 | 2 | 3 | 4 | 5,
    // 加载一张图片之前的回调函数，函数return false 会终止加载操作
    beforeLoadOneImgCallback?: (img: HTMLImageElement) => void | boolean;
    // 加载一张图片失败之后的回调函数
    failLoadOneImgCallback?: (img: HTMLImageElement) => void;
    // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
    afterLoadOneImgCallback?: (img: HTMLImageElement) => void;
    // 加载完所有图片后调用的回调函数
    afterLoadAllImgCallback?: () => void;
  };
}

export type CherryToolbarSeparator = '|';

export type CherryDefaultToolbar =
  | 'audio'
  | 'bar-table'
  | 'bold'
  | 'br'
  | 'checklist'
  | 'code'
  | 'codeTheme'
  | 'color'
  | 'copy'
  | 'detail'
  | 'drawIo'
  | 'export'
  | 'file'
  | 'fullScreen'
  | 'formula'
  | 'graph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'header'
  | 'hr'
  | 'image'
  | 'insert'
  | 'italic'
  | 'justify'
  | 'line-table'
  | 'link'
  | 'list'
  | 'mobilePreview'
  | 'ol'
  | 'panel'
  | 'pdf'
  | 'publish'
  | 'quickTable'
  | 'quote'
  | 'redo'
  | 'ruby'
  | 'settings'
  | 'size'
  | 'strikethrough'
  | 'sub'
  | 'sup'
  | 'switchModel'
  | 'table'
  | 'theme'
  | 'toc'
  | 'togglePreview'
  | 'underline'
  | 'undo'
  | 'ul'
  | 'video'
  | 'word'
  | 'wordCount';

export type CherryDefaultBubbleToolbar =
  | CherryToolbarSeparator
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'sub'
  | 'sup'
  | 'size'
  | 'color';

export type CherryDefaultFloatToolbar =
  | CherryToolbarSeparator
  | 'h1'
  | 'h2'
  | 'h3'
  | 'checklist'
  | 'quote'
  | 'quickTable'
  | 'code';

export type SupportPlatform = 'wechat' | 'toutiao';
export interface CherryPublishToolbarOption {
  /** 发布平台名称 */
  name: string;
  /** 发布平台唯一标识 */
  key: SupportPlatform;
  /** 发布平台图标地址 */
  icon?: string;
  /** 发布平台图标名称(需存在) */
  iconName?: string;
  /** 发布平台服务地址 */
  serviceUrl: string;
  /**
   * 额外注入的payload
   */
  injectPayload?: Record<string, any> | (() => Promise<Record<string, any>>) | (() => Record<string, any>);
}

export interface CherryFormulaToolbarOption {
  /** 显示外链 */
  showLatexLive?: boolean;
  /** 使用默认模板 */
  templateConfig?: boolean | Record<string, FormulaMenu>;
}
export interface CherryToolbarConfig {
  /** 发布功能配置 */
  publish?: CherryPublishToolbarOption[]
  /** 公式 */
  formula?: CherryFormulaToolbarOption
  changeLocale?: CherryChangeLocaleToolbarOption[]
}
export interface CherryChangeLocaleToolbarOption {
  locale: string;
  name: string;
}
export interface CherryToolbarsOptions<F extends CherryToolbarsCustomType = CherryToolbarsCustomType> {
  /**
   * @deprecated 不再支持theme的配置，统一在`themeSettings.toolbarTheme`中配置
   */
  theme?: 'light' | 'dark';
  toolbar?:
  | (CherryDefaultBubbleToolbar |
    CherryDefaultToolbar |
    keyof Partial<F['CustomMenuType']> |
  { [K in (keyof Partial<F['CustomMenuType']>) | CherryDefaultToolbar]?: (keyof F['CustomMenuType'] | CherryDefaultToolbar)[] })[]
  | false;
  toolbarRight?:
  | (CherryDefaultBubbleToolbar | CherryDefaultToolbar)[]
  | false;
  /** 是否展示悬浮目录 */
  toc?: false | {
    /** 要不要更新URL的hash */
    updateLocationHash?: boolean,
    /** pure: 精简模式/缩略模式，只有一排小点； full: 完整模式，会展示所有标题 */
    defaultModel?: 'pure' | 'full',
    /** 是否显示自增序号 */
    showAutoNumber?: boolean,
    /** 悬浮目录的悬浮方式。当滚动条在cherry内部时，用absolute；当滚动条在cherry外部时，用fixed */
    position?: 'absolute' | 'fixed',
    /** 额外样式 */
    cssText?: string,
  };
  /** 不展示在编辑器中的工具栏，只使用工具栏的api和快捷键功能 */
  hiddenToolbar?: any[];
  /** 是否展示顶部工具栏 */
  showToolbar?: boolean;
  /** 侧边栏配置 */
  sidebar?: any[] | false;
  /** 选中悬停菜单配置 */
  bubble?: any[] | false;
  /** 新行悬停菜单配置 */
  float?: any[] | false;
  customMenu?: Record<string, any>;
  /**
   * 自定义快捷键 
   * @deprecated 请使用`shortcutKeySettings`
   */
  shortcutKey?: Object | false;
  /**
   * 自定义快捷键
   */
  shortcutKeySettings?: {
    /** 是否替换已有的快捷键, true: 替换默认快捷键； false： 会追加到默认快捷键里，相同的shortcutKey会覆盖默认的 */
    isReplace?: boolean,
    shortcutKeyMap?: { [shortcutKey: string]: ShortcutKeyMapStruct };
  };
  /** 一些按钮的配置信息 */
  config?: CherryToolbarConfig;
}

export interface CherryFileUploadHandler {
  /**
   * @param file 用户上传的文件对象
   * @param callback 回调函数，接收最终的文件url
   */
  (file: File,
    /**
     * @param params.name 回填的alt信息
     * @param params.poster 封面图片地址（视频的场景下生效）
     * @param params.isBorder 是否有边框样式（图片场景下生效）
     * @param params.isShadow 是否有阴影样式（图片场景下生效）
     * @param params.isRadius 是否有圆角样式（图片场景下生效）
     * @param params.width 设置宽度，可以是像素、也可以是百分比（图片、视频场景下生效）
     * @param params.height 设置高度，可以是像素、也可以是百分比（图片、视频场景下生效）
     */
    callback: (url: string, params?: { name?: string, poster?: string, isBorder?: boolean, isShadow?: boolean, isRadius?: boolean; width?: string, height?: string }
    ) => void): void;
}


type ShortcutKeyMapStruct = {
  /**
   * 原始hook
   */
  hookName: string;
  /**
   * 展示名称
   */
  aliasName: string;
  /**
   * 其他扩展字段
   * 如果存在则会赋值给 data-[fieldName]=value 存储记录
   * @summary 切记不要使用驼峰，因为dataset 会全部转成全小写，除非你在取值的时候能记住，否则永远不要这么做
   */
  [x: string]: string | number;
}
