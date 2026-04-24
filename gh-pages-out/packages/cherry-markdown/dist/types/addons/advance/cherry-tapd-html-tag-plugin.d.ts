/**
 * [TAPD](https://tapd.cn)的html块语法
 * 被[html]**[/html]包裹的内容不会进行任何markdown引擎渲染而直接加载到预览区
 * 该功能常见的场景为“导入word”
 * 导入word后，后端返回word的html内容，此内容被[html]**[/html]包裹后会直接加载到预览区，保证样式的一致性
 * 一般不建议引导用户使用该功能
 */
export default class TapdHtmlTagPlugin extends ParagraphBase {
    constructor();
    makeHtml(html: any, sentenceMakeFunc: any): any;
    rule(): {
        reg: RegExp;
    };
    _trimScripTag(str: any): any;
}
import ParagraphBase from '@/core/ParagraphBase';
