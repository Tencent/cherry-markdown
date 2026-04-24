import type { VueCompilerOptions } from '../types';
export declare function getLocalTypesGenerator(vueCompilerOptions: VueCompilerOptions): {
    generate: () => Generator<string, void, unknown>;
    readonly PrettifyLocal: string;
    readonly WithDefaults: string;
    readonly WithSlots: string;
    readonly PropsChildren: string;
    readonly TypePropsToOption: string;
    readonly OmitIndexSignature: string;
};
