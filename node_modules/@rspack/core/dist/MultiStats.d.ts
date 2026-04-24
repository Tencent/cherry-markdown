/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/MultiStats.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { MultiStatsOptions, StatsPresets } from "./config";
import type { Stats } from "./Stats";
import type { StatsCompilation } from "./stats/statsFactoryUtils";
export default class MultiStats {
    #private;
    stats: Stats[];
    constructor(stats: Stats[]);
    get hash(): string;
    hasErrors(): boolean;
    hasWarnings(): boolean;
    toJson(options: boolean | StatsPresets | MultiStatsOptions): StatsCompilation;
    toString(options: boolean | StatsPresets | MultiStatsOptions): string;
}
export { MultiStats };
