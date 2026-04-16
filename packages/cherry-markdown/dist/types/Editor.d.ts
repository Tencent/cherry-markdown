/** @type {import('../../types/editor')} */
export default class Editor {
    /**
     * @constructor
     * @param {Partial<EditorConfiguration>} options
     */
    constructor(options: Partial<EditorConfiguration>);
    /**
     * @property
     * @type {EditorConfiguration}
     */
    options: EditorConfiguration;
    /** @type {CM6AdapterType | null} */
    editor: CM6AdapterType | null;
    animation: {
        timer: number;
        destinationTop: number;
    };
    disableScrollListener: boolean;
    /** @type {Array<{elm: Element, evType: string, fn: Function, useCapture: boolean}>} */
    domEventListeners: Array<{
        elm: Element;
        evType: string;
        fn: Function;
        useCapture: boolean;
    }>;
    /** @type {import('@codemirror/view').KeyBinding[]} */
    defaultKeymap: import("@codemirror/view").KeyBinding[];
    /** @type {boolean} */
    shortcutDisabled: boolean;
    /** @type {Compartment} */
    keymapCompartment: Compartment;
    /** @type {Compartment} */
    vimCompartment: Compartment;
    /** @type {ReturnType<typeof setTimeout> | number} */
    dealSpecialWordsTimer: ReturnType<typeof setTimeout> | number;
    /** @type {number} */
    dealSpecialWordsStartTime: number;
    /** @type {boolean} */
    isDestroyed: boolean;
    /** @type {((key: string) => boolean) | null} */
    arrowKeyInterceptor: ((key: string) => boolean) | null;
    $cherry: import("./Cherry").default;
    refresh(): void;
    /**
     * 禁用快捷键
     * @param {boolean} disable 是否禁用快捷键
     */
    disableShortcut: (disable?: boolean) => void;
    /**
     * 在onChange后处理draw.io的xml数据和图片的base64数据，对这种超大的数据增加省略号，
     * 以及对全角符号进行特殊染色。
     */
    dealSpecialWords: () => void;
    /**
     * 实际执行特殊词处理的逻辑
     * @private
     */
    private doDealSpecialWordsInternal;
    /**
     * 大文档降级处理：仅处理高优先级标记，跳过低优先级标记以保证性能
     * @private
     */
    private doPartialMarkProcessing;
    /**
     * 一次性收集所有已有标记（避免 O(n²) 检查）
     * @returns {Set<string>} 已有标记的键集合，格式为 "from_to_className"
     */
    getExistingMarksSet: () => Set<string>;
    /**
     * @typedef {Object} MarkRange
     * @property {number} begin - 起始位置
     * @property {number} end - 结束位置
     * @property {string} [bigString] - 可选的大字符串（用于标记内容）
     * @property {string} [id] - 可选的 ID
     */
    /**
     * 收集标记项（不立即应用，用于批量处理）
     * @param {RegExp} reg - 正则表达式
     * @param {string} className - CSS 类名
     * @param {Array<import('../types/editor').BatchMarkItem>} targetArray - 目标数组，用于收集标记项
     * @param {(fromPos: number, matchResult: RegExpMatchArray) => MarkRange | null} [callback] - 可选的回调函数
     * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
     */
    collectMarkItems: (reg: RegExp, className: string, targetArray: Array<import("../types/editor").BatchMarkItem>, callback?: (fromPos: number, matchResult: RegExpMatchArray) => {
        /**
         * - 起始位置
         */
        begin: number;
        /**
         * - 结束位置
         */
        end: number;
        /**
         * - 可选的大字符串（用于标记内容）
         */
        bigString?: string;
        /**
         * - 可选的 ID
         */
        id?: string;
    } | null, existingMarksSet?: Set<string>) => void;
    /**
     * 收集全角字符标记项（不立即应用）
     * @param {Array} targetArray - 目标数组，用于收集标记项
     * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
     */
    collectFullWidthMarkItems: (targetArray: any[], existingMarksSet?: Set<string>) => void;
    /**
     * 收集单个匹配结果的数据（不立即创建 mark）
     * @param {CM6Adapter} editor - 编辑器实例
     * @param {SearchCursor} searcher - 搜索游标
     * @param {Array} matchResult - 正则匹配结果
     * @param {string} className - CSS 类名
     * @param {Function} [callback] - 可选的回调函数，签名：callback(fromPos: number, matchResult: Array) -> {begin: number, end: number, bigString: string}
     * @param {Set<string>} [existingMarksSet] - 已有标记集合（用于避免 O(n²) 检查）
     * @returns {import('../../types/editor').BatchMarkItem | null} 返回标记数据或 null（如果已存在或无效）
     */
    collectMarkItem: (editor: CM6Adapter, searcher: SearchCursor, matchResult: any[], className: string, callback?: Function, existingMarksSet?: Set<string>) => import("../../types/editor").BatchMarkItem | null;
    /**
     * 批量应用所有装饰（使用单个 Transaction）
     * @param {CM6Adapter} editor - 编辑器实例
     * @param {Array<import('../../types/editor').BatchMarkItem>} markItems - 标记项数组
     * @returns {void}
     */
    applyBatchMarks: (editor: CM6Adapter, markItems: Array<import("../../types/editor").BatchMarkItem>) => void;
    /**
     * 计算 mark 范围
     * @param {Array} matchResult - 正则匹配结果
     * @param {number} fromPos - 匹配起始位置
     * @param {Function} [callback] - 可选的回调函数
     * @returns {{begin: number, end: number, bigString: string} | null}
     */
    calculateMarkRange: (matchResult: any[], fromPos: number, callback?: Function) => {
        begin: number;
        end: number;
        bigString: string;
    } | null;
    /**
     * 将全角符号转换为半角符号
     * @param {EditorView | CM6AdapterType} editorView - 编辑器实例
     * @param {MouseEvent} evt - 鼠标事件对象
     */
    toHalfWidth(editorView: EditorView | CM6AdapterType, evt: MouseEvent): void;
    /**
     *
     * @param {KeyboardEvent} e
     * @param {EditorView} editorView
     */
    /**
     * 处理键盘弹起事件（keyup），用于高亮预览区对应的行
     * @param {KeyboardEvent} e - 键盘事件对象
     * @param {EditorView} editorView - 编辑器实例
     */
    onKeyup: (e: KeyboardEvent, editorView: EditorView) => void;
    /**
     *
     * @param {ClipboardEvent} e
     * @param {CM6AdapterType} editorView
     */
    onPaste(e: ClipboardEvent, editorView: CM6AdapterType): void;
    /**
     * 异步粘贴回调处理
     * @param {Object} params - 回调参数
     * @param {string} params.html - HTML 内容
     * @param {string} params.htmlText - 纯文本 HTML
     * @param {string} params.mdText - Markdown 文本
     * @param {string} params.randomId - 随机 ID
     * @param {CM6AdapterType} editorView - 编辑器视图
     */
    onPasteCallback({ html, htmlText, mdText, randomId }: {
        html: string;
        htmlText: string;
        mdText: string;
        randomId: string;
    }, editorView: CM6AdapterType): void;
    /**
     * 调用第三方的粘贴回调
     * @param {ClipboardEvent} event - 粘贴事件
     * @param {ClipboardEvent['clipboardData']} clipboardData - 剪贴板数据
     * @param {CM6AdapterType} editorView - 编辑器视图
     * @returns {boolean} true: 需要继续处理粘贴内容，false: 不需要继续处理粘贴内容
     */
    handleThirdPaste(event: ClipboardEvent, clipboardData: ClipboardEvent["clipboardData"], editorView: CM6AdapterType): boolean;
    /**
     *
     * @param {ClipboardEvent} event
     * @param {ClipboardEvent['clipboardData']} clipboardData
     * @param {CM6AdapterType} editorView
     * @returns {boolean | void}
     */
    handlePaste(event: ClipboardEvent, clipboardData: ClipboardEvent["clipboardData"], editorView: CM6AdapterType): boolean | void;
    fileUploadCount: number;
    /**
     * 将粘贴的 HTML 转换为 Markdown 并插入编辑器
     * @param {ClipboardEvent | null} event - 粘贴事件（可能为 null，来自异步回调时）
     * @param {string} html - HTML 内容
     * @param {string} htmlText - 纯文本内容
     * @param {CM6AdapterType} editorView - CodeMirror 6 适配器
     * @param {number} [overrideFrom] - 可选，覆盖插入起始位置（用于异步回调场景）
     * @param {number} [overrideTo] - 可选，覆盖插入结束位置（用于异步回调场景）
     */
    formatHtml2MdWhenPaste(event: ClipboardEvent | null, html: string, htmlText: string, editorView: CM6AdapterType, overrideFrom?: number, overrideTo?: number): void;
    /**
     *
     * @param {EditorView} editorView
     */
    onScroll: (editorView: EditorView) => void;
    /**
     *
     * @param {EditorView} editorView - 当前的CodeMirror实例
     * @param {MouseEvent} evt
     */
    onMouseDown: (editorView: EditorView, evt: MouseEvent) => void;
    /**
     * 光标变化事件
     */
    onCursorActivity: () => void;
    /**
     *
     * @param {*} previewer
     */
    init(previewer: any): void;
    previewer: any;
    /**
     * 跳转到指定行，支持行内百分比偏移
     * @param {number | null} beginLine 起始行（0-indexed），传入null时跳转到文档尾部
     * @param {number} [endLine] 终止行（保留参数，当前未使用）
     * @param {number} [percent] 行内百分比偏移，取值0~1
     */
    jumpToLine(beginLine: number | null, endLine?: number, percent?: number): void;
    /**
     *
     * @param {number | null} lineNum
     * @param {number} [endLine]
     * @param {number} [percent]
     */
    scrollToLineNum(lineNum: number | null, endLine?: number, percent?: number): void;
    /**
     *
     * @returns {HTMLElement}
     */
    getEditorDom(): HTMLElement;
    /**
     * 添加事件监听器
     * @param {string} event 事件名
     * @param {EditorEventCallback} callback 回调函数
     */
    addListener(event: string, callback: EditorEventCallback): void;
    /**
     * 初始化书写风格
     */
    initWritingStyle(): void;
    /**
     * 刷新书写状态
     */
    refreshWritingStatus(): void;
    /**
     * 修改书写风格
     */
    setWritingStyle(writingStyle: any): void;
    /**
     * 设置编辑器值
     */
    setValue(value?: string): void;
    /**
     * 获取编辑器值
     */
    getValue(): string;
    /**
     * 替换选中的文本
     */
    replaceSelections(text?: any[]): void;
    /**
     * 获取光标位置
     */
    getCursor(): {
        line: number;
        ch: number;
    };
    /**
     * 设置光标位置
     */
    setCursor(line: any, ch: any): void;
    /**
     * 聚焦编辑器
     */
    focus(): void;
    /**
     * 获取选中的文本
     * @returns {string[]}
     */
    getSelections(): string[];
    /**
     * 获取当前选中的文本
     * @returns {string}
     */
    getSelection(): string;
    /**
     * 设置选区
     * @param {Object} from - 起始位置 {line: number, ch: number}
     * @param {Object} to - 结束位置 {line: number, ch: number}
     */
    setSelection(from: any, to: any): void;
    /**
     * 字数统计
     * @param {number} type - 统计类型：1-字符/单词/行数，2-段落/图片/代码块，3-中文/英文/数字/符号
     * @returns {Object} 统计结果
     */
    wordCount(type: number): any;
    /**
     * 销毁编辑器实例，清理资源
     */
    destroy(): void;
    /**
     * 添加并跟踪 DOM 事件监听器
     * @param {Element} elm - DOM 元素
     * @param {string} evType - 事件类型
     * @param {Function} fn - 事件处理函数
     * @param {boolean} useCapture - 是否使用捕获
     */
    addTrackedEvent(elm: Element, evType: string, fn: Function, useCapture?: boolean): void;
}
export type EditorConfiguration = import("../../types/editor").EditorConfiguration;
export type EditorEventCallback = import("../../types/editor").EditorEventCallback<keyof import("../../types/editor").EditorEventMap>;
export type CM6AdapterType = import("../../types/editor").CM6Adapter;
export type TextMarker = import("../../types/editor").TextMarker;
export type MarkInfo = import("../../types/editor").MarkInfo;
export type MarkTextOptions = import("../../types/editor").MarkTextOptions;
export type SearchCursor = import("../../types/editor").SearchCursor;
export type ScrollInfo = import("../../types/editor").ScrollInfo;
export type SelectionRange = import("@codemirror/state").SelectionRange;
export type Rect = import("@codemirror/view").Rect;
export type MarkEffectValue = {
    /**
     * - 起始位置（文档偏移量）
     */
    from: number;
    /**
     * - 结束位置（文档偏移量）
     */
    to: number;
    /**
     * - 装饰对象
     */
    decoration?: Decoration;
    /**
     * - 标记选项
     */
    options?: MarkTextOptions;
    /**
     * - 用于追踪 mark 的唯一标识符
     */
    markId?: string;
};
import { Compartment } from '@codemirror/state';
/**
 * CodeMirror 6 适配器
 * 提供对 EditorView 的封装，使用 CM6 原生类型
 * @implements {CM6AdapterType}
 */
