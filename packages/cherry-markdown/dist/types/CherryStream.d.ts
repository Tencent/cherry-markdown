/**
 * @typedef {import('../../types/cherry').CherryOptions} CherryOptions
 */
/**
 * CherryStream - 专门用于流式渲染场景的精简版Cherry
 *
 * 特点：
 * 1. 只包含Engine（解析引擎）和Previewer（预览区），不包含Editor（编辑器）和Toolbar（工具栏）
 * 2. 不包含mermaid等大型依赖，包体积更小
 * 3. 适用于纯流式渲染场景，如AI对话、文档预览等
 */
export default class CherryStream extends CherryStatic {
    /**
     * @protected
     */
    protected static initialized: boolean;
    /**
     * @readonly
     */
    static readonly config: {
        /** @type {CherryOptions} */
        defaults: CherryOptions;
    };
    /**
     * @param {Partial<CherryOptions>} options
     */
    constructor(options?: Partial<CherryOptions>);
    /**
     * @property
     * @type {CherryOptions}
     */
    options: CherryOptions;
    /** @type {Record<string, Record<string, string>>} */
    locales: Record<string, Record<string, string>>;
    /** @type {Record<string, string>} */
    locale: Record<string, string>;
    status: {
        toolbar: string;
        previewer: string;
        editor: string;
    };
    /**
     * @property
     * @type {string} 实例ID
     */
    instanceId: string;
    lastMarkdownText: string;
    $event: Event;
    /**
     * @type {import('./Engine').default}
     */
    engine: import("./Engine").default;
    /**
     * 初始化预览区
     * @private
     */
    private init;
    noMountEl: boolean;
    cherryDom: HTMLElement;
    nameSpace: string;
    wrapperDom: HTMLDivElement;
    /**
     * @private
     * @returns
     */
    private createWrapper;
    getCodeWrap(): string;
    setCodeWrap(codeWrap: any): void;
    /**
     * @private
     * @returns {import('@/Previewer').default}
     */
    private createPreviewer;
    previewer: Previewer;
    /**
     * @private
     */
    private initText;
    destroy(): void;
    on(eventName: any, callback: any): void;
    off(eventName: any, callback: any): void;
    /**
     * 滚动到hash位置
     */
    scrollByHash(): void;
    $t(str: any): any;
    addLocale(key: any, value: any): void;
    addLocales(locales: any): void;
    getLocales(): Record<string, string>;
    /**
     * 获取实例id
     * @returns {string}
     * @public
     */
    public getInstanceId(): string;
    /**
     * 获取编辑器状态
     * @returns {Object}
     */
    getStatus(): any;
    /**
     * 获取markdown源码内容
     * @returns {string} markdown源码内容
     */
    getValue(): string;
    /**
     * 获取markdown源码内容
     * @returns {string} markdown源码内容
     */
    getMarkdown(): string;
    /**
     * 获取预览区内的html内容
     * @param {boolean} [wrapTheme=true] 是否在外层包裹主题class
     * @returns {string} html内容
     */
    getHtml(wrapTheme?: boolean): string;
    /**
     * 获取Previewer 预览实例
     * @returns {Previewer} Previewer 预览实例
     */
    getPreviewer(): Previewer;
    /**
     * 获取目录，目录由head1~6组成
     * @returns {Array} 标题head数组
     */
    getToc(): any[];
    /**
     * 设置markdown内容并渲染（流式渲染核心方法）
     * @param {string} content markdown内容
     */
    setValue(content: string): void;
    /**
     * 设置markdown内容并渲染
     * @param {string} content markdown内容
     */
    setMarkdown(content: string): void;
    /**
     * 强制重新渲染预览区域
     */
    refreshPreviewer(): void;
    /**
     * 导出预览区域内容
     * @public
     * @param {'pdf' | 'img' | 'markdown' | 'html'} [type='pdf']
     * @param {string} [fileName] 导出文件名
     */
    public export(type?: "pdf" | "img" | "markdown" | "html", fileName?: string): void;
    /**
     * 获取第一行文本
     * @param {string} defaultText 默认文本
     * @returns {string} 第一行文本
     */
    getFirstLineText(defaultText?: string): string;
    /**
     * 清空流程会话中添加的虚拟光标
     */
    clearFlowSessionCursor(): void;
}
export type CherryOptions = import("../../types/cherry").CherryOptions;
import { CherryStatic } from './CherryStatic';
import Event from './Event';
import Previewer from './Previewer';
