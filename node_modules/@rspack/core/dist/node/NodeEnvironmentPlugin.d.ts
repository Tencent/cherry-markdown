import type { Compiler } from "..";
import type { InfrastructureLogging } from "../config";
export interface NodeEnvironmentPluginOptions {
    infrastructureLogging: InfrastructureLogging;
}
export default class NodeEnvironmentPlugin {
    options: NodeEnvironmentPluginOptions;
    constructor(options: NodeEnvironmentPluginOptions);
    apply(compiler: Compiler): void;
}
