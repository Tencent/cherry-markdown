import * as CompilerDOM from '@vue/compiler-dom';
import type { Code } from '../../types';
import type { TemplateCodegenContext } from './context';
import type { TemplateCodegenOptions } from './index';
export interface FailGeneratedExpression {
    node: CompilerDOM.SimpleExpressionNode;
    prefix: string;
    suffix: string;
}
export declare function generateElementProps(options: TemplateCodegenOptions, ctx: TemplateCodegenContext, node: CompilerDOM.ElementNode, props: CompilerDOM.ElementNode['props'], strictPropsCheck: boolean, failGeneratedExpressions?: FailGeneratedExpression[]): Generator<Code>;
export declare function generatePropExp(options: TemplateCodegenOptions, ctx: TemplateCodegenContext, prop: CompilerDOM.DirectiveNode, exp: CompilerDOM.SimpleExpressionNode | undefined): Generator<Code>;
