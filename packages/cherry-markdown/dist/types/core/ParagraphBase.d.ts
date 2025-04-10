export default class ParagraphBase extends SyntaxBase {
    static IN_PARAGRAPH_CACHE_KEY_PREFIX: string;
    static IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX: string;
    constructor({ needCache, defaultCache }?: {
        needCache: boolean;
        defaultCache?: {};
    });
    needCache: boolean;
    sign: string;
    cache: {};
    cacheKey: string;
    initBrReg(classicBr?: boolean): void;
    classicBr: boolean;
    removeBrAfterBlock: RegExp;
    removeBrBeforeBlock: RegExp;
    removeNewlinesBetweenTags: RegExp;
    /**
     * 处理经典换行问题
     * @param {string} str markdown源码
     * @returns markdown源码
     */
    $cleanParagraph(str: string): string;
    /**
     * remove all newlines in html text
     *
     * @param {string} textContainsHtml
     */
    joinRawHtml(textContainsHtml: string): string;
    toHtml(str: any, sentenceMakeFunc: any): any;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    afterMakeHtml(html: any): any;
    isContainsCache(str: any, fullMatch: any): boolean;
    /**
     *
     * @param {string} html
     * @return
     */
    $splitHtmlByCache(html: string): {
        caches: RegExpMatchArray;
        contents: string[];
    };
    makeExcludingCached(content: any, processor: any): string;
    /**
     * 获取非捕获匹配丢掉的换行，适用于能被【嵌套】的段落语法
     *
     * @param {string} cache 需要返回的cache
     * @param {string} md 原始的md字符串
     * @param {boolean} alwaysAlone 是否能被【嵌套】，true：不能被嵌套，如标题、注释等；false：能被嵌套，如代码块、有序列表等
     * @return {string} str
     */
    getCacheWithSpace(cache: string, md: string, alwaysAlone?: boolean): string;
    /**
     * 获取行号，只负责向上计算\n
     * 会计算cache的行号
     *
     * @param {string} md md内容
     * @param {string} preSpace 前置换行
     * @return {number} 行数
     */
    getLineCount(md: string, preSpace?: string): number;
    /**
     *
     * @param {string} str 渲染后的内容
     * @param {string} sign 签名
     * @param {number} lineCount md原文的行数
     * @return {string} cacheKey ~~C0I0_L1$
     */
    pushCache(str: string, sign?: string, lineCount?: number): string;
    popCache(sign: any): any;
    testHasCache(sign: any): any;
    resetCache(): void;
    restoreCache(html: any): any;
    timer: NodeJS.Timeout;
    /**
     *
     * @param {string} wholeMatch whole match
     */
    checkCache(wholeMatch: string, sentenceMakeFunc: any, lineCount?: number): any;
    signWithCache(html: any): boolean;
}
import SyntaxBase from "./SyntaxBase";
