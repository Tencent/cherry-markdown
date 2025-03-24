export default class Toc extends ParagraphBase {
    constructor({ externals, config }: {
        externals: any;
        config: any;
    });
    tocStyle: string;
    tocNodeClass: string;
    tocContainerClass: string;
    tocTitleClass: string;
    linkProcessor: typeof defaultLinkProcessor;
    baseLevel: number;
    /** 标记当前是否处于第一个toc，且仅渲染一个toc */
    isFirstTocToken: boolean;
    /** 允许渲染多个TOC */
    allowMultiToc: boolean;
    /** 是否显示自增序号 */
    showAutoNumber: boolean;
    beforeMakeHtml(str: any): any;
    makeHtml(str: any): any;
    $makeLevel(num: any): string;
    /**
     * 生成TOC节点HTML
     * @param {{ level: number; id: string; text: string }} node Toc节点对象
     * @param {boolean} prependWhitespaceIndent 是否在文本前插入缩进空格
     * @param {boolean} [closeTag=true] 是否闭合标签
     * @returns {string}
     */
    $makeTocItem(node: {
        level: number;
        id: string;
        text: string;
    }, prependWhitespaceIndent: boolean, closeTag?: boolean): string;
    $makePlainToc(tocNodeList: any): any;
    /**
     * 生成嵌套的TOC列表，算法思路参考flexmark
     * @see https://github.com/vsch/flexmark-java/blob/master/flexmark-ext-toc/
     * src/main/java/com/vladsch/flexmark/ext/toc/TocUtils.java#L140-L227
     *
     * @param {{ level:number; id:string; text:string }[]} nodeList 节点列表
     * @returns {string}
     */
    $makeNestedToc(nodeList: {
        level: number;
        id: string;
        text: string;
    }[]): string;
    $makeToc(arr: any, dataSign: any, preLinesMatch: any): string;
    test(str: any, flavor: any): any;
    /**
     * TODO: fix type errors, prefer use `rules` for multiple spec instead
     * @returns
     */
    rule(): any;
}
import ParagraphBase from "@/core/ParagraphBase";
declare function defaultLinkProcessor(link: any): any;
export {};
