/**
 * @typedef {import('codemirror')} CodeMirror
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
 * @property {function(string, function(SuggestList): void): void} suggestList
 * @property {string} keyword
 * @property {function} suggestListRender
 * @property {function} echo
 * @typedef {object} SuggesterConfig
 * @property {Array<SuggesterConfigItem>} suggester
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
export type CodeMirror = typeof import("codemirror");
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
    suggestList: (arg0: string, arg1: (arg0: SuggestList) => void) => void;
    keyword: string;
    suggestListRender: Function;
    echo: Function;
};
export type SuggesterConfig = {
    suggester: Array<SuggesterConfigItem>;
};
import SyntaxBase from "@/core/SyntaxBase";
declare class SuggesterPanel {
    constructor(cherry: any);
    searchCache: boolean;
    searchKeyCache: any[];
    optionList: any[];
    cursorMove: boolean;
    suggesterConfig: {};
    $cherry: any;
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
    setEditor(editor: import('@/Editor').default): void;
    editor: import("@/Editor").default;
    setSuggester(suggester: any): void;
    bindEvent(): void;
    onClickPanelItem(): void;
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
    relocatePanel(codemirror: any): boolean;
    /**
     * 获取光标位置
     * @param {CodeMirror} codemirror
     * @returns {{ left: number, top: number }}
     */
    getCursorPos(codemirror: CodeMirror): {
        left: number;
        top: number;
    };
    startRelate(codemirror: any, keyword: any, from: any): void;
    cursorFrom: any;
    keyword: any;
    stopRelate(): void;
    cursorTo: any;
    /**
     * 粘贴选择结果
     * @param {number} idx 选择的结果索引
     * @param {KeyboardEvent} evt 键盘事件
     */
    pasteSelectResult(idx: number, evt: KeyboardEvent): void;
    /**
     * 寻找当前选中项的索引
     * @returns {number}
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
}
export {};
