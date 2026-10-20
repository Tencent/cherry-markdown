export default class MathBlock extends ParagraphBase {
    constructor({ config, cherry }: {
        config: any;
        cherry: any;
    });
    /**
     * 块级公式语法
     * 该语法具有排他性，并且需要优先其他段落级语法进行渲染
     * @type {'katex' | 'MathJax' | 'node'}
     */
    engine: "katex" | "MathJax" | "node";
    katex: any;
    MathJax: any;
    TeXDelimiter: boolean;
    $cherry: any;
    lastCode: string;
    toHtml(wholeMatch: any, lineSpace: any, leadingChar: any, content: any): string;
    isSelfClosing(): any;
    $dealUnclosingMath(str: any): any;
    makeMath(str: any): any;
    /**
     * 将 `\[...\]` 归一化为 `~D~D...~D~D`。空白内容不归一化，
     */
    rewriteBracketBlock(str: any): any;
    /** selfClosing 场景下补开定界符：把"未闭合 \["补一个 ~D~D 前缀。 */
    rewriteOpenOnlyBracket(str: any): any;
    /** selfClosing 兜底：把最尾的孤立 ~D~D 补齐成闭合的 ~D~D..~D~D，再走一次 makeMath。 */
    makeMathWithSelfClosing(str: any): any;
    /**
     * 整体流程：
     *   Step 1: 先跑一次 makeMath，把用户原生输入的 $$..$$（经 Engine 编码为 ~D~D..~D~D）
     *           整段渲染并存入 cache，剩余字符串里的 ~D~D 段被替换为 cache 占位符，
     *           从而形成天然"保护壳"——后续 \[..\] 归一化不会误伤 $$..$$ 内部的 \[。
     *   Step 2: 归一化剩余（未被 $$..$$ 包住）的 \[..\] → ~D~D..~D~D，
     *           再跑一次 makeMath 把新归一化的段落也吃到 cache 里，
     *           避免下一步的 selfClosing 正则把已闭合公式误当成半开公式。
     *   Step 3: selfClosing 场景下，把剩余的"未闭合 \["补一个开定界符 ~D~D。
     *   Step 4: selfClosing 兜底——把最尾的孤立 ~D~D 补齐成闭合的 ~D~D..~D~D 并渲染。
     *
     * 当 TeXDelimiter 关闭时，跳过 Step 2 / Step 3，仅保留 Step 1 冻结 + Step 4 兜底。
     */
    beforeMakeHtml(str: any): any;
    makeHtml(str: any): any;
    rule(): {
        begin: string;
        content: string;
        end: string;
    };
}
import ParagraphBase from '../../core/ParagraphBase';
