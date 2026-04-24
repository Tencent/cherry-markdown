import type { JsAddingRuntimeModule } from "@rspack/binding";
import type { Chunk } from "./Chunk";
import type { ChunkGraph } from "./ChunkGraph";
import type { Compilation } from "./Compilation";
export declare enum RuntimeModuleStage {
    NORMAL = 0,
    BASIC = 5,
    ATTACH = 10,
    TRIGGER = 20
}
export declare class RuntimeModule {
    static STAGE_NORMAL: RuntimeModuleStage;
    static STAGE_BASIC: RuntimeModuleStage;
    static STAGE_ATTACH: RuntimeModuleStage;
    static STAGE_TRIGGER: RuntimeModuleStage;
    static __to_binding(module: RuntimeModule): JsAddingRuntimeModule;
    private _name;
    private _stage;
    fullHash: boolean;
    dependentHash: boolean;
    protected chunk: Chunk | null;
    protected compilation: Compilation | null;
    protected chunkGraph: ChunkGraph | null;
    constructor(name: string, stage?: RuntimeModuleStage);
    attach(compilation: Compilation, chunk: Chunk, chunkGraph: ChunkGraph): void;
    get name(): string;
    get stage(): RuntimeModuleStage;
    identifier(): string;
    readableIdentifier(): string;
    shouldIsolate(): boolean;
    generate(): string;
}
