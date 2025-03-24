/**
 * 生成ruby，使用场景：给中文增加拼音、给中文增加英文、给英文增加中文等等
 */
export default class Ruby extends MenuBase {
    constructor($cherry: any);
    $testIsRuby(selection: any): boolean;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数，本函数不处理这个参数
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
}
import MenuBase from "@/toolbars/MenuBase";
