/// <reference types="node" />
import * as path from "path";
import * as tsTypes from "typescript";
export declare class FormatHost implements tsTypes.FormatDiagnosticsHost {
    getCurrentDirectory(): string;
    getCanonicalFileName: typeof path.normalize;
    getNewLine: () => string;
}
export declare const formatHost: FormatHost;
//# sourceMappingURL=diagnostics-format-host.d.ts.map