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
exports.generateElementEvents = generateElementEvents;
exports.generateEventArg = generateEventArg;
exports.generateEventExpression = generateEventExpression;
exports.generateModelEventExpression = generateModelEventExpression;
exports.isCompoundExpression = isCompoundExpression;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("@vue/shared");
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const camelized_1 = require("../utils/camelized");
const interpolation_1 = require("./interpolation");
function* generateElementEvents(options, ctx, node, componentOriginalVar, getCtxVar, getPropsVar) {
    let emitsVar;
    for (const prop of node.props) {
        if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && (prop.name === 'on'
                && (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION && prop.arg.isStatic)
                || options.vueCompilerOptions.strictVModel
                    && prop.name === 'model'
                    && (!prop.arg || prop.arg.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION && prop.arg.isStatic))) {
            if (!emitsVar) {
                emitsVar = ctx.getInternalVariable();
                yield `let ${emitsVar}!: __VLS_ResolveEmits<typeof ${componentOriginalVar}, typeof ${getCtxVar()}.emit>${utils_1.endOfLine}`;
            }
            let source = prop.arg?.loc.source ?? 'model-value';
            let start = prop.arg?.loc.start.offset;
            let propPrefix = 'on-';
            let emitPrefix = '';
            if (prop.name === 'model') {
                propPrefix = 'onUpdate:';
                emitPrefix = 'update:';
            }
            else if (source.startsWith('vue:')) {
                source = source.slice('vue:'.length);
                start = start + 'vue:'.length;
                propPrefix = 'onVnode-';
                emitPrefix = 'vnode-';
            }
            const propName = (0, shared_1.camelize)(propPrefix + source);
            const emitName = emitPrefix + source;
            const camelizedEmitName = (0, shared_1.camelize)(emitName);
            yield `const ${ctx.getInternalVariable()}: __VLS_NormalizeComponentEvent<typeof ${getPropsVar()}, typeof ${emitsVar}, '${propName}', '${emitName}', '${camelizedEmitName}'> = (${utils_1.newLine}`;
            if (prop.name === 'on') {
                yield `{ `;
                yield* generateEventArg(options, source, start, emitPrefix.slice(0, -1), codeFeatures_1.codeFeatures.navigation);
                yield `: {} as any } as typeof ${emitsVar},${utils_1.newLine}`;
            }
            yield `{ `;
            if (prop.name === 'on') {
                yield* generateEventArg(options, source, start, propPrefix.slice(0, -1));
                yield `: `;
                yield* generateEventExpression(options, ctx, prop);
            }
            else {
                yield `'${propName}': `;
                yield* generateModelEventExpression(options, ctx, prop);
            }
            yield `})${utils_1.endOfLine}`;
        }
    }
}
function* generateEventArg(options, name, start, directive = 'on', features) {
    features ??= {
        ...codeFeatures_1.codeFeatures.semanticWithoutHighlight,
        ...codeFeatures_1.codeFeatures.navigationWithoutRename,
        ...options.vueCompilerOptions.checkUnknownEvents
            ? codeFeatures_1.codeFeatures.verification
            : codeFeatures_1.codeFeatures.doNotReportTs2353AndTs2561,
    };
    if (directive.length) {
        name = (0, shared_1.capitalize)(name);
    }
    if (utils_1.identifierRegex.test((0, shared_1.camelize)(name))) {
        const token = yield* (0, boundary_1.startBoundary)('template', start, features);
        yield directive;
        yield* (0, camelized_1.generateCamelized)(name, 'template', start, { __combineToken: token });
    }
    else {
        const token = yield* (0, boundary_1.startBoundary)('template', start, features);
        yield `'`;
        yield directive;
        yield* (0, camelized_1.generateCamelized)(name, 'template', start, { __combineToken: token });
        yield `'`;
        yield (0, boundary_1.endBoundary)(token, start + name.length);
    }
}
function* generateEventExpression(options, ctx, prop) {
    if (prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
        const ast = (0, utils_1.getTypeScriptAST)(options.typescript, options.template, prop.exp.content);
        const isCompound = isCompoundExpression(options.typescript, ast);
        const interpolation = (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, prop.exp.content, prop.exp.loc.start.offset, isCompound ? `` : `(`, isCompound ? `` : `)`);
        if (isCompound) {
            yield `(...[$event]) => {${utils_1.newLine}`;
            const endScope = ctx.startScope();
            ctx.declare('$event');
            yield* ctx.generateConditionGuards();
            yield* interpolation;
            yield utils_1.endOfLine;
            yield* endScope();
            yield `}`;
            ctx.inlayHints.push({
                blockName: 'template',
                offset: prop.exp.loc.start.offset,
                setting: 'vue.inlayHints.inlineHandlerLeading',
                label: '$event =>',
                paddingRight: true,
                tooltip: [
                    '`$event` is a hidden parameter, you can use it in this callback.',
                    'To hide this hint, set `vue.inlayHints.inlineHandlerLeading` to `false` in IDE settings.',
                    '[More info](https://github.com/vuejs/language-tools/issues/2445#issuecomment-1444771420)',
                ].join('\n\n'),
            });
        }
        else {
            yield* interpolation;
        }
    }
    else {
        yield `() => {}`;
    }
}
function* generateModelEventExpression(options, ctx, prop) {
    if (prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
        yield `(...[$event]) => {${utils_1.newLine}`;
        yield* ctx.generateConditionGuards();
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.verification, prop.exp.content, prop.exp.loc.start.offset);
        yield ` = $event${utils_1.endOfLine}`;
        yield `}`;
    }
    else {
        yield `() => {}`;
    }
}
function isCompoundExpression(ts, ast) {
    let result = true;
    if (ast.statements.length === 0) {
        result = false;
    }
    else if (ast.statements.length === 1) {
        ts.forEachChild(ast, child_1 => {
            if (ts.isExpressionStatement(child_1)) {
                ts.forEachChild(child_1, child_2 => {
                    if (ts.isArrowFunction(child_2)) {
                        result = false;
                    }
                    else if (isPropertyAccessOrId(ts, child_2)) {
                        result = false;
                    }
                });
            }
            else if (ts.isFunctionDeclaration(child_1)) {
                result = false;
            }
        });
    }
    return result;
}
function isPropertyAccessOrId(ts, node) {
    if (ts.isIdentifier(node)) {
        return true;
    }
    if (ts.isPropertyAccessExpression(node)) {
        return isPropertyAccessOrId(ts, node.expression);
    }
    return false;
}
//# sourceMappingURL=elementEvents.js.map