export function urlProcessorProxy(urlProcessor: any): (url: any, srcType: any, callback: any) => any;
export default class UrlCache {
    /**
     * 判断url是否Cherry的内部链接
     * @param {string} url 要检测的URL
     * @returns
     */
    static isInnerLink(url: string): boolean;
    /**
     * 缓存url为内部链接，主要用于缩短超长链接，避免正则超时
     * @param {string} url 要转换为内部链接的URL
     * @returns
     */
    static set(url: string): string;
    /**
     * 获取原始链接
     * @param {string} innerUrl 内部链接
     * @returns
     */
    static get(innerUrl: string): any;
    /**
     * 替换指定内部链接的真实地址
     * @param {string} innerUrl 原始内部链接
     * @param {string} newUrl 需要替换的链接
     */
    static replace(innerUrl: string, newUrl: string): string;
    /**
     * 替换所有内部链接为原始的真实地址
     * @param {string} html 包含 cherry-inner 协议地址的 html 文本
     */
    static restoreAll(html: string): string;
    /**
     * 清空缓存
     */
    static clear(): void;
}
