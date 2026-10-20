/**
 * Omit loose-continuation blanks and coordinate numbering in one final transaction.
 * @type {import('@codemirror/state').StateCommand}
 */
export const cherryInsertNewlineContinueMarkup: import("@codemirror/state").StateCommand;
export type EditorState = import("@codemirror/state").EditorState;
export type SelectionRange = import("@codemirror/state").SelectionRange;
export type Line = import("@codemirror/state").Line;
export type Tree = import("@lezer/common").Tree;
export type EnterContext = {
    /**
     * Document offset of the cursor.
     */
    pos: number;
    line: Line;
    /**
     * Outer-to-inner markup; its from/to are line-relative.
     */
    context: MarkupContext[];
    inner: MarkupContext;
    emptyLine: boolean;
};
/**
 * Changes use original document offsets; range uses offsets after those changes. No dispatch here.
 */
export type RangeEdit = {
    range: SelectionRange;
    changes: import("@codemirror/state").ChangeSpec;
};
declare class MarkupContext {
    /**
     * @param {import('@lezer/common').SyntaxNode} node
     * @param {number} from Line-relative marker start.
     * @param {number} to Line-relative content start.
     * @param {string} spaceBefore
     * @param {string} spaceAfter
     * @param {string} type Marker text, including task checkbox if present.
     * @param {import('@lezer/common').SyntaxNode | null} item
     */
    constructor(node: import("@lezer/common").SyntaxNode, from: number, to: number, spaceBefore: string, spaceAfter: string, type: string, item: import("@lezer/common").SyntaxNode | null);
    node: import("@lezer/common").SyntaxNode;
    from: number;
    to: number;
    spaceBefore: string;
    spaceAfter: string;
    type: string;
    item: import("@lezer/common").SyntaxNode;
    blank(maxWidth: any): string;
    marker(doc: any, plannedNumber?: any): string;
}
export {};
