import type { Sfc, VueLanguagePlugin } from '../types';
export declare const tsCodegen: WeakMap<Sfc, {
    getScriptRanges: () => {
        exportDefault: (import("../types").TextRange<import("typescript").Node> & {
            expression: import("../types").TextRange<import("typescript").Expression>;
            isObjectLiteral: boolean;
            options?: {
                isObjectLiteral: boolean;
                expression: import("../types").TextRange<import("typescript").Node>;
                args: import("../types").TextRange<import("typescript").ObjectLiteralExpression>;
                components: import("../types").TextRange<import("typescript").ObjectLiteralExpression> | undefined;
                directives: import("../types").TextRange<import("typescript").Node> | undefined;
                name: import("../types").TextRange<import("typescript").StringLiteral> | undefined;
                inheritAttrs: string | undefined;
            } | undefined;
        }) | undefined;
        bindings: import("../types").TextRange<import("typescript").Node>[];
        components: import("../types").TextRange<import("typescript").Node>[];
    } | undefined;
    getScriptSetupRanges: () => {
        leadingCommentEndOffset: number;
        importSectionEndOffset: number;
        bindings: import("../types").TextRange<import("typescript").Node>[];
        components: import("../types").TextRange<import("typescript").Node>[];
        defineModel: import("../parsers/scriptSetupRanges").DefineModel[];
        defineProps: import("../parsers/scriptSetupRanges").DefineProps | undefined;
        withDefaults: import("../parsers/scriptSetupRanges").CallExpressionRange | undefined;
        defineEmits: import("../parsers/scriptSetupRanges").DefineEmits | undefined;
        defineSlots: import("../parsers/scriptSetupRanges").DefineSlots | undefined;
        defineExpose: import("../parsers/scriptSetupRanges").CallExpressionRange | undefined;
        defineOptions: import("../parsers/scriptSetupRanges").DefineOptions | undefined;
        useAttrs: import("../parsers/scriptSetupRanges").CallExpressionRange[];
        useCssModule: import("../parsers/scriptSetupRanges").CallExpressionRange[];
        useSlots: import("../parsers/scriptSetupRanges").CallExpressionRange[];
        useTemplateRef: import("../parsers/scriptSetupRanges").UseTemplateRef[];
    } | undefined;
    getGeneratedScript: () => {
        generatedTypes: Set<string>;
        localTypes: {
            generate: () => Generator<string, void, unknown>;
            readonly PrettifyLocal: string;
            readonly WithDefaults: string;
            readonly WithSlots: string;
            readonly PropsChildren: string;
            readonly TypePropsToOption: string;
            readonly OmitIndexSignature: string;
        };
        inlayHints: import("../codegen/inlayHints").InlayHintInfo[];
        codes: import("../types").Code[];
    };
    getGeneratedTemplate: () => {
        generatedTypes: Set<string>;
        currentInfo: {
            ignoreError?: boolean | undefined;
            expectError?: {
                token: number;
                node: import("@vue/compiler-dom").CommentNode;
            } | undefined;
            generic?: {
                content: string;
                offset: number;
            } | undefined;
        };
        resolveCodeFeatures: (features: import("../types").VueCodeInformation) => import("../types").VueCodeInformation;
        inVFor: boolean;
        slots: {
            name: string;
            offset?: number | undefined;
            tagRange: [number, number];
            nodeLoc: any;
            propsVar: string;
        }[];
        dynamicSlots: {
            expVar: string;
            propsVar: string;
        }[];
        dollarVars: Set<string>;
        componentAccessMap: Map<string, Map<string, Set<number>>>;
        blockConditions: string[];
        inlayHints: import("../codegen/inlayHints").InlayHintInfo[];
        inheritedAttrVars: Set<string>;
        templateRefs: Map<string, {
            typeExp: string;
            offset: number;
        }[]>;
        singleRootElTypes: Set<string>;
        singleRootNodes: Set<import("@vue/compiler-dom").ElementNode | null>;
        addTemplateRef(name: string, typeExp: string, offset: number): void;
        recordComponentAccess(source: string, name: string, offset?: number | undefined): void;
        scopes: Set<string>[];
        components: (() => string)[];
        declare(...varNames: string[]): void;
        startScope(): () => Generator<import("../types").Code, any, any>;
        getInternalVariable(): string;
        getHoistVariable(originalVar: string): string;
        generateHoistVariables(): Generator<string, void, unknown>;
        generateConditionGuards(): Generator<string, void, unknown>;
        enter(node: import("@vue/compiler-dom").RootNode | import("@vue/compiler-dom").SimpleExpressionNode | import("@vue/compiler-dom").TemplateChildNode): boolean;
        exit(): Generator<import("../types").Code, any, any>;
        codes: import("../types").Code[];
    } | undefined;
    getImportedComponents: () => Set<string>;
    getSetupExposed: () => Set<string>;
}>;
declare const plugin: VueLanguagePlugin;
export default plugin;
