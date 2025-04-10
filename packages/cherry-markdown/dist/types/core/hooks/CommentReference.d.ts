/**
 * 脚注和引用语法
 * 示例：
 *    这里需要一个脚注[^脚注别名1]，另外这里也需要一个脚注[^another]。
 *    [^脚注别名1]: 无论脚注内容写在哪里，脚注的内容总会显示在页面最底部
 *    以两次回车结束
 *
 *    [^another]: 另外，脚注里也可以使用一些简单的markdown语法
 *    >比如 !!#ff0000 这里!!有一段**引用**
 */
export default class CommentReference extends ParagraphBase {
    constructor({ externals, config }: {
        externals: any;
        config: any;
    });
    commentCache: {};
    $cleanCache(): void;
    pushCommentReferenceCache(key: any, cache: any): void;
    getCommentReferenceCache(key: any): any;
    beforeMakeHtml(str: any): any;
    afterMakeHtml(str: any): string;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from "@/core/ParagraphBase";
