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
exports.generateTemplate = generate;
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const context_1 = require("./context");
const objectProperty_1 = require("./objectProperty");
const templateChild_1 = require("./templateChild");
function generate(options) {
    const ctx = (0, context_1.createTemplateCodegenContext)();
    const codeGenerator = generateWorker(options, ctx);
    const codes = [];
    for (const code of codeGenerator) {
        if (typeof code === 'object') {
            code[3] = ctx.resolveCodeFeatures(code[3]);
        }
        codes.push(code);
    }
    return { ...ctx, codes };
}
function* generateWorker(options, ctx) {
    const endScope = ctx.startScope();
    ctx.declare(...options.setupConsts);
    const { slotsAssignName, propsAssignName, vueCompilerOptions, template, } = options;
    if (slotsAssignName) {
        ctx.declare(slotsAssignName);
    }
    if (propsAssignName) {
        ctx.declare(propsAssignName);
    }
    if (vueCompilerOptions.inferTemplateDollarSlots) {
        ctx.dollarVars.add('$slots');
    }
    if (vueCompilerOptions.inferTemplateDollarAttrs) {
        ctx.dollarVars.add('$attrs');
    }
    if (vueCompilerOptions.inferTemplateDollarRefs) {
        ctx.dollarVars.add('$refs');
    }
    if (vueCompilerOptions.inferTemplateDollarEl) {
        ctx.dollarVars.add('$el');
    }
    if (template.ast) {
        yield* (0, templateChild_1.generateTemplateChild)(options, ctx, template.ast);
    }
    yield* ctx.generateHoistVariables();
    yield* generateSlotsType(options, ctx);
    yield* generateInheritedAttrsType(ctx);
    yield* generateTemplateRefsType(options, ctx);
    yield* generateRootElType(ctx);
    if (ctx.dollarVars.size) {
        yield `var ${names.dollars}!: {${utils_1.newLine}`;
        if (ctx.dollarVars.has('$slots')) {
            const type = ctx.generatedTypes.has(names.Slots) ? names.Slots : `{}`;
            yield `$slots: ${type}${utils_1.endOfLine}`;
        }
        if (ctx.dollarVars.has('$attrs')) {
            yield `$attrs: import('${vueCompilerOptions.lib}').ComponentPublicInstance['$attrs']`;
            if (ctx.generatedTypes.has(names.InheritedAttrs)) {
                yield ` & ${names.InheritedAttrs}`;
            }
            yield utils_1.endOfLine;
        }
        if (ctx.dollarVars.has('$refs')) {
            const type = ctx.generatedTypes.has(names.TemplateRefs) ? names.TemplateRefs : `{}`;
            yield `$refs: ${type}${utils_1.endOfLine}`;
        }
        if (ctx.dollarVars.has('$el')) {
            const type = ctx.generatedTypes.has(names.RootEl) ? names.RootEl : `any`;
            yield `$el: ${type}${utils_1.endOfLine}`;
        }
        yield `} & { [K in keyof import('${vueCompilerOptions.lib}').ComponentPublicInstance]: unknown }${utils_1.endOfLine}`;
    }
    yield* endScope();
}
function* generateSlotsType(options, ctx) {
    if (options.hasDefineSlots || (!ctx.slots.length && !ctx.dynamicSlots.length)) {
        return;
    }
    ctx.generatedTypes.add(names.Slots);
    yield `type ${names.Slots} = {}`;
    for (const { expVar, propsVar } of ctx.dynamicSlots) {
        yield `${utils_1.newLine}& { [K in NonNullable<typeof ${expVar}>]?: (props: typeof ${propsVar}) => any }`;
    }
    for (const slot of ctx.slots) {
        yield `${utils_1.newLine}& { `;
        if (slot.name && slot.offset !== undefined) {
            yield* (0, objectProperty_1.generateObjectProperty)(options, ctx, slot.name, slot.offset, codeFeatures_1.codeFeatures.navigation);
        }
        else {
            const token = yield* (0, boundary_1.startBoundary)('template', slot.tagRange[0], codeFeatures_1.codeFeatures.navigation);
            yield `default`;
            yield (0, boundary_1.endBoundary)(token, slot.tagRange[1]);
        }
        yield `?: (props: typeof ${slot.propsVar}) => any }`;
    }
    yield utils_1.endOfLine;
}
function* generateInheritedAttrsType(ctx) {
    if (!ctx.inheritedAttrVars.size) {
        return;
    }
    ctx.generatedTypes.add(names.InheritedAttrs);
    yield `type ${names.InheritedAttrs} = Partial<${[...ctx.inheritedAttrVars].map(name => `typeof ${name}`).join(` & `)}>`;
    yield utils_1.endOfLine;
}
function* generateTemplateRefsType(options, ctx) {
    if (!ctx.templateRefs.size) {
        return;
    }
    ctx.generatedTypes.add(names.TemplateRefs);
    yield `type ${names.TemplateRefs} = {}`;
    for (const [name, refs] of ctx.templateRefs) {
        yield `${utils_1.newLine}& `;
        if (refs.length >= 2) {
            yield `(`;
        }
        for (let i = 0; i < refs.length; i++) {
            const { typeExp, offset } = refs[i];
            if (i) {
                yield ` | `;
            }
            yield `{ `;
            yield* (0, objectProperty_1.generateObjectProperty)(options, ctx, name, offset, codeFeatures_1.codeFeatures.navigation);
            yield `: ${typeExp} }`;
        }
        if (refs.length >= 2) {
            yield `)`;
        }
    }
    yield utils_1.endOfLine;
}
function* generateRootElType(ctx) {
    if (!ctx.singleRootElTypes.size || ctx.singleRootNodes.has(null)) {
        return;
    }
    ctx.generatedTypes.add(names.RootEl);
    yield `type ${names.RootEl} = `;
    for (const type of ctx.singleRootElTypes) {
        yield `${utils_1.newLine}| ${type}`;
    }
    yield utils_1.endOfLine;
}
//# sourceMappingURL=index.js.map