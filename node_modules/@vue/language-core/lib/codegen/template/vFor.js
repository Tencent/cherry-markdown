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
exports.generateVFor = generateVFor;
exports.parseVForNode = parseVForNode;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const collectBindings_1 = require("../../utils/collectBindings");
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const interpolation_1 = require("./interpolation");
const templateChild_1 = require("./templateChild");
function* generateVFor(options, ctx, node) {
    const { source } = node.parseResult;
    const { leftExpressionRange, leftExpressionText } = parseVForNode(node);
    const endScope = ctx.startScope();
    yield `for (const [`;
    if (leftExpressionRange && leftExpressionText) {
        const collectAst = (0, utils_1.getTypeScriptAST)(options.typescript, options.template, `const [${leftExpressionText}]`);
        ctx.declare(...(0, collectBindings_1.collectBindingNames)(options.typescript, collectAst, collectAst));
        yield [
            leftExpressionText,
            'template',
            leftExpressionRange.start,
            codeFeatures_1.codeFeatures.all,
        ];
    }
    yield `] of `;
    if (source.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
        yield `__VLS_vFor(`;
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, source.content, source.loc.start.offset, `(`, `)`);
        yield `!)`; // #3102
    }
    else {
        yield `{} as any`;
    }
    yield `) {${utils_1.newLine}`;
    let isFragment = true;
    for (const argument of node.codegenNode?.children.arguments ?? []) {
        if (argument.type === CompilerDOM.NodeTypes.JS_FUNCTION_EXPRESSION
            && argument.returns?.type === CompilerDOM.NodeTypes.VNODE_CALL
            && argument.returns.props?.type === CompilerDOM.NodeTypes.JS_OBJECT_EXPRESSION) {
            if (argument.returns.tag !== CompilerDOM.FRAGMENT) {
                isFragment = false;
                continue;
            }
            for (const prop of argument.returns.props.properties) {
                if (prop.value.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                    && !prop.value.isStatic) {
                    yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, prop.value.content, prop.value.loc.start.offset, `(`, `)`);
                    yield utils_1.endOfLine;
                }
            }
        }
    }
    const { inVFor } = ctx;
    ctx.inVFor = true;
    for (const child of node.children) {
        yield* (0, templateChild_1.generateTemplateChild)(options, ctx, child, isFragment);
    }
    ctx.inVFor = inVFor;
    yield* endScope();
    yield `}${utils_1.newLine}`;
}
function parseVForNode(node) {
    const { value, key, index } = node.parseResult;
    const leftExpressionRange = (value || key || index)
        ? {
            start: (value ?? key ?? index).loc.start.offset,
            end: (index ?? key ?? value).loc.end.offset,
        }
        : undefined;
    const leftExpressionText = leftExpressionRange
        ? node.loc.source.slice(leftExpressionRange.start - node.loc.start.offset, leftExpressionRange.end - node.loc.start.offset)
        : undefined;
    return {
        leftExpressionRange,
        leftExpressionText,
    };
}
//# sourceMappingURL=vFor.js.map