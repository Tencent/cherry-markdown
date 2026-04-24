import type { Compilation } from "./Compilation";
import type { StatsOptions, StatsValue } from "./config";
import type { StatsCompilation } from "./stats/statsFactoryUtils";
export type { StatsAsset, StatsChunk, StatsCompilation, StatsError, StatsModule } from "./stats/statsFactoryUtils";
export declare class Stats {
    #private;
    constructor(compilation: Compilation);
    get compilation(): Compilation;
    get hash(): Readonly<string | null>;
    get startTime(): number | undefined;
    get endTime(): number | undefined;
    hasErrors(): boolean;
    hasWarnings(): boolean;
    toJson(opts?: StatsValue, forToString?: boolean): StatsCompilation;
    toString(opts?: StatsValue): string;
}
export declare function normalizeStatsPreset(options?: StatsValue): StatsOptions;
