import type { Tinypool } from "tinypool" with { "resolution-mode": "import" };
type RunOptions = Parameters<Tinypool["run"]>[1];
export interface WorkerResponseMessage {
    type: "response";
    id: number;
    data: any;
}
export interface WorkerResponseErrorMessage {
    type: "response-error";
    id: number;
    error: WorkerError;
}
interface WorkerDoneMessage {
    type: "done";
    data: WorkerArgs;
}
interface WorkerDoneErrorMessage {
    type: "done-error";
    error: WorkerError;
}
export interface WorkerRequestMessage {
    type: "request";
    id: number;
    requestType: RequestType;
    data: WorkerArgs;
}
export interface WorkerRequestSyncMessage {
    type: "request-sync";
    id: number;
    requestType: RequestSyncType;
    data: WorkerArgs;
    sharedBuffer: SharedArrayBuffer;
}
export type WorkerMessage = WorkerResponseMessage | WorkerDoneMessage | WorkerRequestMessage | WorkerResponseErrorMessage | WorkerDoneErrorMessage | WorkerRequestSyncMessage;
export declare function isWorkerResponseMessage(message: WorkerMessage): message is WorkerResponseMessage;
export declare function isWorkerResponseErrorMessage(message: WorkerMessage): message is WorkerResponseErrorMessage;
export declare enum RequestType {
    AddDependency = "AddDependency",
    AddContextDependency = "AddContextDependency",
    AddMissingDependency = "AddMissingDependency",
    AddBuildDependency = "AddBuildDependency",
    GetDependencies = "GetDependencies",
    GetContextDependencies = "GetContextDependencies",
    GetMissingDependencies = "GetMissingDependencies",
    ClearDependencies = "ClearDependencies",
    Resolve = "Resolve",
    GetResolve = "GetResolve",
    GetLogger = "GetLogger",
    EmitError = "EmitError",
    EmitWarning = "EmitWarning",
    EmitFile = "EmitFile",
    EmitDiagnostic = "EmitDiagnostic",
    SetCacheable = "SetCacheable",
    ImportModule = "ImportModule",
    UpdateLoaderObjects = "UpdateLoaderObjects",
    CompilationGetPath = "CompilationGetPath",
    CompilationGetPathWithInfo = "CompilationGetPathWithInfo",
    CompilationGetAssetPath = "CompilationGetAssetPath",
    CompilationGetAssetPathWithInfo = "CompilationGetAssetPathWithInfo"
}
export declare enum RequestSyncType {
    WaitForPendingRequest = "WaitForPendingRequest"
}
export type HandleIncomingRequest = (requestType: RequestType, ...args: any[]) => any;
type WorkerArgs = any[];
export type WorkerError = Error;
export declare function serializeError(error: unknown): WorkerError;
export declare const run: (loaderName: string, task: any, options: RunOptions & {
    handleIncomingRequest: HandleIncomingRequest;
}, workerOptions?: {
    maxWorkers?: number;
}) => Promise<WorkerArgs>;
export {};
