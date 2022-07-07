import SyntaxBase from '../src/core/SyntaxBase';

export interface Cherry {
  options: CherryOptions;
}

export interface CherryOptions {
  /** 第三方依赖 */
  externals: CherryExternalsOptions;
  /** 引擎配置 */
  engine: CherryEngineOptions;
  /** 编辑区域配置 */
  editor: CherryEditorOptions;
  /** 工具栏区域配置 */
  toolbars: CherryToolbarOptions;
  /** 文件上传回调 */
  fileUpload: CherryFileUploadHandler;
  callback: {
    /** 编辑器内容改变并完成渲染后触发 */
    afterChange: CherryLifecycle;
    /** 编辑器完成初次渲染后触发 */
    afterInit: CherryLifecycle;
    /** img 标签挂载前触发，可用于懒加载等场景 */
    beforeImageMounted: (srcProp: string, src: string) => { srcProp: string; src: string };
    onClickPreview: (e: MouseEvent) => void;
    onCopyCode: (e: ClipboardEvent, code: string) => string|false;
  };
  /** 预览区域配置 */
  previewer: CherryPreviewerOptions;
  /** 是否开启仅预览模式 */
  isPreviewOnly: boolean;
  /** 预览区域跟随编辑器光标自动滚动 */
  autoScrollByCursor: boolean;
  /** 外层容器不存在时，是否强制输出到body上 */
  forceAppend: boolean;
  /** 挂载DOM节点ID，引擎模式下不生效 */
  id?: string;
  /** 挂载DOM节点，引擎模式下不生效 */
  el?: HTMLElement;
  /** 初始内容，引擎模式下不生效 */
  value: string;
  instanceId?: string;
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
  /** depends on codemirror theme name: https://codemirror.net/demo/theme.htm */
  theme?: string;
  /** 编辑器的高度，默认100%，如果挂载点存在内联设置的height则以内联样式为主 */
  height?: string;
  /** 编辑器初始化后的模式 */
  defaultModel?: EditorMode;
  /** 粘贴时是否自动将html转成markdown */
  convertWhenPaste?: boolean;
  /** 透传给codemirror的配置项 */
  codemirror?: object;
}

export type CherryLifecycle = (text: string, html: string) => void;

export interface CherryPreviewerOptions {
  dom: HTMLDivElement | false;
  /** 预览区域的DOM className */
  className: string;
  enablePreviewerBubble: boolean;
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

export interface CherryToolbarOptions {
  theme: 'light' | 'dark';
  toolbar?:
    | (CherryCustomToolbar | CherryDefaultBubbleToolbar | CherryDefaultBubbleToolbar | CherryDefaultToolbar)[]
    | false;
  /** 是否展示顶部工具栏 */
  showToolbar?: boolean;
  /** 侧边栏配置 */
  sidebar?: any[] | false;
  /** 选中悬停菜单配置 */
  bubble?: any[] | false;
  /** 新行悬停菜单配置 */
  float?: any[] | false;
  customMenu?: Record<string, any>;
}

export interface CherryFileUploadHandler {
  /**
   * @param file 用户上传的文件对象
   * @param callback 回调函数，接收最终的文件url
   */
  (file: File, callback: (url: string) => void): void;
}
