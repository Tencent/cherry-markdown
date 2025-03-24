/**
 * +++(-) 点击查看详情
 * body
 * body
 * ++ 标题（默认收起内容）
 * 内容
 * ++- 标题（默认展开内容）
 * 内容2
 * +++
 */
export default class Detail extends ParagraphBase {
    constructor();
    $getDetailInfo(isOpen: any, title: any, str: any, sentenceMakeFunc: any): {
        type: string;
        html: string;
    };
    $getDetailHtml(defaultOpen: any, title: any, str: any, sentenceMakeFunc: any): string;
    rule(): any;
}
import ParagraphBase from "@/core/ParagraphBase";
