export default class MermaidCodeEngine {
    static TYPE: string;
    static install(cherryOptions: any, ...args: any[]): void;
    /**
     * @param {Object} mermaidOptions - Mermaid 配置选项
     * @param {Object} [mermaidOptions.mermaid] - mermaid 实例对象，如果未提供会尝试从 window.mermaid 获取
     * @param {Object} [mermaidOptions.mermaidAPI] - mermaidAPI 实例对象（仅 v9 及以下版本需要，v10+ 可忽略）
     * @param {string} [mermaidOptions.theme='default'] - 主题，可选值: 'default', 'dark', 'forest', 'neutral' 等
     * @param {string} [mermaidOptions.altFontFamily='sans-serif'] - 备用字体
     * @param {string} [mermaidOptions.fontFamily='sans-serif'] - 主字体
     * @param {string} [mermaidOptions.themeCSS] - 自定义主题 CSS 样式
     * @param {boolean} [mermaidOptions.startOnLoad=false] - 是否在页面加载时自动渲染
     * @param {number|string} [mermaidOptions.logLevel] - 日志级别（v9: 数字 1-5；v10+: 字符串 'debug'|'info'|...|'silent'）
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
        logLevel?: number | string;
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
        logLevel: string;
    };
    dom: any;
    mermaidCanvas: any;
    lastRenderedCode: string;
    needReturnLastRenderedCode: boolean;
    /** 按 mermaid 源码内容缓存已渲染 HTML，布局参数变更时复用以避免闪回 codeBlock */
    contentRenderCache: Map<any, any>;
    contentRenderCacheMax: number;
    /** 异步渲染最大并发数：达到上限后新任务排队，避免大量 mermaid 并发共享 DOM 引起竞态与内存压力 */
    maxConcurrentRender: number;
    /** 当前正在异步渲染的任务数 */
    activeRenderCount: number;
    /** 等待并发额度的任务队列，元素为 resolve 函数 */
    pendingRenderQueue: any[];
    /**
     * 生成 mermaid 源码内容缓存 key（与布局 sign 无关）
     * @param {string} src
     * @param {import('../Engine').default} $engine
     * @returns {string}
     */
    $getContentCacheKey(src: string, $engine: import("../Engine").default): string;
    /**
     * 读取已缓存的 mermaid 渲染结果
     * @param {string} src
     * @param {import('../Engine').default} $engine
     * @returns {string}
     */
    $getCachedRenderHtml(src: string, $engine: import("../Engine").default): string;
    /**
     * 缓存 mermaid 渲染结果（仅缓存含 svg 的成功结果）
     * @param {string} src
     * @param {import('../Engine').default} $engine
     * @param {string} html
     */
    $setCachedRenderHtml(src: string, $engine: import("../Engine").default, html: string): void;
    hasExplicitMermaid: boolean;
    mermaidScriptLoading: boolean;
    mermaidScriptLoaded: boolean;
    isAsyncRenderVersion(): boolean;
    mountMermaidCanvas($engine: any): void;
    /**
     * 为一次异步渲染创建独立的临时画布，避免多个 mermaid 代码块并发渲染时共享同一 DOM 导致的竞态。
     * @param {import('../Engine').default} $engine
     * @returns {HTMLDivElement}
     */
    createAsyncRenderCanvas($engine: import("../Engine").default): HTMLDivElement;
    /**
     * 移除异步渲染使用的临时画布
     * @param {HTMLElement} canvas
     */
    destroyAsyncRenderCanvas(canvas: HTMLElement): void;
    /**
     * 获取一个异步渲染的并发额度，若已达上限则挂起等待，直到有其他任务释放。
     * @returns {Promise<void>}
     */
    acquireRenderSlot(): Promise<void>;
    /**
     * 释放一个并发额度，若队列有等待任务则唤醒队首（注意：唤醒时不减不加，直接把额度移交给下一个任务）。
     */
    releaseRenderSlot(): void;
    /**
     * 转换svg为img，如果出错则直出svg
     * @param {string} svgCode
     * @param {string} graphId
     * @returns {string}
     */
    convertMermaidSvgToImg(svgCode: string, graphId: string, svg2img?: boolean): string;
    processSvgCode(svgCode: any, graphId: any, svg2img?: boolean): string;
    syncRender(graphId: any, src: any, sign: any, $engine: any, svg2img?: boolean): any;
    handleAsyncRenderDone(graphId: any, sign: any, $engine: any, props: any, html: any): void;
    /**
     * 尝试重新从全局获取 mermaid 实例（当外部异步加载 mermaid 时，构造时刻可能尚未就绪）
     * @returns {boolean} 是否成功获取
     */
    tryResolveMermaidAPIRefs(): boolean;
    /**
     * 当用户没有显式传入 mermaid 实例，且在 engine.syntax.codeBlock.mermaid.src 中配置了脚本地址时，
     * 通过 utils/dom.js 中的 loadScript 动态加载 mermaid 脚本。
     * 加载完成后 tryResolveMermaidAPIRefs 会在异步渲染的重试逻辑中自动获取到 window.mermaid。
     * @param {Object} [props] render 传入的 props，其中 mermaidConfig 对应 engine.syntax.codeBlock.mermaid
     * @returns {boolean} 是否已发起（或已完成）脚本加载
     */
    ensureMermaidLoaded(props?: any): boolean;
    asyncRender(graphId: any, src: any, sign: any, $engine: any, props: any, retryCount?: number): any;
    render(src: any, sign: any, $engine: any, props?: {}): any;
}
