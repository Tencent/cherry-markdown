import type { SFCParseResult } from '@vue/compiler-sfc';
import type * as ts from 'typescript';
import type { Sfc, VueLanguagePluginReturn } from '../types';
export declare function useIR(ts: typeof import('typescript'), plugins: VueLanguagePluginReturn[], fileName: string, getSnapshot: () => ts.IScriptSnapshot, getParseSfcResult: () => SFCParseResult | undefined): Sfc;
