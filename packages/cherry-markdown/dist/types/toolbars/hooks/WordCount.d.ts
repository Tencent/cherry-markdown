/**
 * 字数统计
 */
export default class wordCount extends MenuBase {
    constructor($cherry: any);
    countState: number;
    countEvent: Event;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
    /**
     * 统计给定 Markdown 文本的字符数、单词数和段落数。
     * @param {string} markdown - 给定的 Markdown 文本字符串
     * @returns {Object} 包含字符数、单词数和段落数的对象
     */
    wordCount(markdown: string): any;
}
import MenuBase from "@/toolbars/MenuBase";
