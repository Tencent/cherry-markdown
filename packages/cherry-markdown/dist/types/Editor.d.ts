/**
 * @typedef {import('../../types/editor').EditorConfiguration} EditorConfiguration
 * @typedef {import('../../types/editor').EditorEventCallback} EditorEventCallback
 * @typedef {import('codemirror')} CodeMirror
 */
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
    /**
     * @property
     * @private
     * @type {{ timer?: number; destinationTop?: number }}
     */
    private animation;
    selectAll: boolean;
    $cherry: import("./Cherry").default;
    instanceId: string;
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
     * 把大字符串变成省略号
     * @param {*} reg 正则
     * @param {*} className 利用codemirror的MarkText生成的新元素的class
     */
    formatBigData2Mark: (reg: any, className: any) => void;
    /**
     * 高亮全角符号 ·|￥|、|：|“|”|【|】|（|）|《|》
     * full width翻译为全角
     */
    formatFullWidthMark(): void;
    /**
     *
     * @param {CodeMirror.Editor} codemirror
     * @param {MouseEvent} evt
     */
    toHalfWidth(codemirror: CodeMirror.Editor, evt: MouseEvent): void;
    /**
     *
     * @param {KeyboardEvent} e
     * @param {CodeMirror.Editor} codemirror
     */
    onKeyup: (e: KeyboardEvent, codemirror: CodeMirror.Editor) => void;
    /**
     *
     * @param {ClipboardEvent} e
     * @param {CodeMirror.Editor} codemirror
     */
    onPaste(e: ClipboardEvent, codemirror: CodeMirror.Editor): void;
    /**
     *
     * @param {ClipboardEvent} event
     * @param {ClipboardEvent['clipboardData']} clipboardData
     * @param {CodeMirror.Editor} codemirror
     * @returns {boolean | void}
     */
    handlePaste(event: ClipboardEvent, clipboardData: ClipboardEvent['clipboardData'], codemirror: CodeMirror.Editor): boolean | void;
    fileUploadCount: number;
    /**
     *
     * @param {CodeMirror.Editor} codemirror
     */
    onScroll: (codemirror: CodeMirror.Editor) => void;
    disableScrollListener: boolean;
    /**
     *
     * @param {CodeMirror.Editor} codemirror
     * @param {MouseEvent} evt
     */
    onMouseDown: (codemirror: CodeMirror.Editor, evt: MouseEvent) => void;
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
     * @property
     * @type {CodeMirror.Editor}
     */
    editor: CodeMirror.Editor;
    domWidth: number;
    /**
     *
     * @param {number | null} beginLine 起始行，传入null时跳转到文档尾部
     * @param {number} [endLine] 终止行
     * @param {number} [percent] 百分比，取值0~1
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
     *
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
}
export type EditorConfiguration = import('../../types/editor').EditorConfiguration;
export type EditorEventCallback = import('../../types/editor').EditorEventCallback;
export type CodeMirror = typeof codemirror;
import codemirror from "codemirror";
