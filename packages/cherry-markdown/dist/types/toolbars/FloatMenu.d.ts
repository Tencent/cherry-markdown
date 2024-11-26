/**
 * 当光标处于编辑器新行起始位置时出现的浮动工具栏
 */
export default class FloatMenu extends Toolbar {
    editor: any;
    editorDom: any;
    initAction(): void;
    update(evt: any, codeMirror: any): boolean;
    /**
     * 当光标激活时触发，当光标处于行起始位置时展示float工具栏；反之隐藏
     * @param {Event} evt
     * @param {CodeMirror.Editor} codeMirror
     * @returns
     */
    cursorActivity(evt: Event, codeMirror: CodeMirror.Editor): boolean;
    /**
     * 判断是否需要隐藏Float工具栏
     * 有选中内容，或者光标所在行有内容时隐藏float 工具栏
     * @param {number} line
     * @param {CodeMirror.Editor} codeMirror
     * @returns {boolean} 是否需要隐藏float工具栏，true：需要隐藏
     */
    isHidden(line: number, codeMirror: CodeMirror.Editor): boolean;
    /**
     * 获取对应行的行高度，用来让float 工具栏在该行保持垂直居中
     * @param {number} line
     * @param {CodeMirror.Editor} codeMirror
     * @returns
     */
    getLineHeight(line: number, codeMirror: CodeMirror.Editor): number;
}
import Toolbar from "./Toolbar";
