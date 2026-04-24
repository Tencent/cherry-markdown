import type { Code, SfcBlock, VueCodeInformation } from '../../types';
import type { TemplateCodegenContext } from './context';
export declare function generateInterpolation({ typescript, setupRefs }: {
    typescript: typeof import('typescript');
    setupRefs: Set<string>;
}, ctx: TemplateCodegenContext, block: SfcBlock, data: VueCodeInformation, code: string, start: number, prefix?: string, suffix?: string): Generator<Code>;
