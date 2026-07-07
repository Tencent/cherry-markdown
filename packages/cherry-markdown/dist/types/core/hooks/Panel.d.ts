/**
 * 面板语法
 * 例：
 *  :::tip
 *  这是一段提示信息
 *  :::
 *  :::warning
 *  这是一段警告信息
 *  :::
 *  :::danger
 *  这是一段危险信息
 *  :::
 */
export default class Panel extends ParagraphBase {
    constructor(options: any);
    enableAlign: any;
    enablePanel: any;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    $getClassByType(type: any): string;
    $getPanelInfo(name: any, str: any, sentenceMakeFunc: any): {
        type: string;
        title: any;
        body: any;
        appendStyle: string;
        className: string;
    };
    /**
     * 按 :: 分隔符拆分多列排版语法的内容
     * @param {string} str 面板内容
     * @param {number} colCount 期望的列数（2 或 3）
     * @returns {string[]} 拆分后的各列内容
     */
    $splitCols(str: string, colCount: number): string[];
    $getTitle(name: any): any;
    $getTargetType(name: any): "left" | "right" | "center" | "justify" | "primary" | "info" | "warning" | "danger" | "success" | "2cols" | "3cols";
    rule(): any;
}
import ParagraphBase from '@/core/ParagraphBase';
