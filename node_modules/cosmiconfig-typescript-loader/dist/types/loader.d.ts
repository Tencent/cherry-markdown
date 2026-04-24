import type { LoaderResult, LoaderSync } from "cosmiconfig";
import { createJiti } from "jiti";
type JitiOptions = Parameters<typeof createJiti>[1];
type LoaderAsync = (filepath: string, content: string) => Promise<LoaderResult>;
export declare function TypeScriptLoader(options?: JitiOptions): LoaderAsync;
/**
 * @deprecated use `TypeScriptLoader`
 */
export declare function TypeScriptLoaderSync(options?: JitiOptions): LoaderSync;
export {};
