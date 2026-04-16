/**
 * 在编辑区域选中文本时浮现的bubble工具栏
 */
export default class Bubble extends Toolbar {
    /**
     * @type {'flex' | 'block'}
     */
    static displayType: "flex" | "block";
    set visible(visible: boolean);
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
     * @param {number} top 高度（相对编辑器顶部的偏移）
     * @param {number} width 选中文本内容的水平中心位置
     * @param {boolean} isTopToBottom 是否从上到下选择，true 时 bubble 出现在选区下方，false 时出现在选区上方
     * @param {number} selectionBottom 选区最后一行底部相对编辑器顶部的偏移，用于从下到上选择时顶部空间不足的 fallback 定位
     */
    showBubble(top: number, width: number, isTopToBottom?: boolean, selectionBottom?: number): void;
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
    boundHandleAfterChange: () => void;
    boundHandleLayoutChange: () => void;
    boundHandleScroll: () => void;
    boundHandleBeforeSelectionChange: ({ selection, isUserInteraction }: {
        selection: any;
        isUserInteraction: any;
    }) => void;
    /**
     * 销毁 Bubble 实例，清理事件监听器
     * 必须调用此方法以避免内存泄漏
     */
    destroy(): void;
}
import Toolbar from './Toolbar';
