import type * as ts from 'typescript';
import type { TextRange, VueCompilerOptions } from '../types';
export interface CallExpressionRange {
    callExp: TextRange;
    exp: TextRange;
    arg?: TextRange;
    typeArg?: TextRange;
}
export interface DefineModel {
    arg?: TextRange;
    localName?: TextRange;
    name?: TextRange;
    type?: TextRange;
    modifierType?: TextRange;
    runtimeType?: TextRange;
    defaultValue?: TextRange;
    required?: boolean;
    comments?: TextRange;
}
export interface DefineProps extends CallExpressionRange {
    name?: string;
    destructured?: Map<string, ts.Expression | undefined>;
    destructuredRest?: string;
    statement: TextRange;
}
export interface DefineEmits extends CallExpressionRange {
    name?: string;
    hasUnionTypeArg?: boolean;
    statement: TextRange;
}
export interface DefineSlots extends CallExpressionRange {
    name?: string;
    statement: TextRange;
}
export interface DefineOptions {
    name?: string;
    inheritAttrs?: string;
}
export interface UseTemplateRef extends CallExpressionRange {
    name?: string;
}
export interface ScriptSetupRanges extends ReturnType<typeof parseScriptSetupRanges> {
}
export declare function parseScriptSetupRanges(ts: typeof import('typescript'), sourceFile: ts.SourceFile, vueCompilerOptions: VueCompilerOptions): {
    leadingCommentEndOffset: number;
    importSectionEndOffset: number;
    bindings: TextRange<ts.Node>[];
    components: TextRange<ts.Node>[];
    defineModel: DefineModel[];
    defineProps: DefineProps | undefined;
    withDefaults: CallExpressionRange | undefined;
    defineEmits: DefineEmits | undefined;
    defineSlots: DefineSlots | undefined;
    defineExpose: CallExpressionRange | undefined;
    defineOptions: DefineOptions | undefined;
    useAttrs: CallExpressionRange[];
    useCssModule: CallExpressionRange[];
    useSlots: CallExpressionRange[];
    useTemplateRef: UseTemplateRef[];
};
