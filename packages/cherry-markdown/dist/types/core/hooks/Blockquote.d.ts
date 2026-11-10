export default class Blockquote extends ParagraphBase {
    constructor(options?: {});
    enableGfmAlert: boolean;
    gfmAlertTypes: Record<string, {
        className: string;
        title: string;
    }>;
    /**
     * 识别并剥离 GFM Alerts 首行标记
     * 规则：blockquote 的第一行必须形如 `[!TYPE]`（紧跟在 `>` 后，允许前后空白）
     * @param {string} rawContent 已剥离 `>` 前缀的 blockquote 原始内容
     * @returns {{ alertType: string|null, alertTitle: string, content: string }}
     *    alertType 为 null 表示非 GFM Alert，content 原样返回
     */
    $parseGfmAlert(rawContent: string): {
        alertType: string | null;
        alertTitle: string;
        content: string;
    };
    handleMatch(str: any, sentenceMakeFunc: any): any;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from '../../core/ParagraphBase';