declare class CM6Adapter implements CM6AdapterType {
    /**
     * 创建 CM6Adapter 实例
     * @param {EditorView} view - EditorView 实例
     * @param {Compartment} [vimCompartment] - vim 模式的 Compartment（可选，用于多实例隔离）
     */
    constructor(view: EditorView, vimCompartment?: Compartment);
    /** @type {EditorView} */
    view: EditorView;
    /** @type {Map<string, Array<(...args: unknown[]) => void>>} */
    eventHandlers: Map<string, Array<(...args: unknown[]) => void>>;
    /** @type {'sublime' | 'vim'} */
    currentKeyMap: "sublime" | "vim";
    /** @type {Compartment | null} */
    vimCompartment: Compartment | null;
    /** @type {number} 实例级 markId 计数器 */
    markIdCounter: number;
    /**
     * 获取编辑器状态
     * @returns {EditorState}
     */
    get state(): EditorState;
    /**
     * 获取滚动容器 DOM 元素
     * @returns {HTMLElement}
     */
    get scrollDOM(): HTMLElement;
    /**
     * 分发事务到编辑器
     * @param {...import('@codemirror/state').TransactionSpec} specs
     * @returns {void}
     */
    dispatch(...specs: import("@codemirror/state").TransactionSpec[]): void;
    /**
     * 请求测量
     * @template T
     * @param {{ read: (view: EditorView) => T; write?: (measure: T, view: EditorView) => void }} [request]
     * @returns {void}
     */
    requestMeasure<T>(request?: {
        read: (view: EditorView) => T;
        write?: (measure: T, view: EditorView) => void;
    }): void;
    /**
     * 坐标转位置
     * @param {{ x: number; y: number }} coords
     * @returns {number | null}
     */
    posAtCoords(coords: {
        x: number;
        y: number;
    }): number | null;
    /**
     * 获取行块信息
     * @param {number} pos
     * @returns {import('@codemirror/view').BlockInfo}
     */
    lineBlockAt(pos: number): import("@codemirror/view").BlockInfo;
    /**
     * 获取所有选区的文本
     * @returns {string[]} 所有选区文本的数组
     */
    getSelections(): string[];
    /**
     * 替换当前选中的文本
     * @param {string} text - 替换文本
     * @param {'around' | 'start'} [select='around'] - 替换后的选区行为
     *   - 'around': 光标移动到替换文本末尾
     *   - 'start': 光标移动到替换文本开头
     * @returns {void}
     */
    replaceSelection(text: string, select?: "around" | "start"): void;
    /**
     * 替换多个选区的文本
     * @param {string[]} texts - 替换文本数组
     * @param {'around' | 'start'} [select='around'] - 替换后的选区行为
     * @returns {void}
     */
    replaceSelections(texts: string[], select?: "around" | "start"): void;
    /**
     * 设置选区
     * @param {number} anchor - 选区锚点（文档偏移量）
     * @param {number} [head] - 选区头部（文档偏移量），不传则与 anchor 相同
     * @param {Object} [options]
     * @param {string} [options.userEvent] - 用户事件类型
     * @param {boolean} [options.scrollIntoView] - 是否滚动到选区位置
     * @returns {void}
     */
    setSelection(anchor: number, head?: number, options?: {
        userEvent?: string;
        scrollIntoView?: boolean;
    }): void;
    /**
     * 获取所有选区
     * @returns {readonly SelectionRange[]} CM6 SelectionRange 数组
     */
    listSelections(): readonly SelectionRange[];
    /**
     * 替换指定范围的文本
     * @param {string} text - 替换文本
     * @param {number} from - 起始位置（文档偏移量）
     * @param {number} [to] - 结束位置（文档偏移量），不传则在 from 位置插入
     * @returns {void}
     */
    replaceRange(text: string, from: number, to?: number): void;
    /**
     * 获取文档对象
     * @CM5_COMPAT 兼容 CodeMirror 5 API，返回自身以便链式调用
     * @returns {CM6Adapter}
     */
    getDoc(): CM6Adapter;
    /**
     * 获取指定位置的屏幕坐标
     * @param {number} [pos] - 文档位置（偏移量），不传则使用当前光标位置
     * @returns {Rect | null} 坐标对象 {left, top, bottom, right} 或 null
     */
    cursorCoords(pos?: number): Rect | null;
    /**
     * 将指定位置滚动到可视区域
     * @CM5_COMPAT 兼容 CodeMirror 5 API，内部已改用 EditorView.scrollIntoView effect
     * @param {number} pos - 文档位置（偏移量）
     * @returns {void}
     */
    scrollIntoView(pos: number): void;
    /**
     * 设置编辑器选项
     * @param {'value' | 'keyMap' | string} option - 选项名称
     * @param {string | boolean | object} value - 选项值
     * @returns {void}
     */
    setOption(option: "value" | "keyMap" | string, value: string | boolean | object): void;
    /**
     * 设置键盘映射模式
     * @param {'sublime' | 'vim'} mode - 'sublime' 或 'vim' 模式
     * @returns {Promise<void>}
     */
    setKeyMap(mode: "sublime" | "vim"): Promise<void>;
    /**
     * 获取编辑器选项
     * @param {'readOnly' | 'disableInput' | 'value' | string} option - 选项名称
     * @returns {string | boolean | object | null} 选项值
     */
    getOption(option: "readOnly" | "disableInput" | "value" | string): string | boolean | object | null;
    /**
     * 设置搜索查询并高亮匹配
     * @param {string} query - 搜索字符串或正则表达式
     * @param {boolean} [caseSensitive=false] - 是否区分大小写
     * @param {boolean} [isRegex=false] - 是否为正则表达式
     * @returns {void}
     */
    setSearchQuery(query: string, caseSensitive?: boolean, isRegex?: boolean): void;
    /**
     * 清除搜索高亮
     * @returns {void}
     */
    clearSearchQuery(): void;
    /**
     * 标记指定范围的文本
     * @param {number} from - 起始位置（文档偏移量）
     * @param {number} to - 结束位置（文档偏移量）
     * @param {MarkTextOptions} options - 标记选项
     * @returns {TextMarker} 标记对象
     */
    markText(from: number, to: number, options: MarkTextOptions): TextMarker;
    /**
     * 查找指定范围内的标记
     * @param {number} from - 起始位置（文档偏移量）
     * @param {number} to - 结束位置（文档偏移量）
     * @returns {MarkInfo[]} 标记信息数组
     */
    findMarks(from: number, to: number): MarkInfo[];
    /**
     * 获取搜索游标
     * @param {string | RegExp} query - 搜索字符串或正则表达式
     * @param {number} [pos=0] - 起始搜索位置（文档偏移量）
     * @param {boolean} [caseFold] - 是否忽略大小写（true 忽略，false 区分）
     * @returns {SearchCursor} 搜索游标对象
     */
    getSearchCursor(query: string | RegExp, pos?: number, caseFold?: boolean): SearchCursor;
    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {(...args: unknown[]) => void} handler - 事件处理函数
     * @returns {void}
     */
    on(event: string, handler: (...args: unknown[]) => void): void;
    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {(...args: unknown[]) => void} handler - 事件处理函数
     * @returns {void}
     */
    off(event: string, handler: (...args: unknown[]) => void): void;
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {...unknown} args - 事件参数
     * @returns {void}
     */
    emit(event: string, ...args: unknown[]): void;
}
import { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
export {};
