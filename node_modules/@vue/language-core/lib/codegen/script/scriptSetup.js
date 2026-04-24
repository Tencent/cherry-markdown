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
exports.generateScriptSetupImports = generateScriptSetupImports;
exports.generateGeneric = generateGeneric;
exports.generateSetupFunction = generateSetupFunction;
const shared_1 = require("@vue/shared");
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const camelized_1 = require("../utils/camelized");
const transform_1 = require("../utils/transform");
const component_1 = require("./component");
function* generateScriptSetupImports(scriptSetup, scriptSetupRanges) {
    yield [
        scriptSetup.content.slice(0, Math.max(scriptSetupRanges.importSectionEndOffset, scriptSetupRanges.leadingCommentEndOffset)),
        'scriptSetup',
        0,
        codeFeatures_1.codeFeatures.all,
    ];
}
function* generateGeneric(options, ctx, scriptSetup, scriptSetupRanges, generic, body) {
    yield `(`;
    if (typeof generic === 'object') {
        yield `<`;
        yield [generic.text, 'main', generic.offset, codeFeatures_1.codeFeatures.all];
        if (!generic.text.endsWith(`,`)) {
            yield `,`;
        }
        yield `>`;
    }
    yield `(${utils_1.newLine}`
        + `	${names.props}: NonNullable<Awaited<typeof ${names.setup}>>['props'],${utils_1.newLine}`
        + `	${names.ctx}?: ${ctx.localTypes.PrettifyLocal}<Pick<NonNullable<Awaited<typeof ${names.setup}>>, 'attrs' | 'emit' | 'slots'>>,${utils_1.newLine}` // use __VLS_Prettify for less dts code
        + `	${names.exposed}?: NonNullable<Awaited<typeof ${names.setup}>>['expose'],${utils_1.newLine}`
        + `	${names.setup} = (async () => {${utils_1.newLine}`;
    yield* body;
    const propTypes = [];
    const emitTypes = [];
    const { vueCompilerOptions } = options;
    if (ctx.generatedTypes.has(names.PublicProps)) {
        propTypes.push(names.PublicProps);
    }
    if (scriptSetupRanges.defineProps?.arg) {
        yield `const __VLS_propsOption = `;
        yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, scriptSetupRanges.defineProps.arg.start, scriptSetupRanges.defineProps.arg.end, codeFeatures_1.codeFeatures.navigation);
        yield utils_1.endOfLine;
        propTypes.push(`import('${vueCompilerOptions.lib}').${vueCompilerOptions.target >= 3.3 ? `ExtractPublicPropTypes` : `ExtractPropTypes`}<typeof __VLS_propsOption>`);
    }
    if (scriptSetupRanges.defineEmits || scriptSetupRanges.defineModel.length) {
        propTypes.push(names.EmitProps);
    }
    if (options.templateAndStyleTypes.has(names.InheritedAttrs)) {
        propTypes.push(names.InheritedAttrs);
    }
    if (scriptSetupRanges.defineEmits) {
        emitTypes.push(`typeof ${scriptSetupRanges.defineEmits.name ?? names.emit}`);
    }
    if (scriptSetupRanges.defineModel.length) {
        emitTypes.push(`typeof ${names.modelEmit}`);
    }
    yield `return {} as {${utils_1.newLine}`;
    yield `	props: `;
    yield vueCompilerOptions.target >= 3.4
        ? `import('${vueCompilerOptions.lib}').PublicProps`
        : vueCompilerOptions.target >= 3
            ? `import('${vueCompilerOptions.lib}').VNodeProps`
                + ` & import('${vueCompilerOptions.lib}').AllowedComponentProps`
                + ` & import('${vueCompilerOptions.lib}').ComponentCustomProps`
            : `globalThis.JSX.IntrinsicAttributes`;
    if (propTypes.length) {
        yield ` & ${ctx.localTypes.PrettifyLocal}<${propTypes.join(` & `)}>`;
    }
    yield ` & (typeof globalThis extends { __VLS_PROPS_FALLBACK: infer P } ? P : {})${utils_1.endOfLine}`;
    yield `	expose: (exposed: `;
    yield scriptSetupRanges.defineExpose
        ? `import('${vueCompilerOptions.lib}').ShallowUnwrapRef<typeof ${names.exposed}>`
        : `{}`;
    if (options.vueCompilerOptions.inferComponentDollarRefs
        && options.templateAndStyleTypes.has(names.TemplateRefs)) {
        yield ` & { $refs: ${names.TemplateRefs}; }`;
    }
    if (options.vueCompilerOptions.inferComponentDollarEl
        && options.templateAndStyleTypes.has(names.RootEl)) {
        yield ` & { $el: ${names.RootEl}; }`;
    }
    yield `) => void${utils_1.endOfLine}`;
    yield `	attrs: any${utils_1.endOfLine}`;
    yield `	slots: ${hasSlotsType(options) ? names.Slots : `{}`}${utils_1.endOfLine}`;
    yield `	emit: ${emitTypes.length ? emitTypes.join(` & `) : `{}`}${utils_1.endOfLine}`;
    yield `}${utils_1.endOfLine}`;
    yield `})(),${utils_1.newLine}`; // __VLS_setup = (async () => {
    yield `) => ({} as import('${vueCompilerOptions.lib}').VNode & { __ctx?: Awaited<typeof ${names.setup}> }))${utils_1.endOfLine}`;
}
function* generateSetupFunction(options, ctx, scriptSetup, scriptSetupRanges, body, output) {
    const transforms = [];
    if (scriptSetupRanges.defineProps) {
        const { name, statement, callExp, typeArg } = scriptSetupRanges.defineProps;
        const _callExp = scriptSetupRanges.withDefaults?.callExp ?? callExp;
        transforms.push(...generateDefineWithTypeTransforms(scriptSetup, statement, _callExp, typeArg, name, names.props, names.Props));
    }
    if (scriptSetupRanges.defineEmits) {
        const { name, statement, callExp, typeArg } = scriptSetupRanges.defineEmits;
        transforms.push(...generateDefineWithTypeTransforms(scriptSetup, statement, callExp, typeArg, name, names.emit, names.Emit));
    }
    if (scriptSetupRanges.defineSlots) {
        const { name, statement, callExp, typeArg } = scriptSetupRanges.defineSlots;
        transforms.push(...generateDefineWithTypeTransforms(scriptSetup, statement, callExp, typeArg, name, names.slots, names.Slots));
    }
    if (scriptSetupRanges.defineExpose) {
        const { callExp, arg, typeArg } = scriptSetupRanges.defineExpose;
        if (typeArg) {
            transforms.push((0, transform_1.insert)(callExp.start, function* () {
                yield `let ${names.exposed}!: `;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, typeArg.start, typeArg.end, codeFeatures_1.codeFeatures.all);
                yield utils_1.endOfLine;
            }), (0, transform_1.replace)(typeArg.start, typeArg.end, function* () {
                yield `typeof ${names.exposed}`;
            }));
        }
        else if (arg) {
            transforms.push((0, transform_1.insert)(callExp.start, function* () {
                yield `const ${names.exposed} = `;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, arg.start, arg.end, codeFeatures_1.codeFeatures.all);
                yield utils_1.endOfLine;
            }), (0, transform_1.replace)(arg.start, arg.end, function* () {
                yield `${names.exposed}`;
            }));
        }
        else {
            transforms.push((0, transform_1.insert)(callExp.start, function* () {
                yield `const ${names.exposed} = {}${utils_1.endOfLine}`;
            }));
        }
    }
    if (options.vueCompilerOptions.inferTemplateDollarAttrs) {
        for (const { callExp } of scriptSetupRanges.useAttrs) {
            transforms.push((0, transform_1.insert)(callExp.start, function* () {
                yield `(`;
            }), (0, transform_1.insert)(callExp.end, function* () {
                yield ` as typeof ${names.dollars}.$attrs)`;
            }));
        }
    }
    for (const { callExp, exp, arg } of scriptSetupRanges.useCssModule) {
        transforms.push((0, transform_1.insert)(callExp.start, function* () {
            yield `(`;
        }));
        const type = options.templateAndStyleTypes.has(names.StyleModules)
            ? names.StyleModules
            : `{}`;
        if (arg) {
            transforms.push((0, transform_1.insert)(callExp.end, function* () {
                yield ` as Omit<${type}, '$style'>[`;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, arg.start, arg.end, codeFeatures_1.codeFeatures.withoutSemantic);
                yield `])`;
            }), (0, transform_1.replace)(arg.start, arg.end, function* () {
                yield `{} as any`;
            }));
        }
        else {
            transforms.push((0, transform_1.insert)(callExp.end, function* () {
                yield ` as ${type}[`;
                const token = yield* (0, boundary_1.startBoundary)(scriptSetup.name, exp.start, codeFeatures_1.codeFeatures.verification);
                yield `'$style'`;
                yield (0, boundary_1.endBoundary)(token, exp.end);
                yield `])`;
            }));
        }
    }
    if (options.vueCompilerOptions.inferTemplateDollarSlots) {
        for (const { callExp } of scriptSetupRanges.useSlots) {
            transforms.push((0, transform_1.insert)(callExp.start, function* () {
                yield `(`;
            }), (0, transform_1.insert)(callExp.end, function* () {
                yield ` as typeof ${names.dollars}.$slots)`;
            }));
        }
    }
    for (const { callExp, arg } of scriptSetupRanges.useTemplateRef) {
        transforms.push((0, transform_1.insert)(callExp.start, function* () {
            yield `(`;
        }), (0, transform_1.insert)(callExp.end, function* () {
            yield ` as Readonly<import('${options.vueCompilerOptions.lib}').ShallowRef<`;
            if (arg) {
                yield names.TemplateRefs;
                yield `[`;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, arg.start, arg.end, codeFeatures_1.codeFeatures.withoutSemantic);
                yield `]`;
            }
            else {
                yield `unknown`;
            }
            yield ` | null>>)`;
        }));
        if (arg) {
            transforms.push((0, transform_1.replace)(arg.start, arg.end, function* () {
                yield `{} as any`;
            }));
        }
    }
    yield* (0, transform_1.generateCodeWithTransforms)(Math.max(scriptSetupRanges.importSectionEndOffset, scriptSetupRanges.leadingCommentEndOffset), scriptSetup.content.length, transforms, (start, end) => (0, utils_1.generateSfcBlockSection)(scriptSetup, start, end, codeFeatures_1.codeFeatures.all));
    yield* generateMacros(options);
    yield* generateModels(scriptSetup, scriptSetupRanges);
    yield* generatePublicProps(options, ctx, scriptSetup, scriptSetupRanges);
    yield* body;
    if (output) {
        if (hasSlotsType(options)) {
            yield `const __VLS_base = `;
            yield* (0, component_1.generateComponent)(options, ctx, scriptSetup, scriptSetupRanges);
            yield utils_1.endOfLine;
            yield* output;
            yield `{} as ${ctx.localTypes.WithSlots}<typeof __VLS_base, ${names.Slots}>${utils_1.endOfLine}`;
        }
        else {
            yield* output;
            yield* (0, component_1.generateComponent)(options, ctx, scriptSetup, scriptSetupRanges);
            yield utils_1.endOfLine;
        }
    }
}
function* generateMacros(options) {
    if (options.vueCompilerOptions.target >= 3.3) {
        yield `// @ts-ignore${utils_1.newLine}`;
        yield `declare const { `;
        for (const macro of Object.keys(options.vueCompilerOptions.macros)) {
            if (!options.exposed.has(macro)) {
                yield `${macro}, `;
            }
        }
        yield `}: typeof import('${options.vueCompilerOptions.lib}')${utils_1.endOfLine}`;
    }
}
function* generateDefineWithTypeTransforms(scriptSetup, statement, callExp, typeArg, name, defaultName, typeName) {
    if (typeArg) {
        yield (0, transform_1.insert)(statement.start, function* () {
            yield `type ${typeName} = `;
            yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, typeArg.start, typeArg.end, codeFeatures_1.codeFeatures.all);
            yield utils_1.endOfLine;
        });
        yield (0, transform_1.replace)(typeArg.start, typeArg.end, function* () {
            yield typeName;
        });
    }
    if (!name) {
        if (statement.start === callExp.start && statement.end === callExp.end) {
            yield (0, transform_1.insert)(callExp.start, function* () {
                yield `const ${defaultName} = `;
            });
        }
        else if (typeArg) {
            yield (0, transform_1.replace)(statement.start, typeArg.start, function* () {
                yield `const ${defaultName} = `;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, callExp.start, typeArg.start, codeFeatures_1.codeFeatures.all);
            });
            yield (0, transform_1.replace)(typeArg.end, callExp.end, function* () {
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, typeArg.end, callExp.end, codeFeatures_1.codeFeatures.all);
                yield utils_1.endOfLine;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, statement.start, callExp.start, codeFeatures_1.codeFeatures.all);
                yield defaultName;
            });
        }
        else {
            yield (0, transform_1.replace)(statement.start, callExp.end, function* () {
                yield `const ${defaultName} = `;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, callExp.start, callExp.end, codeFeatures_1.codeFeatures.all);
                yield utils_1.endOfLine;
                yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, statement.start, callExp.start, codeFeatures_1.codeFeatures.all);
                yield defaultName;
            });
        }
    }
    else if (!utils_1.identifierRegex.test(name)) {
        yield (0, transform_1.replace)(statement.start, callExp.start, function* () {
            yield `const ${defaultName} = `;
        });
        yield (0, transform_1.insert)(statement.end, function* () {
            yield utils_1.endOfLine;
            yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, statement.start, callExp.start, codeFeatures_1.codeFeatures.all);
            yield defaultName;
        });
    }
}
function* generatePublicProps(options, ctx, scriptSetup, scriptSetupRanges) {
    if (scriptSetupRanges.defineProps?.typeArg && scriptSetupRanges.withDefaults?.arg) {
        yield `const ${names.defaults} = `;
        yield* (0, utils_1.generateSfcBlockSection)(scriptSetup, scriptSetupRanges.withDefaults.arg.start, scriptSetupRanges.withDefaults.arg.end, codeFeatures_1.codeFeatures.navigation);
        yield utils_1.endOfLine;
    }
    const propTypes = [];
    if (options.vueCompilerOptions.jsxSlots && hasSlotsType(options)) {
        propTypes.push(`${ctx.localTypes.PropsChildren}<${names.Slots}>`);
    }
    if (scriptSetupRanges.defineProps?.typeArg) {
        propTypes.push(names.Props);
    }
    if (scriptSetupRanges.defineModel.length) {
        propTypes.push(names.ModelProps);
    }
    if (propTypes.length) {
        yield `type ${names.PublicProps} = ${propTypes.join(` & `)}${utils_1.endOfLine}`;
        ctx.generatedTypes.add(names.PublicProps);
    }
}
function hasSlotsType(options) {
    return !!(options.scriptSetupRanges?.defineSlots
        || options.templateAndStyleTypes.has(names.Slots));
}
function* generateModels(scriptSetup, scriptSetupRanges) {
    if (!scriptSetupRanges.defineModel.length) {
        return;
    }
    const defaultCodes = [];
    const propCodes = [];
    const emitCodes = [];
    for (const defineModel of scriptSetupRanges.defineModel) {
        const propName = defineModel.name
            ? (0, shared_1.camelize)(getRangeText(scriptSetup, defineModel.name).slice(1, -1))
            : 'modelValue';
        let modelType;
        if (defineModel.type) {
            // Infer from defineModel<T>
            modelType = getRangeText(scriptSetup, defineModel.type);
        }
        else if (defineModel.runtimeType && defineModel.localName) {
            // Infer from actual prop declaration code
            modelType = `typeof ${getRangeText(scriptSetup, defineModel.localName)}['value']`;
        }
        else if (defineModel.defaultValue && propName) {
            // Infer from defineModel({ default: T })
            modelType = `typeof ${names.defaultModels}['${propName}']`;
        }
        else {
            modelType = `any`;
        }
        if (defineModel.defaultValue) {
            defaultCodes.push(`'${propName}': ${getRangeText(scriptSetup, defineModel.defaultValue)},${utils_1.newLine}`);
        }
        propCodes.push(generateModelProp(scriptSetup, defineModel, propName, modelType));
        emitCodes.push(generateModelEmit(defineModel, propName, modelType));
    }
    if (defaultCodes.length) {
        yield `const ${names.defaultModels} = {${utils_1.newLine}`;
        yield* defaultCodes;
        yield `}${utils_1.endOfLine}`;
    }
    yield `type ${names.ModelProps} = {${utils_1.newLine}`;
    for (const codes of propCodes) {
        yield* codes;
    }
    yield `}${utils_1.endOfLine}`;
    yield `type ${names.ModelEmit} = {${utils_1.newLine}`;
    for (const codes of emitCodes) {
        yield* codes;
    }
    yield `}${utils_1.endOfLine}`;
    yield `const ${names.modelEmit} = defineEmits<${names.ModelEmit}>()${utils_1.endOfLine}`;
}
function* generateModelProp(scriptSetup, defineModel, propName, modelType) {
    if (defineModel.comments) {
        yield scriptSetup.content.slice(defineModel.comments.start, defineModel.comments.end);
        yield utils_1.newLine;
    }
    if (defineModel.name) {
        yield* (0, camelized_1.generateCamelized)(getRangeText(scriptSetup, defineModel.name), scriptSetup.name, defineModel.name.start, codeFeatures_1.codeFeatures.navigation);
    }
    else {
        yield propName;
    }
    yield defineModel.required ? `: ` : `?: `;
    yield modelType;
    yield utils_1.endOfLine;
    if (defineModel.modifierType) {
        const modifierName = `${propName === 'modelValue' ? 'model' : propName}Modifiers`;
        const modifierType = getRangeText(scriptSetup, defineModel.modifierType);
        yield `'${modifierName}'?: Partial<Record<${modifierType}, true>>${utils_1.endOfLine}`;
    }
}
function* generateModelEmit(defineModel, propName, modelType) {
    yield `'update:${propName}': [value: `;
    yield modelType;
    if (!defineModel.required && !defineModel.defaultValue) {
        yield ` | undefined`;
    }
    yield `]${utils_1.endOfLine}`;
}
function getRangeText(scriptSetup, range) {
    return scriptSetup.content.slice(range.start, range.end);
}
//# sourceMappingURL=scriptSetup.js.map