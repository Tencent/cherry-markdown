import type * as ts from 'typescript';
import type { Code, Sfc, SfcBlock, VueCodeInformation } from '../../types';
export declare const newLine = "\n";
export declare const endOfLine = ";\n";
export declare const identifierRegex: RegExp;
export declare function getTypeScriptAST(ts: typeof import('typescript'), block: SfcBlock, text: string): ts.SourceFile;
export declare function generateSfcBlockSection(block: NonNullable<Sfc['script' | 'scriptSetup']>, start: number, end: number, features: VueCodeInformation): Generator<Code>;
export declare function forEachNode(ts: typeof import('typescript'), node: ts.Node): Generator<ts.Node>;
