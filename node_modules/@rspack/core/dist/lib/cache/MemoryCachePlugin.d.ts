import type { Compiler } from "../../Compiler";
export default class MemoryCachePlugin {
    static PLUGIN_NAME: string;
    apply(compiler: Compiler): void;
}
