/**
 * "插入"按钮
 */
export default class Insert extends MenuBase {
    constructor($cherry: any);
    subBubbleTableMenu: BubbleTableMenu;
    /**
     * 上传文件的逻辑
     * @param {string} type 上传文件的类型
     */
    handleUpload(type?: string): void;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数
     * @param {Function} [callback] 回调函数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string, callback?: Function): string;
}
import MenuBase from "@/toolbars/MenuBase";
import BubbleTableMenu from "@/toolbars/BubbleTable";
