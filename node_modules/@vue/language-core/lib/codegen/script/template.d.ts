import type { Code } from '../../types';
import type { ScriptCodegenContext } from './context';
import type { ScriptCodegenOptions } from './index';
export declare function generateTemplate(options: ScriptCodegenOptions, ctx: ScriptCodegenContext, selfType?: string): Generator<Code>;
