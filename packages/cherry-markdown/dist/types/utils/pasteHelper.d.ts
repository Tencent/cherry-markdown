export default pasteHelper;
declare namespace pasteHelper {
    /**
     * 核心方法，粘贴后展示切换按钮
     * 只有粘贴html时才会出现切换按钮
     * @param {Object} currentCursor 当前的光标位置
     * @param {Object} editor 编辑器对象
     * @param {string} html html里的纯文本内容
     * @param {string} md html对应的markdown源码
     * @returns
     */
    function showSwitchBtnAfterPasteHtml($cherry: any, currentCursor: any, editor: any, html: string, md: string): void;
    /**
     * 核心方法，粘贴后展示切换按钮
     * 只有粘贴html时才会出现切换按钮
     * @param {Object} currentCursor 当前的光标位置
     * @param {Object} editor 编辑器对象
     * @param {string} html html里的纯文本内容
     * @param {string} md html对应的markdown源码
     * @returns
     */
    function showSwitchBtnAfterPasteHtml($cherry: any, currentCursor: any, editor: any, html: string, md: string): void;
    function init($cherry: any, currentCursor: any, editor: any, html: any, md: any): void;
    function init($cherry: any, currentCursor: any, editor: any, html: any, md: any): void;
    /**
     * 获取缓存中的复制粘贴类型
     */
    function getTypeFromLocalStorage(): string;
    /**
     * 获取缓存中的复制粘贴类型
     */
    function getTypeFromLocalStorage(): string;
    /**
     * 记忆最近一次用户选择的粘贴类型
     */
    function setTypeToLocalStorage(type: any): void;
    /**
     * 记忆最近一次用户选择的粘贴类型
     */
    function setTypeToLocalStorage(type: any): void;
    /**
     * 在编辑器中自动选中刚刚粘贴的内容
     */
    function setSelection(): void;
    /**
     * 在编辑器中自动选中刚刚粘贴的内容
     */
    function setSelection(): void;
    /**
     * 绑定事件
     * 当编辑器选中区域改变、内容改变时，隐藏切换按钮
     * 当编辑器滚动时，实时更新切换按钮的位置
     * @returns null
     */
    function bindListener(): boolean;
    /**
     * 绑定事件
     * 当编辑器选中区域改变、内容改变时，隐藏切换按钮
     * 当编辑器滚动时，实时更新切换按钮的位置
     * @returns null
     */
    function bindListener(): boolean;
    function isHidden(): boolean;
    function isHidden(): boolean;
    function toggleBubbleDisplay(): void;
    function toggleBubbleDisplay(): void;
    function hideBubble(): boolean;
    function hideBubble(): boolean;
    function updatePositionWhenScroll(): void;
    function updatePositionWhenScroll(): void;
    function getScrollTop(): any;
    function getScrollTop(): any;
    function showBubble(): void;
    function showBubble(): void;
    function initBubble(): boolean;
    function initBubble(): boolean;
    function switchMDClick(event: any): void;
    function switchMDClick(event: any): void;
    function switchTextClick(event: any): void;
    function switchTextClick(event: any): void;
    function getLastSelectedPosition(): {
        top?: undefined;
    } | {
        top: number;
    };
    function getLastSelectedPosition(): {
        top?: undefined;
    } | {
        top: number;
    };
}
