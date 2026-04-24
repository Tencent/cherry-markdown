import type * as ts from 'typescript';
import type { Code, Sfc, VueCompilerOptions } from '../../types';
export interface TemplateCodegenOptions {
    typescript: typeof ts;
    vueCompilerOptions: VueCompilerOptions;
    template: NonNullable<Sfc['template']>;
    setupRefs: Set<string>;
    setupConsts: Set<string>;
    hasDefineSlots?: boolean;
    propsAssignName?: string;
    slotsAssignName?: string;
    inheritAttrs: boolean;
    componentName: string;
}
export { generate as generateTemplate };
declare function generate(options: TemplateCodegenOptions): {
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
    resolveCodeFeatures: (features: import("../../types").VueCodeInformation) => import("../../types").VueCodeInformation;
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
    inlayHints: import("../inlayHints").InlayHintInfo[];
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
    startScope(): () => Generator<Code, any, any>;
    getInternalVariable(): string;
    getHoistVariable(originalVar: string): string;
    generateHoistVariables(): Generator<string, void, unknown>;
    generateConditionGuards(): Generator<string, void, unknown>;
    enter(node: import("@vue/compiler-dom").RootNode | import("@vue/compiler-dom").SimpleExpressionNode | import("@vue/compiler-dom").TemplateChildNode): boolean;
    exit(): Generator<Code, any, any>;
    codes: Code[];
};
