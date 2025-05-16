export default class MermaidCodeEngine {
    static TYPE: string;
    static install(cherryOptions: any, ...args: any[]): void;
    constructor(mermaidOptions?: {});
    mermaidAPIRefs: any;
    options: {
        theme: string;
        altFontFamily: string;
        fontFamily: string;
        themeCSS: string;
        startOnLoad: boolean;
        logLevel: number;
    };
    dom: any;
    mermaidCanvas: any;
    isAsyncRenderVersion(): boolean;
    mountMermaidCanvas($engine: any): void;
    /**
     * 转换svg为img，如果出错则直出svg
     * @param {string} svgCode
     * @param {string} graphId
     * @returns {string}
     */
    convertMermaidSvgToImg(svgCode: string, graphId: string): string;
    processSvgCode(svgCode: any, graphId: any): string;
    syncRender(graphId: any, src: any, sign: any, $engine: any): any;
    handleAsyncRenderDone(graphId: any, sign: any, $engine: any, props: any, html: any): void;
    asyncRender(graphId: any, src: any, sign: any, $engine: any, props: any): any;
    render(src: any, sign: any, $engine: any, props?: {}): any;
    svg2img: any;
}
