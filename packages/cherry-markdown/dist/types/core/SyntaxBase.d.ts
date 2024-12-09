/**
 * @type {HookTypesList}
 */
export const HOOKS_TYPE_LIST: HookTypesList;
export default class SyntaxBase {
    /**
     * @static
     * @type {string}
     */
    static HOOK_NAME: string;
    /**
     * @static
     * @type {HookType}
     */
    static HOOK_TYPE: HookType;
    static getMathJaxConfig(): boolean;
    /**
     *
     * @param {boolean} version 指定mathJax是否使用MathJax
     */
    static setMathJaxConfig(version: boolean): void;
    /**
     * @constructor
     * @param {Partial<EditorConfig>} editorConfig
     */
    constructor(editorConfig: Partial<EditorConfig>);
    /**
     * @protected
     * @type {import('../Engine').default}
     */
    protected $engine: import('../Engine').default;
    $locale: any;
    RULE: import("../../types/syntax").HookRegexpRule;
    getType(): import("../../types/syntax").HookType;
    getName(): string;
    afterInit(callback: any): void;
    setLocale(locale: any): void;
    /**
     * 生命周期函数
     * @param {string} str 待处理的markdown文本
     * @returns {string} 处理后的文本，一般为html
     */
    beforeMakeHtml(str: string): string;
    /**
     * 生命周期函数
     * @param {string} str 待处理的markdown文本
     * @returns {string} 处理后的文本，一般为html
     */
    makeHtml(str: string): string;
    /**
     * 生命周期函数
     * @param {string} str 待处理的markdown文本
     * @returns {string} 处理后的文本，一般为html
     */
    afterMakeHtml(str: string): string;
    /**
     *
     * @param {KeyboardEvent} e 触发事件
     * @param {*} str
     */
    onKeyDown(e: KeyboardEvent, str: any): void;
    getOnKeyDown(): false | ((e: KeyboardEvent, str: any) => void);
    getAttributesTest(): RegExp;
    /**
     *
     * @param {string} attr
     * @param {() => {}} func 回调函数
     */
    $testAttributes(attr: string, func: () => {}): void;
    /**
     * 提取属性
     * @param {string} str 待提取字符串
     * @returns {{attrs: Record<string,any>; str: string}}
     */
    getAttributes(str: string): {
        attrs: Record<string, any>;
        str: string;
    };
    /**
     * 测试输入的字符串是否匹配当前Hook规则
     * @param {string} str 待匹配文本
     * @returns {boolean}
     */
    test(str: string): boolean;
    /**
     *
     * @param {Partial<EditorConfig>} editorConfig
     * @returns {HookRegexpRule}
     */
    rule(editorConfig: Partial<EditorConfig>): HookRegexpRule;
    mounted(): void;
}
export type HookType = import('../../types/syntax').HookType;
export type HookTypesList = import('../../types/syntax').HookTypesList;
export type EditorConfig = import('../../types/syntax').EditorConfig;
export type HookRegexpRule = import('../../types/syntax').HookRegexpRule;
