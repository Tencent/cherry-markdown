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
exports.generateElementDirectives = generateElementDirectives;
exports.generateModifiers = generateModifiers;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("@vue/shared");
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const camelized_1 = require("../utils/camelized");
const stringLiteralKey_1 = require("../utils/stringLiteralKey");
const elementProps_1 = require("./elementProps");
const interpolation_1 = require("./interpolation");
const objectProperty_1 = require("./objectProperty");
const builtInDirectives = new Set([
    'cloak',
    'html',
    'memo',
    'once',
    'show',
    'text',
]);
function* generateElementDirectives(options, ctx, node) {
    for (const prop of node.props) {
        if (prop.type !== CompilerDOM.NodeTypes.DIRECTIVE
            || prop.name === 'slot'
            || prop.name === 'on'
            || prop.name === 'model'
            || prop.name === 'bind') {
            continue;
        }
        const token = yield* (0, boundary_1.startBoundary)('template', prop.loc.start.offset, codeFeatures_1.codeFeatures.verification);
        yield `__VLS_asFunctionalDirective(`;
        yield* generateIdentifier(options, ctx, prop);
        yield `, {} as import('${options.vueCompilerOptions.lib}').ObjectDirective)(null!, { ...__VLS_directiveBindingRestFields, `;
        yield* generateArg(options, ctx, prop);
        yield* generateModifiers(options, ctx, prop);
        yield* generateValue(options, ctx, prop);
        yield ` }, null!, null!)`;
        yield (0, boundary_1.endBoundary)(token, prop.loc.end.offset);
        yield utils_1.endOfLine;
    }
}
function* generateIdentifier(options, ctx, prop) {
    const rawName = 'v-' + prop.name;
    const startOffset = prop.loc.start.offset;
    const token = yield* (0, boundary_1.startBoundary)('template', startOffset, codeFeatures_1.codeFeatures.verification);
    yield names.directives;
    yield `.`;
    yield* (0, camelized_1.generateCamelized)(rawName, 'template', prop.loc.start.offset, {
        ...codeFeatures_1.codeFeatures.withoutHighlightAndCompletion,
        verification: options.vueCompilerOptions.checkUnknownDirectives && !builtInDirectives.has(prop.name),
    });
    if (!builtInDirectives.has(prop.name)) {
        ctx.recordComponentAccess('template', (0, shared_1.camelize)(rawName), prop.loc.start.offset);
    }
    yield (0, boundary_1.endBoundary)(token, startOffset + rawName.length);
}
function* generateArg(options, ctx, prop) {
    const { arg } = prop;
    if (arg?.type !== CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
        return;
    }
    const startOffset = arg.loc.start.offset + arg.loc.source.indexOf(arg.content);
    const token = yield* (0, boundary_1.startBoundary)('template', startOffset, codeFeatures_1.codeFeatures.verification);
    yield `arg`;
    yield (0, boundary_1.endBoundary)(token, startOffset + arg.content.length);
    yield `: `;
    if (arg.isStatic) {
        yield* (0, stringLiteralKey_1.generateStringLiteralKey)(arg.content, startOffset, codeFeatures_1.codeFeatures.all);
    }
    else {
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, arg.content, startOffset, `(`, `)`);
    }
    yield `, `;
}
function* generateModifiers(options, ctx, prop, propertyName = 'modifiers') {
    const { modifiers } = prop;
    if (!modifiers.length) {
        return;
    }
    const startOffset = modifiers[0].loc.start.offset - 1;
    const endOffset = modifiers.at(-1).loc.end.offset;
    const token = yield* (0, boundary_1.startBoundary)('template', startOffset, codeFeatures_1.codeFeatures.verification);
    yield propertyName;
    yield (0, boundary_1.endBoundary)(token, endOffset);
    yield `: { `;
    for (const mod of modifiers) {
        yield* (0, objectProperty_1.generateObjectProperty)(options, ctx, mod.content, mod.loc.start.offset, codeFeatures_1.codeFeatures.withoutHighlight);
        yield `: true, `;
    }
    yield `}, `;
}
function* generateValue(options, ctx, prop) {
    const { exp } = prop;
    if (exp?.type !== CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
        return;
    }
    const token = yield* (0, boundary_1.startBoundary)('template', exp.loc.start.offset, codeFeatures_1.codeFeatures.verification);
    yield `value`;
    yield (0, boundary_1.endBoundary)(token, exp.loc.end.offset);
    yield `: `;
    yield* (0, elementProps_1.generatePropExp)(options, ctx, prop, exp);
}
//# sourceMappingURL=elementDirectives.js.map