/**
 * @typedef {import('@codemirror/view').EditorView} EditorView
 * @typedef {import('../../types/editor').CM6Adapter} CM6Adapter
 */
/**
 * @typedef { Object } SuggestListItemObject 推荐列表项对象
 * @property { string } icon 图标
 * @property { string } label 候选列表回显的内容
 * @property { string } value 点击候选项的时候回填的值
 * @property { string } keyword 关键词，通过关键词控制候选项的显隐
 * @typedef { SuggestListItemObject | string } SuggestListItem 推荐列表项
 * @typedef { Array<SuggestListItem> } SuggestList 推荐列表
 */
/**
 * @typedef {object} SuggesterConfigItem
 * @property {function(string, function(SuggestList): void): void} suggestList - 推荐项来源函数，接收搜索关键字和回调函数
 * @property {string} keyword - 唤醒关键字（如 '@'、'#' 等）
 * @property {function} suggestListRender - 自定义渲染函数（可选）
 * @property {function} echo - 回填回调函数（可选）
 * @typedef {object} SuggesterConfig
 * @property {Array<SuggesterConfigItem>} suggester - 推荐器配置数组
 */
export default class Suggester extends SyntaxBase {
    constructor({ config, cherry }: {
        config: any;
        cherry: any;
    });
    config: any;
    $cherry: any;
    suggesterPanel: SuggesterPanel;
    RULE: any;
    /**
     * 初始化配置
     * @param {SuggesterConfig} config
     */
    initConfig(config: SuggesterConfig): void;
    suggester: {};
    inited: boolean;
    makeHtml(str: any): any;
    toHtml(wholeMatch: any, leadingChar: any, keyword: any, text: any): any;
    rule(): any;
}
export type EditorView = import("@codemirror/view").EditorView;
export type CM6Adapter = import("../../types/editor").CM6Adapter;
/**
 * 推荐列表项对象
 */
export type SuggestListItemObject = {
    /**
     * 图标
     */
    icon: string;
    /**
     * 候选列表回显的内容
     */
    label: string;
    /**
     * 点击候选项的时候回填的值
     */
    value: string;
    /**
     * 关键词，通过关键词控制候选项的显隐
     */
    keyword: string;
};
/**
 * 推荐列表项
 */
export type SuggestListItem = SuggestListItemObject | string;
/**
 * 推荐列表
 */
export type SuggestList = Array<SuggestListItem>;
export type SuggesterConfigItem = {
    /**
     * - 推荐项来源函数，接收搜索关键字和回调函数
     */
    suggestList: (arg0: string, arg1: (arg0: SuggestList) => void) => void;
    /**
     * - 唤醒关键字（如 '@'、'#' 等）
     */
    keyword: string;
    /**
     * - 自定义渲染函数（可选）
     */
    suggestListRender: Function;
    /**
     * - 回填回调函数（可选）
     */
    echo: Function;
};
export type SuggesterConfig = {
    /**
     * - 推荐器配置数组
     */
    suggester: Array<SuggesterConfigItem>;
};
import SyntaxBase from '@/core/SyntaxBase';
declare class SuggesterPanel {
    constructor(cherry: any);
    searchCache: boolean;
    searchKeyCache: any[];
    optionList: any[];
    cursorMove: boolean;
    suggesterConfig: {};
    $cherry: any;
    panelPosition: string;
    /**
     * 如果没有panel，则尝试初始化一个，在node模式不初始化
     */
    tryCreatePanel(): void;
    $suggesterPanel: any;
    panelWrap: string;
    hasEditor(): boolean;
    /**
     * 设置编辑器
     * @param {import('@/Editor').default} editor
     */
    setEditor(editor: import("@/Editor").default): void;
    editor: import("@/Editor").default;
    setSuggester(suggester: any): void;
    bindEvent(): void;
    boundOnChange: (codemirror: any, evt: any) => void;
    boundOnCursorActivity: () => void;
    boundOnScroll: () => void;
    onClickPanelItem(): void;
    boundClickHandler: (evt: any) => void;
    /**
     * 查找被点击元素对应的选项索引
     * 支持点击 item 内部的子元素（如图标）
     * @param {HTMLElement} target 被点击的元素
     * @returns {number} 选项索引，未找到返回 -1
     */
    findClickedItemIndex(target: HTMLElement): number;
    showSuggesterPanel({ left, top, items }: {
        left: any;
        top: any;
        items: any;
    }): void;
    hideSuggesterPanel(): void;
    /**
     * 更新suggesterPanel
     * @param {SuggestList} suggestList
     */
    updatePanel(suggestList: SuggestList): void;
    /**
     * 渲染suggesterPanel item
     * @param {string} item 渲染内容
     * @param {boolean} selected 是否选中
     * @returns {string} html
     */
    renderPanelItem(item: string, selected: boolean): string;
    createDom(string?: string): DocumentFragment;
    template: HTMLDivElement;
    /**
     * 面板重定位（滚动时调用，不进行边界判定）
     * @param {CodeMirror} codemirror
     */
    relocatePanel(codemirror: typeof import("codemirror")): boolean;
    /**
     * 获取光标位置
     * @param {CodeMirror} codemirror
     * @returns {{ left: number, top: number }}
     */
    getCursorPos(codemirror: typeof import("codemirror")): {
        left: number;
        top: number;
    };
    startRelate(codemirror: any, keyword: any, from: any): void;
    cursorFrom: any;
    keyword: any;
    /**
     * 首次显示面板时进行边界判定（在下一帧执行）
     */
    relocatePanelWithBoundaryCheck(): boolean;
    stopRelate(): void;
    cursorTo: import("codemirror").Position;
    /**
     * 粘贴选择结果
     * @param {number} idx 选择的结果索引
     * @param {KeyboardEvent} [evt] 键盘事件（可选）
     */
    pasteSelectResult(idx: number, evt?: KeyboardEvent): void;
    /**
     * 寻找当前选中项的索引
     * @returns {number} 选中项索引，未找到或面板不存在返回 -1
     */
    findSelectedItemIndex(): number;
    enableRelate(): boolean;
    /**
     *  codeMirror change事件
     * @param {CodeMirror.Editor} codemirror
     * @param {CodeMirror.EditorChange} evt
     * @returns
     */
    onCodeMirrorChange(codemirror: CodeMirror.Editor, evt: CodeMirror.EditorChange): void;
    /**
     * 监听方向键选择 options
     * @param {CodeMirror.Editor} codemirror
     * @param {KeyboardEvent} evt
     */
    onKeyDown(codemirror: CodeMirror.Editor, evt: KeyboardEvent): boolean;
    /**
     * 销毁 SuggesterPanel 实例，清理事件监听器和 DOM 引用
     * 必须调用此方法以避免内存泄漏
     */
    destroy(): void;
}
export {};
