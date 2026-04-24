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
exports.generateTemplate = generateTemplate;
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const merge_1 = require("../utils/merge");
function* generateTemplate(options, ctx, selfType) {
    yield* generateSetupExposed(options, ctx);
    yield* generateTemplateCtx(options, ctx, selfType);
    yield* generateTemplateComponents(options, ctx);
    yield* generateTemplateDirectives(options, ctx);
    if (options.templateAndStyleCodes.length) {
        yield* options.templateAndStyleCodes;
    }
}
function* generateTemplateCtx({ vueCompilerOptions, templateAndStyleTypes, scriptSetupRanges, fileName }, ctx, selfType) {
    const exps = [];
    const emitTypes = [];
    const propTypes = [];
    if (vueCompilerOptions.petiteVueExtensions.some(ext => fileName.endsWith(ext))) {
        exps.push([`globalThis`]);
    }
    if (selfType) {
        exps.push([`{} as InstanceType<__VLS_PickNotAny<typeof ${selfType}, new () => {}>>`]);
    }
    else {
        exps.push([`{} as import('${vueCompilerOptions.lib}').ComponentPublicInstance`]);
    }
    if (templateAndStyleTypes.has(names.StyleModules)) {
        exps.push([`{} as ${names.StyleModules}`]);
    }
    if (scriptSetupRanges?.defineEmits) {
        const { defineEmits } = scriptSetupRanges;
        emitTypes.push(`typeof ${defineEmits.name ?? names.emit}`);
    }
    if (scriptSetupRanges?.defineModel.length) {
        emitTypes.push(`typeof ${names.modelEmit}`);
    }
    if (emitTypes.length) {
        yield `type ${names.EmitProps} = __VLS_EmitsToProps<__VLS_NormalizeEmits<${emitTypes.join(` & `)}>>${utils_1.endOfLine}`;
        exps.push([`{} as { $emit: ${emitTypes.join(` & `)} }`]);
    }
    if (scriptSetupRanges?.defineProps) {
        propTypes.push(`typeof ${scriptSetupRanges.defineProps.name ?? names.props}`);
    }
    if (scriptSetupRanges?.defineModel.length) {
        propTypes.push(names.ModelProps);
    }
    if (emitTypes.length) {
        propTypes.push(names.EmitProps);
    }
    if (propTypes.length) {
        exps.push([`{} as { $props: ${propTypes.join(` & `)} }`]);
        exps.push([`{} as ${propTypes.join(` & `)}`]);
    }
    if (ctx.generatedTypes.has(names.SetupExposed)) {
        exps.push([`{} as ${names.SetupExposed}`]);
    }
    yield `const ${names.ctx} = `;
    yield* (0, merge_1.generateSpreadMerge)(exps);
    yield utils_1.endOfLine;
}
function* generateTemplateComponents({ vueCompilerOptions, script, scriptRanges }, ctx) {
    const types = [];
    if (ctx.generatedTypes.has(names.SetupExposed)) {
        types.push(names.SetupExposed);
    }
    if (script && scriptRanges?.exportDefault?.options?.components) {
        const { components } = scriptRanges.exportDefault.options;
        yield `const __VLS_componentsOption = `;
        yield* (0, utils_1.generateSfcBlockSection)(script, components.start, components.end, codeFeatures_1.codeFeatures.navigation);
        yield utils_1.endOfLine;
        types.push(`typeof __VLS_componentsOption`);
    }
    yield `type __VLS_LocalComponents = ${types.length ? types.join(` & `) : `{}`}${utils_1.endOfLine}`;
    yield `type __VLS_GlobalComponents = ${vueCompilerOptions.target >= 3.5
        ? `import('${vueCompilerOptions.lib}').GlobalComponents`
        : `import('${vueCompilerOptions.lib}').GlobalComponents & Pick<typeof import('${vueCompilerOptions.lib}'), 'Transition' | 'TransitionGroup' | 'KeepAlive' | 'Suspense' | 'Teleport'>`}${utils_1.endOfLine}`;
    yield `let ${names.components}!: __VLS_LocalComponents & __VLS_GlobalComponents${utils_1.endOfLine}`;
    yield `let ${names.intrinsics}!: ${vueCompilerOptions.target >= 3.3
        ? `import('${vueCompilerOptions.lib}/jsx-runtime').JSX.IntrinsicElements`
        : `globalThis.JSX.IntrinsicElements`}${utils_1.endOfLine}`;
}
function* generateTemplateDirectives({ vueCompilerOptions, script, scriptRanges }, ctx) {
    const types = [];
    if (ctx.generatedTypes.has(names.SetupExposed)) {
        types.push(names.SetupExposed);
    }
    if (script && scriptRanges?.exportDefault?.options?.directives) {
        const { directives } = scriptRanges.exportDefault.options;
        yield `const __VLS_directivesOption = `;
        yield* (0, utils_1.generateSfcBlockSection)(script, directives.start, directives.end, codeFeatures_1.codeFeatures.navigation);
        yield utils_1.endOfLine;
        types.push(`__VLS_ResolveDirectives<typeof __VLS_directivesOption>`);
    }
    yield `type __VLS_LocalDirectives = ${types.length ? types.join(` & `) : `{}`}${utils_1.endOfLine}`;
    yield `let ${names.directives}!: __VLS_LocalDirectives & import('${vueCompilerOptions.lib}').GlobalDirectives${utils_1.endOfLine}`;
}
function* generateSetupExposed({ vueCompilerOptions, exposed }, ctx) {
    if (!exposed.size) {
        return;
    }
    ctx.generatedTypes.add(names.SetupExposed);
    yield `type ${names.SetupExposed} = import('${vueCompilerOptions.lib}').ShallowUnwrapRef<{${utils_1.newLine}`;
    for (const bindingName of exposed) {
        const token = Symbol(bindingName.length);
        yield ['', undefined, 0, { __linkedToken: token }];
        yield `${bindingName}: typeof `;
        yield ['', undefined, 0, { __linkedToken: token }];
        yield bindingName;
        yield utils_1.endOfLine;
    }
    yield `}>${utils_1.endOfLine}`;
}
//# sourceMappingURL=template.js.map