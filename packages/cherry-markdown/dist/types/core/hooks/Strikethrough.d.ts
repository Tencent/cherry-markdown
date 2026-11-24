/**
 * 删除线语法
 */
export default class Strikethrough extends SyntaxBase {
    constructor({ config }?: {
        config: any;
    });
    needWhitespace: boolean;
    rule({ config }?: {
        config: any;
    }): import("../../../../types/syntax.js").BasicHookRegexpRule;
}
import SyntaxBase from '../SyntaxBase.js';
