/**
 * 插入普通表格
 */
export default class Table extends MenuBase {
    constructor($cherry: any);
    subBubbleTableMenu: BubbleTableMenu;
    catchOnce: string;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} [shortKey] 快捷键参数，本 hook 不处理这个参数
     * @returns {*} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): any;
}
import MenuBase from '@/toolbars/MenuBase';
import BubbleTableMenu from '@/toolbars/BubbleTable';
