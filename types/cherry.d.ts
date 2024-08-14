import CodeMirror from 'codemirror';
import SyntaxBase from '../src/core/SyntaxBase';
import { FormulaMenu } from '@/toolbars/BubbleFormula';

export interface Cherry {
  options: CherryOptions;
}

export interface CherryOptions {
  openai: any;
  /** 第三方依赖 */
  externals: CherryExternalsOptions;
  /** 引擎配置 */
  engine: CherryEngineOptions;
  /** 编辑区域配置 */
  editor: CherryEditorOptions;
  /** 工具栏区域配置 */
  toolbars: CherryToolbarOptions;
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
  /** 有哪些主题 */
  theme: {className: string, label: string}[];
  /** 定义主题的作用范围，相同themeNameSpace的实例共享主题配置 */
  themeNameSpace: string,
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
    onCopyCode?: (e: ClipboardEvent, code: string) => string|false;
    onExpandCode?: (e: ClipboardEvent, code: string) => string|false;
    onUnExpandCode?: (e: ClipboardEvent, code: string) => string|false;
    changeString2Pinyin?: (str: string) => string;
    onPaste?: (clipboardData: ClipboardEvent['clipboardData']) => string|boolean;
  };
  event: {
    focus?: ({ e: MouseEvent, cherry: Cherry }) => void;
    blur?: ({ e: MouseEvent, cherry: Cherry }) => void;
    /** 编辑器内容改变并完成渲染后触发 */
    afterChange?: CherryLifecycle;
    /** 编辑器完成初次渲染后触发 */
    afterInit?: CherryLifecycle;
    selectionChange?: ({ selections: [], lastSelections: [], info} ) => void;
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

export interface CherryExternalsOptions {
  [key: string]: any;
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
  };
  /** 内置语法配置 */
  syntax?: Record<string, Record<string, any> | false>;
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
  /** depends on codemirror theme name: https://codemirror.net/demo/theme.htm */
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

export type CherryLifecycle = (text: String, html: String) => void;

export interface CherryPreviewerOptions {
  dom: HTMLDivElement | false;
  /** 预览区域的DOM className */
  className: string;
  enablePreviewerBubble: boolean;
  // 配置图片懒加载的逻辑
  lazyLoadImg: {
    // 加载图片时如果需要展示loaing图，则配置loading图的地址
    loadingImgPath: string;
    // 同一时间最多有几个图片请求，最大同时加载6张图片
    maxNumPerTime: 1 | 2 | 3 | 4 | 5 | 6,
    // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
    noLoadImgNum: number,
    // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
    autoLoadImgNum: -1 | number;
    // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
    maxTryTimesPerSrc: 0 | 1 | 2 | 3 | 4 | 5,
    // 加载一张图片之前的回调函数，函数return false 会终止加载操作
    beforeLoadOneImgCallback: (img: HTMLImageElement) => void | boolean;
    // 加载一张图片失败之后的回调函数
    failLoadOneImgCallback: (img: HTMLImageElement) => void;
    // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
    afterLoadOneImgCallback: (img: HTMLImageElement) => void;
    // 加载完所有图片后调用的回调函数
    afterLoadAllImgCallback: () => void;
  };
}

export type CherryToolbarSeparator = '|';

export type CherryCustomToolbar = string;

export type CherryDefaultToolbar =
  | CherryInsertToolbar
  | CherryToolbarSeparator
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'color'
  | 'header'
  | 'list'
  | 'image'
  | 'audio'
  | 'video'
  | 'link'
  | 'hr'
  | 'br'
  | 'code'
  | 'formula'
  | 'toc'
  | 'table'
  | 'pdf'
  | 'word'
  | 'graph'
  | 'settings';

export type CherryInsertToolbar = {
  insert: string[];
};

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
}

export interface CherryToolbarOptions {
  theme: 'light' | 'dark';
  toolbar?:
    | (CherryCustomToolbar | CherryDefaultBubbleToolbar | CherryDefaultBubbleToolbar | CherryDefaultToolbar)[]
    | false;
  toolbarRight?:
    | (CherryCustomToolbar | CherryDefaultBubbleToolbar | CherryDefaultBubbleToolbar | CherryDefaultToolbar)[]
    | false;
  /** 是否展示悬浮目录 */
  toc?: false | {
    updateLocationHash: boolean, // 要不要更新URL的hash
    defaultModel: 'pure' | 'full', // pure: 精简模式/缩略模式，只有一排小点； full: 完整模式，会展示所有标题
    showAutoNumber: boolean, // 是否显示自增序号
    position: 'absolute' | 'fixed', // 悬浮目录的悬浮方式。当滚动条在cherry内部时，用absolute；当滚动条在cherry外部时，用fixed
    cssText: string, // 额外样式
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
  /** 自定义快捷键 */
  shortcutKey?: Object | false;
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
    callback: (url: string, params?: {name?: string, poster?: string, isBorder?: boolean, isShadow?: boolean, isRadius?: boolean; width?: string, height?: string}
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
