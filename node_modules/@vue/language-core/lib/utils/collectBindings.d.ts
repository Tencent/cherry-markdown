import type * as ts from 'typescript';
export declare function collectBindingNames(ts: typeof import('typescript'), node: ts.Node, ast: ts.SourceFile): string[];
export declare function collectBindingRanges(ts: typeof import('typescript'), node: ts.Node, ast: ts.SourceFile): import("../types").TextRange<ts.Identifier>[];
export declare function collectBindingIdentifiers(ts: typeof import('typescript'), node: ts.Node, results?: {
    id: ts.Identifier;
    isRest: boolean;
    initializer: ts.Expression | undefined;
}[], isRest?: boolean, initializer?: ts.Expression | undefined): {
    id: ts.Identifier;
    isRest: boolean;
    initializer: ts.Expression | undefined;
}[];
