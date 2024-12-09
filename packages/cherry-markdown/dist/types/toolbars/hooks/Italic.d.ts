/**
 * 插入斜体的按钮
 */
export default class Italic extends MenuBase {
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            aliasName: any;
        };
    };
    /**
     * 是不是包含加粗语法
     * @param {String} selection
     * @returns {Boolean}
     */
    $testIsItalic(selection: string): boolean;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数，本函数不处理这个参数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from "@/toolbars/MenuBase";
