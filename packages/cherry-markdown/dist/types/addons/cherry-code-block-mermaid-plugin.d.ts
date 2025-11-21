export default class MermaidCodeEngine {
    static TYPE: string;
    static install(cherryOptions: any, ...args: any[]): void;
    /**
     * @param {Object} mermaidOptions - Mermaid 配置选项
     * @param {Object} [mermaidOptions.mermaid] - mermaid 实例对象，如果未提供会尝试从 window.mermaid 获取
     * @param {Object} [mermaidOptions.mermaidAPI] - mermaidAPI 实例对象，如果未提供会尝试从 window.mermaidAPI 获取
     * @param {string} [mermaidOptions.theme='default'] - 主题，可选值: 'default', 'dark', 'forest', 'neutral' 等
     * @param {string} [mermaidOptions.altFontFamily='sans-serif'] - 备用字体
     * @param {string} [mermaidOptions.fontFamily='sans-serif'] - 主字体
     * @param {string} [mermaidOptions.themeCSS] - 自定义主题 CSS 样式
     * @param {boolean} [mermaidOptions.startOnLoad=false] - 是否在页面加载时自动渲染
     * @param {number} [mermaidOptions.logLevel=5] - 日志级别，1-5，5 为最详细
     * @param {HTMLElement} [mermaidOptions.mermaidCanvasAppendDom] - Mermaid 临时画布容器的挂载节点
     * @param {Object} [mermaidOptions.flowchart] - 流程图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.sequence] - 序列图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.gantt] - 甘特图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.journey] - 用户旅程图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.timeline] - 时间线图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.class] - 类图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.state] - 状态图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.er] - ER 图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.pie] - 饼图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.quadrantChart] - 象限图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.xyChart] - XY 图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.requirement] - 需求图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.architecture] - 架构图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.mindmap] - 思维导图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.kanban] - 看板图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.gitGraph] - Git 图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.c4] - C4 图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.sankey] - 桑基图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.packet] - 数据包图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.block] - 块图配置，可设置 { useMaxWidth: false } 等
     * @param {Object} [mermaidOptions.radar] - 雷达图配置，可设置 { useMaxWidth: false } 等
     */
    constructor(mermaidOptions?: {
        mermaid?: any;
        mermaidAPI?: any;
        theme?: string;
        altFontFamily?: string;
        fontFamily?: string;
        themeCSS?: string;
        startOnLoad?: boolean;
        logLevel?: number;
        mermaidCanvasAppendDom?: HTMLElement;
        flowchart?: any;
        sequence?: any;
        gantt?: any;
        journey?: any;
        timeline?: any;
        class?: any;
        state?: any;
        er?: any;
        pie?: any;
        quadrantChart?: any;
        xyChart?: any;
        requirement?: any;
        architecture?: any;
        mindmap?: any;
        kanban?: any;
        gitGraph?: any;
        c4?: any;
        sankey?: any;
        packet?: any;
        block?: any;
        radar?: any;
    });
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
    lastRenderedCode: string;
    needReturnLastRenderedCode: boolean;
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
