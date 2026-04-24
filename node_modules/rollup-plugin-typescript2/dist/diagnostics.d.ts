import * as tsTypes from "typescript";
import { RollupContext } from "./context";
export interface IDiagnostics {
    flatMessage: string;
    formatted: string;
    fileLine?: string;
    category: tsTypes.DiagnosticCategory;
    code: number;
    type: string;
}
export declare function convertDiagnostic(type: string, data: tsTypes.Diagnostic[]): IDiagnostics[];
export declare function printDiagnostics(context: RollupContext, diagnostics: IDiagnostics[], pretty?: boolean): void;
//# sourceMappingURL=diagnostics.d.ts.map