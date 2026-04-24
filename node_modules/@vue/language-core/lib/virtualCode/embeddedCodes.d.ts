import type { Mapping, VirtualCode } from '@volar/language-core';
import type { Code, Sfc, VueLanguagePluginReturn } from '../types';
export declare class VueEmbeddedCode {
    id: string;
    lang: string;
    content: Code[];
    parentCodeId?: string;
    linkedCodeMappings: Mapping[];
    embeddedCodes: VueEmbeddedCode[];
    constructor(id: string, lang: string, content: Code[]);
}
export declare function useEmbeddedCodes(plugins: VueLanguagePluginReturn[], fileName: string, sfc: Sfc): () => VirtualCode[];
