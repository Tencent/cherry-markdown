export interface ChromeEvent {
    name: string;
    trackName?: string;
    ph: "b" | "e" | "X" | "P";
    processName?: string;
    categories?: string[];
    uuid: number;
    ts: bigint;
    args?: {
        [key: string]: any;
    };
}
type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PartialChromeEvent = MakeOptional<ChromeEvent, "ts" | "ph">;
export declare class JavaScriptTracer {
    static state: "uninitialized" | "on" | "off";
    static startTime: bigint;
    static events: ChromeEvent[];
    static layer: string;
    static output: string;
    static session: import("node:inspector").Session;
    private static counter;
    /**
     * only first call take effects, subsequent calls will be ignored
     * @param layer tracing layer
     * @param output tracing output file path
     */
    static initJavaScriptTrace(layer: string, output: string): Promise<void>;
    static uuid(): number;
    static initCpuProfiler(): void;
    /**
     * only first call take effects, subsequent calls will be ignored
     * @param isEnd true means we are at the end of tracing,and can append ']' to close the json
     * @returns
     */
    static cleanupJavaScriptTrace(): Promise<void>;
    static getTs(): bigint;
    static getCommonEv(): {
        ts: bigint;
        cat: string;
    };
    static pushEvent(event: ChromeEvent): void;
    static startAsync(events: PartialChromeEvent): void;
    static endAsync(events: PartialChromeEvent): void;
}
export {};
