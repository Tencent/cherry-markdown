import type { Code } from '../../types';
import type { TemplateCodegenContext } from '../template/context';
import type { StyleCodegenOptions } from '.';
export declare function generateStyleModules({ styles, vueCompilerOptions }: StyleCodegenOptions, ctx: TemplateCodegenContext): Generator<Code>;
