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
    $getClassByType(type: any): string;
    $getPanelInfo(name: any, str: any, sentenceMakeFunc: any): {
        type: string;
        title: any;
        body: any;
        appendStyle: string;
        className: string;
    };
    $getTitle(name: any): any;
    $getTargetType(name: any): "center" | "left" | "right" | "success" | "primary" | "info" | "warning" | "danger";
    rule(): any;
}
import ParagraphBase from "@/core/ParagraphBase";
