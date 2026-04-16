/**
 * 预览区域的响应式工具栏
 */
export default class PreviewerBubble {
    /**
     *
     * @param {import('../Previewer').default} previewer
     */
    constructor(previewer: import("../Previewer").default);
    /**
     * @property
     * @type {import('../Previewer').default}
     */
    previewer: import("../Previewer").default;
    /**
     * @property
     * @type {import('../Editor').default|null}
     */
    editor: import("../Editor").default | null;
    previewerDom: HTMLDivElement;
    $cherry: import("..").default;
    /**
     * @property
     * @type {{ [key: string]: HTMLDivElement}}
     */
    bubble: {
        [key: string]: HTMLDivElement;
    };
    /**
     * @property
     * @type {{ [key: string]: { emit: (...args: any[]) => any, [key:string]: any }}}
     */
    bubbleHandler: {
        [key: string]: {
            emit: (...args: any[]) => any;
            [key: string]: any;
        };
    };
    /** 图片扩展参数在编辑器中的位置范围 */
    imgExtendFrom: number;
    imgExtendTo: number;
    imgHasExtend: boolean;
    /** 前导空格位置，清除所有扩展参数时一并移除 */
    imgLeadingSpacePos: number;
    /** 记录 beginChangeImgValue 时的文档状态，用于位置映射追踪 */
    imgChangeBaseState: any;
    init(): void;
    oldWrapperDomOverflow: string;
    $bindedOnClick: any;
    $bindedOnMouseOver: any;
    $bindedOnMouseDown: (event: any) => void;
    $bindedOnMouseUp: (event: any) => void;
    $bindedOnMouseMove: (event: any) => void;
    $bindedOnKeyUp: (event: any) => void;
    $bindedOnScroll: (event: any) => void;
    $bindedOnChange: any;
    $bindedOnEditorSizeChange: () => void;
    $bindedOnLayoutChange: () => void;
    removeHoverBubble: import("lodash").DebouncedFunc<() => void>;
    isDestroyed: boolean;
    /**
     * 判断是否为代码块
     * @param {HTMLElement} element
     * @returns {boolean|Element}
     */
    isCherryCodeBlock(element: HTMLElement): boolean | Element;
    /**
     * 是否为由cherry生成的表格，且不是简单表格
     * 现在也支持 HTML 表格语法
     * @param {HTMLElement} element
     * @returns {boolean|HTMLElement}
     */
    isCherryTable(element: HTMLElement): boolean | HTMLElement;
    /**
     * 检测编辑器是否可用
     * 用于流式渲染场景下的读写分离判断
     * @returns {boolean}
     */
    $hasEditor(): boolean;
    /**
     * 是否开启了预览区操作 && 是否有编辑区
     * @returns {boolean}
     */
    $isEnableBubbleAndEditorShow(): boolean;
    $onMouseOver(e: any): void;
    $onMouseOut(): void;
    $dealCheckboxClick(e: any): void;
    checkboxIdx: number;
    /**
     * 点击预览区域的事件处理
     * 基础交互功能（代码块展开/复制、链接跳转、脚注等）始终可用
     * enablePreviewerBubble 配置只控制是否显示编辑工具栏（图片、表格、列表等）
     * @param {MouseEvent} e
     * @returns
     */
    $onClick(e: MouseEvent): any;
    $onChange(e: any): void;
    $getClosestNode(node: any, targetNodeName: any): any;
    /**
     * 隐藏预览区域已经激活的工具栏
     * @param {string} trigger 移除指定的触发方式，不传默认全部移除
     */
    $removeAllPreviewerBubbles(trigger?: string): void;
    /**
     * 检查并重新创建表格处理器
     * 当表格结构发生变化时，需要重新创建处理器以避免位置异常
     */
    $checkAndRecreateTableHandlers(): void;
    /**
     * 检查表格处理器是否仍然有效
     * @param {TableHandler} handler 表格处理器实例
     * @returns {boolean} 是否有效
     */
    $isTableHandlerValid(handler: TableHandler): boolean;
    /**
     * 移除指定的预览气泡
     * @param {string} trigger 触发方式
     */
    $removePreviewerBubble(trigger: string): void;
    /**
     * hover到脚注的数字角标时展示悬浮卡片
     * @param {string} trigger 触发方式
     * @param {HTMLElement} htmlElement 触发的角标
     * @param {object} bubbleConfig 悬浮卡片的配置
     */
    $showFootNoteBubbleCardPreviewerBubbles(trigger: string, htmlElement: HTMLElement, bubbleConfig: object): void;
    /**
     * 为触发的table增加操作工具栏
     * @param {string} trigger 触发方式
     * @param {HTMLElement} htmlElement 用户触发的table dom
     */
    $showTablePreviewerBubbles(trigger: string, htmlElement: HTMLElement, tableElement: any): void;
    showCodeBlockPreviewerBubbles(trigger: any, htmlElement: any): void;
    /**
     * 为选中的图片增加操作工具栏
     * @param {HTMLImageElement} htmlElement 用户点击的图片dom
     */
    $showImgPreviewerBubbles(htmlElement: HTMLImageElement, event: any): {
        emit: () => void;
    };
    totalImgs: number;
    imgIndex: number;
    /**
     * 为触发的公式增加操作工具栏
     * @param {string} trigger 触发方式
     * @param {Element} target 用户触发的公式dom
     * @param {{x?: number, y?: number}} options 额外参数
     */
    $showFormulaPreviewerBubbles(trigger: string, target: Element, options?: {
        x?: number;
        y?: number;
    }): void;
    /**
     * 为触发的列表增加操作工具栏
     * @param {string} trigger 触发方式
     * @param {HTMLParagraphElement} target 用户触发的列表dom
     */
    $showListPreviewerBubbles(trigger: string, target: HTMLParagraphElement, options?: {}): void;
    /**
     * TODO: beginChangeDrawioImg 和 beginChangeImgValue 代码高度重合，后面有时间重构下，抽成一个可以复用的，可以避开代码块、行内代码影响的通用方法
     * 修改draw.io图片时选中编辑区域的对应文本
     * @param {*} htmlElement 图片node
     */
    beginChangeDrawioImg(htmlElement: any): boolean;
    /**
     * 选中图片对应的MD语法
     * @param {*} htmlElement 图片node
     * @returns {boolean}
     */
    beginChangeImgValue(htmlElement: any): boolean;
    imgDeco: any;
    imgAlign: string;
    imgSize: string;
    /**
     * 修改图片尺寸时的回调
     * @param {HTMLElement} htmlElement 被拖拽的图片标签
     * @param {Object} style 图片的属性（宽高）
     */
    changeImgSize(htmlElement: HTMLElement, style: any): void;
    /**
     * 修改图片样式时的回调
     * @param {HTMLElement} htmlElement 被修改演示的图片标签
     * @param {Object} type 图片的属性（边框、阴影、圆角、对齐方式）
     */
    changeImgStyle(htmlElement: HTMLElement, type: any): void;
    /**
     * 修改图片装饰样式
     * @param {HTMLElement} htmlElement 被修改演示的图片标签
     * @param {Object} type 图片的属性（边框、阴影、圆角）
     */
    changeImgDecorationStyle(htmlElement: HTMLElement, type: any): void;
    /**
     * 修改图片装饰样式
     * @param {HTMLElement} htmlElement 被修改演示的图片标签
     * @param {Object} type 图片的属性（左对齐、居中、右对齐、左浮动、右浮动）
     */
    changeImgAlignmentStyle(htmlElement: HTMLElement, type: any): void;
    changeImgValue(): void;
    /**
     * 预览区域编辑器的容器
     * @param {string} trigger 触发方式
     * @param {string} type 容器类型（用作样式名：cherry-previewer-{type}）
     */
    $createPreviewerBubbles(trigger?: string, type?: string): void;
    /**
     * 判断目标元素是否为 mermaid 图表或其子元素
     * @param {Element} element
     * @returns {HTMLElement|false}
     */
    $getMermaidFigure(element: Element): HTMLElement | false;
    /**
     * 为选中的 mermaid 图表增加尺寸调整工具
     * @param {HTMLElement} figureElement mermaid 图表的 figure DOM
     */
    $showMermaidPreviewerBubbles(figureElement: HTMLElement, event: any): void;
    mermaidFigure: HTMLElement;
    /**
     * 选中 mermaid 代码块语法的语言行中的扩展参数部分（尺寸 + 对齐）
     * @param {HTMLElement} figureElement mermaid figure DOM
     * @returns {boolean}
     */
    beginChangeMermaidValue(figureElement: HTMLElement): boolean;
    mermaidSize: string;
    mermaidAlign: string;
    mermaidExtendFrom: number;
    mermaidExtendTo: number;
    mermaidLangLineNum: number;
    mermaidHasExtend: boolean;
    /**
     * 拼接 mermaid 扩展参数并替换编辑器中的选中文本
     */
    changeMermaidValue(): void;
    /**
     * 修改 mermaid 图表尺寸时的回调
     * @param {HTMLElement} htmlElement mermaid figure 元素
     * @param {Object} style 图表的属性（宽高）
     */
    changeMermaidSize(htmlElement: HTMLElement, style: any): void;
    /**
     * 修改 mermaid 图表对齐方式时的回调
     * @param {HTMLElement} htmlElement mermaid figure 元素
     * @param {string} type 对齐方式
     */
    changeMermaidStyle(htmlElement: HTMLElement, type: string): void;
    /**
     * 处理 mermaid 源码/预览切换工具栏的点击
     * @param {Element} tabElement 被点击的 tab 元素
     */
    $handleMermaidSourceToolbarClick(tabElement: Element): void;
    $showBorderBubbles(): void;
    $showBtnBubbles(): void;
    /**
     * 销毁 PreviewerBubble 实例，清理事件监听器和引用
     */
    destroy(): void;
}
import TableHandler from '@/utils/tableContentHandler';
