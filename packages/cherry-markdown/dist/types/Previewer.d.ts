/**
 * 作用：
 *  dom更新
 *  局部加载（分片）
 *  与左侧输入区域滚动同步
 */
export default class Previewer {
    /**
     *
     * @param {Partial<import('../../types/previewer').PreviewerOptions>} options 预览区域设置
     */
    constructor(options: Partial<import("../../types/previewer").PreviewerOptions>);
    /**
     * @property
     * @private
     * @type {boolean} 等待预览区域更新。预览区域更新时，预览区的滚动不会引起编辑器滚动，避免因插入的元素高度变化导致编辑区域跳动
     */
    private applyingDomChanges;
    /**
     * @property
     * @private
     * @type {number} 释放同步滚动锁定的定时器ID
     */
    private syncScrollLockTimer;
    /**
     * @property
     * @public
     * @type {boolean} 是否为移动端预览模式
     */
    public isMobilePreview: boolean;
    /**
     * @property
     * @private
     * @type {Function|null} 滚动事件处理器，保存为实例属性避免多实例冲突
     */
    private scrollHandler;
    /**
     * @property
     * @private
     * @type {Function|null} 鼠标滚轮事件处理器，保存为实例属性避免内存泄漏
     */
    private wheelHandler;
    /**
     * @property
     * @private
     * @type {ResizeObserver|null} ResizeObserver 实例，避免内存泄漏
     */
    private resizeObserver;
    /**
     * @property
     * @private
     * @type {boolean} 标记该实例是否已销毁，防止销毁后的异步操作执行
     */
    private isDestroyed;
    /**
     * @property
     * @type {import('../../types/previewer').PreviewerOptions}
     */
    options: import("../../types/previewer").PreviewerOptions;
    $cherry: import("./Cherry").default;
    instanceId: string;
    /**
     * @property
     * @private
     * @type {{ timer?: number; destinationTop?: number }}
     */
    private animation;
    init(editor: any): void;
    /**
     * @property
     * @private
     * @type {boolean} 禁用滚动事件监听
     */
    private disableScrollListener;
    editor: any;
    /** @type {typeof import('codemirror')|null} CodeMirror 模块（从 Editor 传递，stream 模式下为 null） */
    codemirrorModule: typeof import("codemirror") | null;
    lazyLoadImg: LazyLoadImg;
    /**
     * 不依赖Editor的初始化方法，用于流式渲染场景
     * 与init方法的区别：不需要editor参数，不绑定拖拽和滚动同步
     * PreviewerBubble 始终初始化以保证基础的 click 事件监听和交互功能
     * enablePreviewerBubble 配置只控制是否显示编辑工具栏（图片、表格等）
     * 在无编辑器场景下，编辑相关功能（编辑代码、切换语言等）会自动禁用
     */
    initWithoutEditor(): void;
    /**
     * “监听”编辑器的尺寸变化，变化时更新拖拽条的位置
     */
    onSizeChange(): void;
    subMenusPositionChange(): void;
    $initPreviewerBubble(): void;
    previewerBubble: PreviewerBubble;
    /**
     * @returns {HTMLElement}
     */
    getDomContainer(): HTMLElement;
    getDom(): HTMLDivElement;
    /**
     * 获取预览区内的html内容
     * @param {boolean} wrapTheme 是否在外层包裹主题class
     * @returns html内容
     */
    getValue(wrapTheme?: boolean): string;
    isPreviewerHidden(): boolean;
    isPreviewerFloat(): boolean;
    isPreviewerNeedFloat(): boolean;
    calculateRealLayout(editorWidth: any): {
        editorPercentage: string;
        previewerPercentage: string;
    };
    setRealLayout(editorPercentage: any, previewerPercentage: any): void;
    syncVirtualLayoutFromReal(): void;
    $tryChangeValue(obj: any, key: any, value: any): void;
    calculateVirtualLayout(editorLeft: any, editorRight: any): {
        startWidth: number;
        leftWidth: number;
        rightWidth: number;
    };
    setVirtualLayout(startWidth: any, leftWidth: any, rightWidth: any): void;
    bindDrag(): void;
    bindScroll(): void;
    removeScroll(): void;
    $html2H(dom: any): any;
    $getAttrsForH(obj: any): {};
    $updateDom(newDom: any, oldDom: any): any;
    $testChild(dom: any): any;
    _testMaxIndex(index: any, arr: any): boolean;
    $getSignData(list: any): {
        list: any[];
        signs: {};
    };
    _hasNewSign(list: any, sign: any, signIndex: any): boolean;
    $dealWithMyersDiffResult(result: any, oldContent: any, newContent: any, domContainer: any): void;
    $dealUpdate(domContainer: any, oldHtmlList: any, newHtmlList: any): void;
    /**
     * 强制重新渲染预览区域
     */
    refresh(html: any): void;
    update(html: any): void;
    $dealEditAndPreviewOnly(isEditOnly?: boolean): void;
    previewOnly(): void;
    editOnly(): void;
    floatPreviewer(): void;
    recoverFloatPreviewer(): void;
    recoverPreviewer(dealToolbar?: boolean): void;
    doHtmlCache(html: any): void;
    cleanHtmlCache(): void;
    afterUpdate(): void;
    highlightLineNum: number;
    registerAfterUpdate(fn: any): void;
    /**
     * 根据行号计算出top值
     * @param {Number} lineNum - 行号
     * @param {Number} linePercent - 行内百分比位置（0-1）
     * @return {Number} 滚动位置（像素）
     */
    $getTopByLineNum(lineNum: number, linePercent?: number): number;
    /**
     * 高亮预览区域对应的行
     * @param {Number} lineNum
     */
    highlightLine(lineNum: number): void;
    /**
     * 滚动到对应行号位置并加上偏移量
     * @param {Number} lineNum
     * @param {Number} offset
     */
    scrollToLineNumWithOffset(lineNum: number, offset: number): void;
    /**
     * 滚动到对应位置
     * @param {number} scrollTop 元素的id属性值
     * @param {'auto'|'smooth'|'instant'} behavior 滚动方式
     */
    scrollToTop(scrollTop: number, behavior?: "auto" | "smooth" | "instant"): void;
    /**
     * 滚动到对应id的位置，实现锚点滚动能力
     * @param {string} id 元素的id属性值
     * @param {'smooth'|'instant'|'auto'} behavior 滚动方式
     * @return {boolean} 是否有对应id的元素并执行滚动
     */
    scrollToId(id: string, behavior?: "smooth" | "instant" | "auto"): boolean;
    /**
     * 实现滚动动画
     * @param { Number } targetY 目标位置
     */
    $scrollAnimation(targetY: number): void;
    scrollToLineNum(lineNum: any, linePercent: any): void;
    /**
     * 获取有滚动条的dom
     */
    getDomCanScroll(currentDom?: HTMLElement): any;
    scrollToHeadByIndex(index: any): void;
    bindClick(): void;
    onMouseDown(): void;
    /**
     * 导出预览区域内容
     * @public
     * @param {'pdf' | 'img' | 'screenShot' | 'markdown' | 'html' | 'word'} [type='pdf']
     * 'pdf'：导出成pdf文件; 'img' | screenShot：导出成png图片; 'markdown'：导出成markdown文件; 'html'：导出成html文件; 'word'：导出到Word（复制到剪贴板）;
     * @param {string} [fileName] 导出文件名
     */
    public export(type?: "pdf" | "img" | "screenShot" | "markdown" | "html" | "word", fileName?: string): void;
    changePreviewToMobile(isMobile?: boolean): void;
    /**
     * 销毁预览器实例，清理所有资源
     * 此方法应在销毁 Cherry 编辑器时调用
     */
    destroy(): void;
}
import LazyLoadImg from '@/utils/lazyLoadImg';
import PreviewerBubble from './toolbars/PreviewerBubble';
