import type { Diagnostics } from "@rspack/binding";
import type { RspackError } from "./RspackError";
declare const $proxy: unique symbol;
export declare function createDiagnosticArray(adm: Diagnostics & {
    [$proxy]?: RspackError[];
}): RspackError[];
export {};
