import type { ScriptRanges } from '../../parsers/scriptRanges';
import type { ScriptSetupRanges } from '../../parsers/scriptSetupRanges';
import type { Code, Sfc, VueCompilerOptions } from '../../types';
export interface ScriptCodegenOptions {
    vueCompilerOptions: VueCompilerOptions;
    script: Sfc['script'];
    scriptSetup: Sfc['scriptSetup'];
    fileName: string;
    scriptRanges: ScriptRanges | undefined;
    scriptSetupRanges: ScriptSetupRanges | undefined;
    templateAndStyleTypes: Set<string>;
    templateAndStyleCodes: Code[];
    exposed: Set<string>;
}
export { generate as generateScript };
declare function generate(options: ScriptCodegenOptions): {
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
    inlayHints: import("../inlayHints").InlayHintInfo[];
    codes: Code[];
};
