import type { InlayHintInfo } from '../inlayHints';
import type { ScriptCodegenOptions } from './index';
export type ScriptCodegenContext = ReturnType<typeof createScriptCodegenContext>;
export declare function createScriptCodegenContext(options: ScriptCodegenOptions): {
    generatedTypes: Set<string>;
    localTypes: {
        generate: () => Generator<string, void, unknown>;
        readonly PrettifyLocal: string;
        readonly WithDefaults: string;
        readonly WithSlots: string;
        readonly PropsChildren: string;
        readonly TypePropsToOption: string;
        readonly OmitIndexSignature: string;
    };
    inlayHints: InlayHintInfo[];
};
