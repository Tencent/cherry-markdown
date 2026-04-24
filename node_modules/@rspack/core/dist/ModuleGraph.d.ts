import type { Dependency, JsModuleGraph, ModuleGraphConnection } from "@rspack/binding";
import { ExportsInfo } from "./ExportsInfo";
import type { Module } from "./Module";
export default class ModuleGraph {
    #private;
    static __from_binding(binding: JsModuleGraph): ModuleGraph;
    constructor(binding: JsModuleGraph);
    getModule(dependency: Dependency): Module | null;
    getResolvedModule(dependency: Dependency): Module | null;
    getParentModule(dependency: Dependency): Module | null;
    getIssuer(module: Module): Module | null;
    getExportsInfo(module: Module): ExportsInfo;
    getConnection(dependency: Dependency): ModuleGraphConnection | null;
    getOutgoingConnections(module: Module): ModuleGraphConnection[];
    getIncomingConnections(module: Module): ModuleGraphConnection[];
    getParentBlockIndex(dependency: Dependency): number;
    isAsync(module: Module): boolean;
    getOutgoingConnectionsInOrder(module: Module): ModuleGraphConnection[];
}
