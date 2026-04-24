import type * as CompilerDOM from '@vue/compiler-dom';
import type * as ts from 'typescript';
import type { Sfc, TextRange } from '../types';
export { hyphenate as hyphenateTag } from '@vue/shared';
export declare function hyphenateAttr(str: string): string;
export declare function normalizeAttributeValue(node: CompilerDOM.TextNode): readonly [string, number];
export declare function getElementTagOffsets(node: CompilerDOM.ElementNode, template: NonNullable<Sfc['template']>): [number] | [number, number];
export declare function getStartEnd<T extends ts.Node>(ts: typeof import('typescript'), node: T, ast: ts.SourceFile): TextRange<T>;
export declare function getNodeText(ts: typeof import('typescript'), node: ts.Node, ast: ts.SourceFile): string;
