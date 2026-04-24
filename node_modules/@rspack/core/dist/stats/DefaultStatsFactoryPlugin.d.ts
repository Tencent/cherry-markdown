import type { Compiler } from "../Compiler";
export declare const SHARED_ITEM_NAMES: {
    "compilation.children[]": string;
    "compilation.modules[]": string;
    "compilation.entrypoints[]": string;
    "compilation.namedChunkGroups[]": string;
    "compilation.errors[]": string;
    "chunk.modules[]": string;
    "chunk.origins[]": string;
    "compilation.chunks[]": string;
    "compilation.assets[]": string;
    "asset.related[]": string;
    "module.issuerPath[]": string;
    "module.reasons[]": string;
    "module.modules[]": string;
    "module.children[]": string;
};
export declare class DefaultStatsFactoryPlugin {
    apply(compiler: Compiler): void;
}
