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
    md5Cache: {};
    md5StrMap: {};
    cachedBigData: {};
    markdownParams: Partial<Partial<import("../types/cherry")._CherryOptions<import("../types/cherry").CherryCustomOptions>>>;
    currentStrMd5: any[];
    globalConfig: {
        classicBr?: boolean;
        urlProcessor?: (url: string, srcType: "link" | "audio" | "video" | "image" | "autolink") => string;
        htmlWhiteList?: string;
        flowSessionContext?: boolean;
    };
    htmlWhiteListAppend: string;
    initMath(opts: any): void;
    $configInit(params: any): void;
    $beforeMakeHtml(str: any): any;
    $afterMakeHtml(str: any): any;
    $dealSentenceByCache(md: any): {
        sign: any;
        html: any;
    };
    $dealSentence(md: any): any;
    $fireHookAction(md: any, type: any, action: any, actionArgs: any): any;
    md5(str: any): any;
    $checkCache(str: any, func: any): {
        sign: any;
        html: any;
    };
    $dealParagraph(md: any): any;
    $cacheBigData(md: any): any;
    $deCacheBigData(md: any): any;
    /**
     * @param {string} md md字符串
     * @returns {string} 获取html
     */
    makeHtml(md: string): string;
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
