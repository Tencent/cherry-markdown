import type { CodeMapping, VirtualCode } from '@volar/language-core';
import type { SFCParseResult } from '@vue/compiler-sfc';
import type * as ts from 'typescript';
import type { Sfc, VueCompilerOptions, VueLanguagePluginReturn } from '../types';
export declare class VueVirtualCode implements VirtualCode {
    fileName: string;
    languageId: string;
    initSnapshot: ts.IScriptSnapshot;
    vueCompilerOptions: VueCompilerOptions;
    readonly id = "main";
    private _snapshot;
    private _parsedSfcResult;
    private _ir;
    private _embeddedCodes;
    private _mappings;
    get snapshot(): ts.IScriptSnapshot;
    get vueSfc(): SFCParseResult | undefined;
    get sfc(): Sfc;
    get embeddedCodes(): VirtualCode[];
    get mappings(): CodeMapping[];
    constructor(fileName: string, languageId: string, initSnapshot: ts.IScriptSnapshot, vueCompilerOptions: VueCompilerOptions, plugins: VueLanguagePluginReturn[], ts: typeof import('typescript'));
    update(newSnapshot: ts.IScriptSnapshot): void;
    private parseSfc;
}
