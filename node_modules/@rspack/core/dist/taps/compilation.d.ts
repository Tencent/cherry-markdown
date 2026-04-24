import binding from "@rspack/binding";
import type { CreatePartialRegisters } from "./types";
export declare class CodeGenerationResult {
    #private;
    constructor(result: binding.JsCodegenerationResult);
    get(sourceType: string): string;
}
export declare const createCompilationHooksRegisters: CreatePartialRegisters<`Compilation`>;
