import type { ScriptSetupRanges } from '../../parsers/scriptSetupRanges';
import type { Code, Sfc } from '../../types';
import type { ScriptCodegenContext } from './context';
import type { ScriptCodegenOptions } from './index';
export declare function generateComponent(options: ScriptCodegenOptions, ctx: ScriptCodegenContext, scriptSetup: NonNullable<Sfc['scriptSetup']>, scriptSetupRanges: ScriptSetupRanges): Generator<Code>;
