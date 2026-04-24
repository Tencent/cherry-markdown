import { type RawOptions } from "@rspack/binding";
import type { Compiler } from "../Compiler";
import { type LoaderContext, type LoaderDefinition, type LoaderDefinitionFunction, type PitchLoaderDefinitionFunction } from "./adapterRuleUse";
import type { RspackOptionsNormalized } from "./normalization";
import type { Resolve } from "./types";
export type { LoaderContext, LoaderDefinition, LoaderDefinitionFunction, PitchLoaderDefinitionFunction };
export declare const getRawOptions: (options: RspackOptionsNormalized, compiler: Compiler) => RawOptions;
export declare function getRawResolve(resolve: Resolve): RawOptions["resolve"];
