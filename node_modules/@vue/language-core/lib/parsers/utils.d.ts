import type * as ts from 'typescript';
import type { TextRange } from '../types';
export declare function parseBindingRanges(ts: typeof import('typescript'), ast: ts.SourceFile, componentExtsensions: string[]): {
    bindings: TextRange<ts.Node>[];
    components: TextRange<ts.Node>[];
};
export declare function getClosestMultiLineCommentRange(ts: typeof import('typescript'), node: ts.Node, parents: ts.Node[], ast: ts.SourceFile): TextRange | undefined;
