export default class Engine {
    /**
     *
     * @param {Partial<import('./Cherry').CherryOptions>} markdownParams 初始化Cherry时传入的选项
     * @param {import('./Cherry').default} cherry Cherry实例
     */
    constructor(markdownParams: Partial<import('./Cherry').CherryOptions>, cherry: import('./Cherry').default);
    $cherry: import("./Cherry").default;
    hookCenter: HookCenter;
    hooks: Record<import("../types/syntax").HookType, SyntaxBase[]>;
    hashCache: {};
    hashStrMap: {};
    cachedBigData: {};
    markdownParams: Partial<Partial<import("../types/cherry")._CherryOptions<import("../types/cherry").CherryCustomOptions>>>;
    currentStrMd5: any[];
    globalConfig: {
        classicBr?: boolean;
        urlProcessor?: (url: string, srcType: "link" | "audio" | "video" | "image" | "autolink", callback?: any) => string;
        htmlWhiteList?: string;
        htmlBlackList?: string;
        flowSessionContext?: boolean;
        flowSessionCursor?: string;
    };
    htmlWhiteListAppend: string;
    htmlBlackList: string;
    urlProcessorMap: {};
    /**
     * 重新生成html
     * 这是为urlProcessor支持异步回调函数而实现的重新生成html的方法
     * 该方法会清空所有缓存，所以降低了该方法的执行频率，1s内最多执行一次
     */
    reMakeHtml(): void;
    timer: NodeJS.Timeout;
    urlProcessor(url: any, srcType: any): any;
    initMath(opts: any): void;
    $configInit(params: any): void;
    $beforeMakeHtml(str: any): any;
    $afterMakeHtml(str: any): any;
    $dealSentenceByCache(md: any): {
        sign: string;
        html: any;
    };
    $dealSentence(md: any): any;
    $fireHookAction(md: any, type: any, action: any, actionArgs: any): any;
    /**
     * @deprecated 已废弃，推荐使用 .hash()
     */
    md5(str: any): string;
    /**
     * 计算哈希值
     * @param {String} str 被计算的字符串
     * @returns {String} 哈希值
     */
    hash(str: string): string;
    $checkCache(str: any, func: any): {
        sign: string;
        html: any;
    };
    $dealParagraph(md: any): any;
    $cacheBigData(md: any): any;
    $deCacheBigData(md: any): any;
    /**
     * 流式输出场景时，在最后增加一个光标占位
     * @param {string} md 内容
     * @returns {string}
     */
    $setFlowSessionCursorCache(md: string): string;
    /**
     * 流式输出场景时，把最后的光标占位替换为配置的dom元素，并在一段时间后删除该元素
     * @param {string} md 内容
     * @returns {string}
     */
    $clearFlowSessionCursorCache(md: string): string;
    clearCursorTimer: NodeJS.Timeout;
    /**
     * @param {string} md md字符串
     * @param {'string'|'object'} returnType 返回格式，string：返回html字符串，object：返回结构化数据
     * @returns {string|HTMLCollection} 获取html
     */
    makeHtml(md: string, returnType?: 'string' | 'object'): string | HTMLCollection;
    makeHtmlForBlockquote(md: any): any;
    mounted(): void;
    /**
     * @param {string} html html字符串
     * @returns {string} 获取markdown
     */
    makeMarkdown(html: string): string;
}
import HookCenter from "./core/HookCenter";
import SyntaxBase from "./core/SyntaxBase";
