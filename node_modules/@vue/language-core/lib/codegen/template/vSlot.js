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
exports.generateVSlot = generateVSlot;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const muggle_string_1 = require("muggle-string");
const collectBindings_1 = require("../../utils/collectBindings");
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const interpolation_1 = require("./interpolation");
const objectProperty_1 = require("./objectProperty");
const templateChild_1 = require("./templateChild");
function* generateVSlot(options, ctx, node, slotDir, ctxVar) {
    const slotVar = ctx.getInternalVariable();
    if (slotDir) {
        yield `{${utils_1.newLine}`;
        yield `const { `;
        if (slotDir.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION && slotDir.arg.content) {
            yield* (0, objectProperty_1.generateObjectProperty)(options, ctx, slotDir.arg.loc.source, slotDir.arg.loc.start.offset, slotDir.arg.isStatic ? codeFeatures_1.codeFeatures.withoutHighlight : codeFeatures_1.codeFeatures.all, false, true);
        }
        else {
            const token = yield* (0, boundary_1.startBoundary)('template', slotDir.loc.start.offset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
            yield `default`;
            yield (0, boundary_1.endBoundary)(token, slotDir.loc.start.offset + (slotDir.rawName?.length ?? 0));
        }
    }
    else {
        yield `const { `;
        // #932: reference for implicit default slot
        const token = yield* (0, boundary_1.startBoundary)('template', node.loc.start.offset, codeFeatures_1.codeFeatures.navigation);
        yield `default`;
        yield (0, boundary_1.endBoundary)(token, node.loc.end.offset);
    }
    yield `: ${slotVar} } = ${ctxVar}.slots!${utils_1.endOfLine}`;
    const endScope = ctx.startScope();
    if (slotDir?.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
        const slotAst = (0, utils_1.getTypeScriptAST)(options.typescript, options.template, `(${slotDir.exp.content}) => {}`);
        yield* generateSlotParameters(options, ctx, slotAst, slotDir.exp, slotVar);
        ctx.declare(...(0, collectBindings_1.collectBindingNames)(options.typescript, slotAst, slotAst));
    }
    for (const child of node.children) {
        yield* (0, templateChild_1.generateTemplateChild)(options, ctx, child);
    }
    yield* endScope();
    if (slotDir) {
        let isStatic = true;
        if (slotDir.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
            isStatic = slotDir.arg.isStatic;
        }
        if (isStatic && !slotDir.arg) {
            yield `${ctxVar}.slots!['`;
            yield [
                '',
                'template',
                slotDir.loc.start.offset + (slotDir.loc.source.startsWith('#')
                    ? '#'.length
                    : slotDir.loc.source.startsWith('v-slot:')
                        ? 'v-slot:'.length
                        : 0),
                codeFeatures_1.codeFeatures.completion,
            ];
            yield `'/* empty slot name completion */]${utils_1.endOfLine}`;
        }
        yield `}${utils_1.newLine}`;
    }
}
function* generateSlotParameters(options, ctx, ast, exp, slotVar) {
    const { typescript: ts } = options;
    const statement = ast.statements[0];
    if (!statement || !ts.isExpressionStatement(statement) || !ts.isArrowFunction(statement.expression)) {
        return;
    }
    const { expression } = statement;
    const startOffset = exp.loc.start.offset - 1;
    const types = [];
    const interpolation = [...(0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, ast.text, startOffset)];
    (0, muggle_string_1.replaceSourceRange)(interpolation, 'template', startOffset, startOffset + `(`.length);
    (0, muggle_string_1.replaceSourceRange)(interpolation, 'template', startOffset + ast.text.length - `) => {}`.length, startOffset + ast.text.length);
    for (const { name, type } of expression.parameters) {
        if (type) {
            types.push([
                ast.text.slice(name.end, type.end),
                'template',
                startOffset + name.end,
                codeFeatures_1.codeFeatures.all,
            ]);
            (0, muggle_string_1.replaceSourceRange)(interpolation, 'template', startOffset + name.end, startOffset + type.end);
        }
        else {
            types.push(null);
        }
    }
    yield `const [`;
    yield* interpolation;
    yield `] = __VLS_vSlot(${slotVar}!`;
    if (types.some(t => t)) {
        yield `, `;
        const token = yield* (0, boundary_1.startBoundary)('template', exp.loc.start.offset, codeFeatures_1.codeFeatures.verification);
        yield `(`;
        yield* types.flatMap(type => type ? [`_`, type, `, `] : `_, `);
        yield `) => [] as any`;
        yield (0, boundary_1.endBoundary)(token, exp.loc.end.offset);
    }
    yield `)${utils_1.endOfLine}`;
}
//# sourceMappingURL=vSlot.js.map