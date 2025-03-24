/**
 * 复制按钮，用来复制预览区的html内容
 * 该操作会将预览区的css样式以行内样式的形式插入到html内容里，从而保证粘贴时样式一致
 */
export default class Copy extends MenuBase {
    constructor($cherry: any);
    previewer: any;
    isLoading: boolean;
    lastIconOuterHtml: string;
    adaptWechat(rawHtml: any): Promise<any>;
    getStyleFromSheets(keyword: any): string;
    computeStyle(): {
        mathStyle: string;
        echartStyle: string;
        cherryStyle: string;
    };
    /**
     * 由于复制操作会随着预览区域的内容增加而耗时变长，所以需要增加“正在复制”的状态回显
     * 同时该状态也用于限频
     */
    toggleLoading(): void;
    /**
     * 响应点击事件
     * 该按钮不会引发编辑区域的内容改动，所以不用处理用户在编辑区域的选中内容
     * @param {Event} e 点击事件
     */
    onClick(e: Event): void;
}
import MenuBase from "@/toolbars/MenuBase";
