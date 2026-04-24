import type { ScriptSetupRanges } from '../../parsers/scriptSetupRanges';
import type { Code, Sfc } from '../../types';
import type { ScriptCodegenContext } from './context';
import type { ScriptCodegenOptions } from './index';
export declare function generateScriptSetupImports(scriptSetup: NonNullable<Sfc['scriptSetup']>, scriptSetupRanges: ScriptSetupRanges): Generator<Code>;
export declare function generateGeneric(options: ScriptCodegenOptions, ctx: ScriptCodegenContext, scriptSetup: NonNullable<Sfc['scriptSetup']>, scriptSetupRanges: ScriptSetupRanges, generic: NonNullable<NonNullable<Sfc['scriptSetup']>['generic']>, body: Iterable<Code>): Generator<Code>;
export declare function generateSetupFunction(options: ScriptCodegenOptions, ctx: ScriptCodegenContext, scriptSetup: NonNullable<Sfc['scriptSetup']>, scriptSetupRanges: ScriptSetupRanges, body: Iterable<Code>, output?: Iterable<Code>): Generator<Code>;
