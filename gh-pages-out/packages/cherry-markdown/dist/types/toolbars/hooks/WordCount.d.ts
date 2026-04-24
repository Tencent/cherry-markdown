/**
 * 字数统计
 */
export default class wordCount extends MenuBase {
    constructor($cherry: any);
    countEvent: Event;
    countState: number;
    $dealEditorChange(): void;
    btnDom: any;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from '@/toolbars/MenuBase';
