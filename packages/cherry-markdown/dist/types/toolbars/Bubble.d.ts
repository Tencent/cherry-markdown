/**
 * 在编辑区域选中文本时浮现的bubble工具栏
 */
export default class Bubble extends Toolbar {
    /**
     * @type {'flex' | 'block'}
     */
    static displayType: 'flex' | 'block';
    set visible(arg: boolean);
    get visible(): boolean;
    bubbleDom: HTMLDivElement;
    editorDom: any;
    /**
     * 计算编辑区域的偏移量
     * @returns {number} 编辑区域的滚动区域
     */
    getScrollTop(): number;
    /**
     * 当编辑区域滚动的时候自动隐藏bubble工具栏和子工具栏
     */
    updatePositionWhenScroll(): void;
    /**
     * 根据高度计算bubble工具栏出现的位置的高度
     * 根据宽度计算bubble工具栏出现的位置的left值，以及bubble工具栏三角箭头的left值
     * @param {number} top 高度
     * @param {number} width 选中文本内容的宽度
     */
    showBubble(top: number, width: number): void;
    hideBubble(): void;
    /**
     * 控制bubble工具栏的箭头的位置
     * @param {string} left 左偏移量
     */
    $setBubbleCursorPosition(left?: string): void;
    initBubbleDom(): void;
    bubbleTop: HTMLDivElement;
    bubbleBottom: HTMLDivElement;
    getBubbleDom(): HTMLDivElement;
    addSelectionChangeListener(): void;
    lastSelections: any;
    lastSelectionsStr: any;
}
import Toolbar from "./Toolbar";
