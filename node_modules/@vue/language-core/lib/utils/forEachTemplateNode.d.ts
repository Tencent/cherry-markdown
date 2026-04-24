import * as CompilerDOM from '@vue/compiler-dom';
export declare function forEachElementNode(node: CompilerDOM.RootNode | CompilerDOM.TemplateChildNode): Generator<CompilerDOM.ElementNode>;
export declare function forEachInterpolationNode(node: CompilerDOM.RootNode | CompilerDOM.TemplateChildNode | CompilerDOM.SimpleExpressionNode): Generator<CompilerDOM.InterpolationNode>;
