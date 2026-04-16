/**
 * 当光标处于编辑器新行起始位置时出现的浮动工具栏
 */
export default class FloatMenu extends Toolbar {
    editor: any;
    editorDom: any;
    initAction(): void;
    boundHandleSelectionChange: any;
    boundHandleContentChange: any;
    boundHandleBeforeSelectionChange: any;
    /**
     * 处理选区变化
     * @param {Object} event 选区变化事件
     */
    handleSelectionChange(event: any): void;
    /**
     * 处理内容变化
     */
    handleContentChange(): void;
    /**
     * 处理beforeSelectionChange事件
     * @param {Object} selection 选区对象
     */
    handleBeforeSelectionChange({ selection }: any): void;
    /**
     * 创建兼容的 CodeMirror 对象
     * @returns {Object} 兼容的 CodeMirror 对象
     */
    createCompatCodeMirror(): any;
    /**
     * 隐藏浮动菜单
     */
    hideFloatMenu(): void;
    /**
     * 清理事件监听器
     */
    destroy(): void;
    update(evt: any, codeMirror: any): boolean;
    /**
     * 当光标激活时触发，当光标处于行起始位置时展示float工具栏；反之隐藏
     * @param {Event} evt
     * @param {Object} codeMirror 兼容的 CodeMirror 对象
     * @returns
     */
    cursorActivity(evt: Event, codeMirror: any): boolean;
    /**
     * 判断是否需要隐藏Float工具栏
     * 有选中内容，或者光标所在行有内容时隐藏float 工具栏
     * @param {number} line
     * @param {Object} codeMirror 兼容的 CodeMirror 对象
     * @returns {boolean} 是否需要隐藏float工具栏，true：需要隐藏
     */
    isHidden(line: number, codeMirror: any): boolean;
    /**
     * 获取对应行的顶部偏移量，用来定位 float 工具栏
     * @param {number} line 0-indexed 行号
     * @param {Object} codeMirror 兼容的 CodeMirror 对象
     * @returns {number}
     */
    getLineHeight(line: number, codeMirror: any): number;
}
import Toolbar from './Toolbar';
