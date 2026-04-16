/**
 * AI 流式输出场景，自动闭合语法，避免语法被截断，涉及语法：
 * - 加粗、斜体
 * - 图片、音频、视频
 * - 超链接
 */
export default class AiFlowAutoClose extends ParagraphBase {
    constructor({ config, cherry }: {
        config: any;
        cherry: any;
    });
    $cherry: any;
    $dealEmphasis(str: any): any;
    dealMedia(str: any): any;
    dealLink(str: any): any;
    makeHtml(str: any, sentenceMakeFunc: any): any;
}
import ParagraphBase from '@/core/ParagraphBase';
