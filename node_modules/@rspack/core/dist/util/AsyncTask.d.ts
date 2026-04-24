type TaskCallback<Ret> = (err: Error | null, ret: Ret | null) => void;
export declare class AsyncTask<Param, Ret> {
    #private;
    constructor(task: (param: Param[], callback: (results: [Error | null, Ret | null][]) => void) => void);
    exec(param: Param, callback: TaskCallback<Ret>): void;
}
export {};
