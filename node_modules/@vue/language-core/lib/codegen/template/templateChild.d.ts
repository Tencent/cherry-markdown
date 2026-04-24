import * as CompilerDOM from '@vue/compiler-dom';
import type { Code } from '../../types';
import type { TemplateCodegenContext } from './context';
import type { TemplateCodegenOptions } from './index';
export declare function generateTemplateChild(options: TemplateCodegenOptions, ctx: TemplateCodegenContext, node: CompilerDOM.RootNode | CompilerDOM.TemplateChildNode | CompilerDOM.SimpleExpressionNode, enterNode?: boolean): Generator<Code>;
export declare function parseInterpolationNode(node: CompilerDOM.InterpolationNode, template: string): readonly [string, number];
