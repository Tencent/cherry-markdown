import { type MessagePort } from "node:worker_threads";
import { JsLoaderState } from "@rspack/binding";
import type { LoaderContext } from "../config";
interface WorkerOptions {
    loaderContext: LoaderContext;
    loaderState: JsLoaderState;
    args: any[];
    workerData?: {
        workerPort: MessagePort;
        workerSyncPort: MessagePort;
    };
}
declare function worker(workerOptions: WorkerOptions): void;
export default worker;
