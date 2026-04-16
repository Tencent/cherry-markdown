export default pasteHelper;
declare namespace pasteHelper {
    /**
     * 核心方法，粘贴后展示切换按钮
     * 只有粘贴html时才会出现切换按钮
     * @param {Object} cherry - Cherry 编辑器实例
     * @param {number} currentCursor - 当前光标位置（文档偏移量）
     * @param {Object} editorView - 编辑器视图（CM6 适配器）
     * @param {string} html - HTML 的纯文本内容
     * @param {string} md - HTML 对应的 Markdown 源码
     * @returns {void}
     */
    function showSwitchBtnAfterPasteHtml(cherry: any, currentCursor: number, editorView: any, html: string, md: string): void;
    /**
     * 初始化粘贴助手的内部状态
     * @param {Object} cherry - Cherry 编辑器实例
     * @param {number} currentCursor - 当前光标位置（文档偏移量）
     * @param {Object} editorView - 编辑器视图
     * @param {string} html - HTML 的纯文本内容
     * @param {string} md - HTML 对应的 Markdown 源码
     */
    function init(cherry: any, currentCursor: number, editorView: any, html: string, md: string): void;
    /**
     * 获取缓存中的复制粘贴类型
     */
    function getTypeFromLocalStorage(): string;
    /**
     * 记忆最近一次用户选择的粘贴类型
     */
    function setTypeToLocalStorage(type: any): void;
    /**
     * 在编辑器中自动选中刚刚粘贴的内容
     * CM6: currentCursor 和 getCursor() 都是文档偏移量
     */
    function setSelection(): void;
    /**
     * 绑定事件
     * 当编辑器选中区域改变、内容改变时、滚动时处理气泡位置
     * CodeMirror 6: 使用适配器的事件监听
     * @returns null
     */
    function bindListener(): boolean;
    function isHidden(): boolean;
    function toggleBubbleDisplay(): void;
    function hideBubble(): boolean;
    function updatePositionWhenScroll(): void;
    function getScrollTop(): any;
    function showBubble(): void;
    function initBubble(): boolean;
    function switchMDClick(event: any): void;
    function switchTextClick(event: any): void;
    function getLastSelectedPosition(): {
        top?: undefined;
    } | {
        top: number;
    };
}
