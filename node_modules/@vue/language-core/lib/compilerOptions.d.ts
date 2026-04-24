import type * as ts from 'typescript';
import type { RawVueCompilerOptions, VueCompilerOptions, VueLanguagePlugin } from './types';
interface ParseConfigHost extends Omit<ts.ParseConfigHost, 'readDirectory'> {
}
export interface ParsedCommandLine extends Omit<ts.ParsedCommandLine, 'fileNames'> {
    vueOptions: VueCompilerOptions;
}
export declare function createParsedCommandLineByJson(ts: typeof import('typescript'), host: ParseConfigHost, rootDir: string, json: any, configFileName?: string): ParsedCommandLine;
export declare function createParsedCommandLine(ts: typeof import('typescript'), host: ParseConfigHost, configFileName: string): ParsedCommandLine;
export declare class CompilerOptionsResolver {
    ts: typeof import('typescript');
    readFile: (fileName: string) => string | undefined;
    options: Omit<RawVueCompilerOptions, 'target' | 'strictTemplates' | 'typesRoot' | 'plugins'>;
    target: number | undefined;
    typesRoot: string | undefined;
    plugins: VueLanguagePlugin[];
    constructor(ts: typeof import('typescript'), readFile: (fileName: string) => string | undefined);
    addConfig(options: RawVueCompilerOptions, rootDir: string): void;
    build(defaults?: VueCompilerOptions): VueCompilerOptions;
    resolveVueVersion(folder: string): number | undefined;
}
export declare function getDefaultCompilerOptions(target?: number, lib?: string, strictTemplates?: boolean, typesRoot?: string): VueCompilerOptions;
export {};
