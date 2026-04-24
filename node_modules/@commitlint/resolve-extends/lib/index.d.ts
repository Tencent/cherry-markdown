import type { ParserPreset, UserConfig } from '@commitlint/types';
/**
 * @see moduleResolve
 */
export declare const resolveFrom: (lookup: string, parent?: string) => string;
/**
 *
 * @param resolvedParserPreset path resolved by {@link resolveFrom}
 * @returns path and parserOpts function retrieved from `resolvedParserPreset`
 */
export declare const loadParserPreset: (resolvedParserPreset: string) => Promise<Pick<ParserPreset, "path" | "parserOpts">>;
export interface ResolveExtendsContext {
    cwd?: string;
    parserPreset?: string | ParserPreset;
    prefix?: string;
    resolve?(id: string, ctx?: {
        prefix?: string;
        cwd?: string;
    }): string;
    resolveGlobal?: (id: string) => string;
    dynamicImport?<T>(id: string): T | Promise<T>;
}
export default function resolveExtends(config?: UserConfig, context?: ResolveExtendsContext): Promise<UserConfig>;
export declare function resolveFromSilent(specifier: string, parent: string): string | void;
/**
 * @see https://github.com/sindresorhus/resolve-global/blob/682a6bb0bd8192b74a6294219bb4c536b3708b65/index.js#L7
 */
export declare function resolveGlobalSilent(specifier: string): string | void;
//# sourceMappingURL=index.d.ts.map