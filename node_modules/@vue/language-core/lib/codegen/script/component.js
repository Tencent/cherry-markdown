"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateComponent = generateComponent;
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const merge_1 = require("../utils/merge");
function* generateComponent(options, ctx, scriptSetup, scriptSetupRanges) {
    yield `(await import('${options.vueCompilerOptions.lib}')).defineComponent({${utils_1.newLine}`;
    const returns = [];
    if (scriptSetupRanges.defineExpose) {
        returns.push([names.exposed]);
    }
    if (returns.length) {
        yield `setup: () => (`;
        yield* (0, merge_1.generateSpreadMerge)(returns);
        yield `),${utils_1.newLine}`;
    }
    const emitOptionCodes = [...generateEmitsOption(options, scriptSetupRanges)];
    yield* emitOptionCodes;
    yield* generatePropsOption(options, ctx, scriptSetup, scriptSetupRanges, !!emitOptionCodes.length);
    if (options.vueCompilerOptions.target >= 3.5
        && options.vueCompilerOptions.inferComponentDollarRefs
        && options.templateAndStyleTypes.has(names.TemplateRefs)) {
        yield `__typeRefs: {} as ${names.TemplateRefs},${utils_1.newLine}`;
    }
    if (options.vueCompilerOptions.target >= 3.5
        && options.vueCompilerOptions.inferComponentDollarEl
        && options.templateAndStyleTypes.has(names.RootEl)) {
        yield `__typeEl: {} as ${names.RootEl},${utils_1.newLine}`;
    }
    yield `})`;
}
function* generateEmitsOption(options, scriptSetupRanges) {
    const optionCodes = [];
    const typeOptionCodes = [];
    if (scriptSetupRanges.defineModel.length) {
        optionCodes.push([`{} as __VLS_NormalizeEmits<typeof ${names.modelEmit}>`]);
        typeOptionCodes.push([names.ModelEmit]);
    }
    if (scriptSetupRanges.defineEmits) {
        const { name, typeArg, hasUnionTypeArg } = scriptSetupRanges.defineEmits;
        optionCodes.push([`{} as __VLS_NormalizeEmits<typeof ${name ?? names.emit}>`]);
        if (typeArg && !hasUnionTypeArg) {
            typeOptionCodes.push([names.Emit]);
        }
        else {
            typeOptionCodes.length = 0;
        }
    }
    if (options.vueCompilerOptions.target >= 3.5 && typeOptionCodes.length) {
        yield `__typeEmits: {} as `;
        yield* (0, merge_1.generateIntersectMerge)(typeOptionCodes);
        yield `,${utils_1.newLine}`;
    }
    else if (optionCodes.length) {
        yield `emits: `;
        yield* (0, merge_1.generateSpreadMerge)(optionCodes);
        yield `,${utils_1.newLine}`;
    }
}
function* generatePropsOption(options, ctx, scriptSetup, scriptSetupRanges, hasEmitsOption) {
    const optionGenerates = [];
    const typeOptionGenerates = [];
    if (options.templateAndStyleTypes.has(names.InheritedAttrs)) {
        const attrsType = hasEmitsOption
            ? `Omit<${names.InheritedAttrs}, keyof ${names.EmitProps}>`
            : names.InheritedAttrs;
        optionGenerates.push(function* () {
            const propsType = `__VLS_PickNotAny<${ctx.localTypes.OmitIndexSignature}<${attrsType}>, {}>`;
            const optionType = `${ctx.localTypes.TypePropsToOption}<${propsType}>`;
            yield `{} as ${optionType}`;
        });
        typeOptionGenerates.push(function* () {
            yield `{} as ${attrsType}`;
        });
    }
    if (ctx.generatedTypes.has(names.PublicProps)) {
        if (options.vueCompilerOptions.target < 3.6) {
            optionGenerates.push(function* () {
                let propsType = `${ctx.localTypes.TypePropsToOption}<${names.PublicProps}>`;
                if (scriptSetupRanges.withDefaults?.arg) {
                    propsType = `${ctx.localTypes.WithDefaults}<${propsType}, typeof ${names.defaults}>`;
                }
                yield `{} as ${propsType}`;
            });
        }
        typeOptionGenerates.push(function* () {
            yield `{} as ${names.PublicProps}`;
        });
    }
    if (scriptSetupRanges.defineProps?.arg) {
        const { arg } = scriptSetupRanges.defineProps;
        optionGenerates.push(() => (0, utils_1.generateSfcBlockSection)(scriptSetup, arg.start, arg.end, codeFeatures_1.codeFeatures.navigation));
        typeOptionGenerates.length = 0;
    }
    const useTypeOption = options.vueCompilerOptions.target >= 3.5 && typeOptionGenerates.length;
    const useOption = (!useTypeOption || scriptSetupRanges.withDefaults) && optionGenerates.length;
    if (useTypeOption) {
        if (options.vueCompilerOptions.target >= 3.6
            && scriptSetupRanges.withDefaults?.arg) {
            yield `__defaults: ${names.defaults},${utils_1.newLine}`;
        }
        yield `__typeProps: `;
        yield* (0, merge_1.generateSpreadMerge)(typeOptionGenerates.map(g => g()));
        yield `,${utils_1.newLine}`;
    }
    if (useOption) {
        yield `props: `;
        yield* (0, merge_1.generateSpreadMerge)(optionGenerates.map(g => g()));
        yield `,${utils_1.newLine}`;
    }
}
//# sourceMappingURL=component.js.map