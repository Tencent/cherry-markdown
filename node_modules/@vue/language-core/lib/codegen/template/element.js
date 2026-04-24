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
exports.generateElement = generateElement;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("@vue/shared");
const muggle_string_1 = require("muggle-string");
const shared_2 = require("../../utils/shared");
const codeFeatures_1 = require("../codeFeatures");
const inlayHints_1 = require("../inlayHints");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const camelized_1 = require("../utils/camelized");
const stringLiteralKey_1 = require("../utils/stringLiteralKey");
const elementDirectives_1 = require("./elementDirectives");
const elementEvents_1 = require("./elementEvents");
const elementProps_1 = require("./elementProps");
const interpolation_1 = require("./interpolation");
const propertyAccess_1 = require("./propertyAccess");
const styleScopedClasses_1 = require("./styleScopedClasses");
const templateChild_1 = require("./templateChild");
const vSlot_1 = require("./vSlot");
function* generateComponent(options, ctx, node) {
    let { tag, props } = node;
    let [startTagOffset, endTagOffset] = (0, shared_2.getElementTagOffsets)(node, options.template);
    let isExpression = false;
    let isIsShorthand = false;
    if (tag.includes('.')) {
        isExpression = true;
    }
    else if (tag === 'component') {
        for (const prop of node.props) {
            if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
                && prop.name === 'bind'
                && prop.arg?.loc.source === 'is'
                && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
                isIsShorthand = prop.arg.loc.end.offset === prop.exp.loc.end.offset;
                if (isIsShorthand) {
                    ctx.inlayHints.push((0, inlayHints_1.createVBindShorthandInlayHintInfo)(prop.exp.loc, 'is'));
                }
                isExpression = true;
                tag = prop.exp.content;
                startTagOffset = prop.exp.loc.start.offset;
                endTagOffset = undefined;
                props = props.filter(p => p !== prop);
                break;
            }
        }
    }
    const componentVar = ctx.getInternalVariable();
    if (isExpression) {
        yield `const ${componentVar} = `;
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, isIsShorthand
            ? codeFeatures_1.codeFeatures.withoutHighlightAndCompletion
            : codeFeatures_1.codeFeatures.all, tag, startTagOffset, `(`, `)`);
        if (endTagOffset !== undefined) {
            yield ` || `;
            yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.withoutCompletion, tag, endTagOffset, `(`, `)`);
        }
        yield `${utils_1.endOfLine}`;
    }
    else {
        const originalNames = new Set([
            (0, shared_1.capitalize)((0, shared_1.camelize)(tag)),
            (0, shared_1.camelize)(tag),
            tag,
        ]);
        const matchedSetupConst = [...originalNames].find(name => options.setupConsts.has(name));
        if (matchedSetupConst) {
            // navigation & auto import support
            yield `const ${componentVar} = `;
            yield* (0, camelized_1.generateCamelized)(matchedSetupConst[0] + tag.slice(1), 'template', startTagOffset, {
                ...codeFeatures_1.codeFeatures.withoutHighlightAndCompletion,
                ...codeFeatures_1.codeFeatures.importCompletionOnly,
            });
            if (endTagOffset !== undefined) {
                yield ` || `;
                yield* (0, camelized_1.generateCamelized)(matchedSetupConst[0] + tag.slice(1), 'template', endTagOffset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
            }
            yield utils_1.endOfLine;
        }
        else {
            yield `let ${componentVar}!: __VLS_WithComponent<'${tag}', __VLS_LocalComponents, __VLS_GlobalComponents`;
            yield originalNames.has(options.componentName)
                ? `, typeof ${names._export}`
                : `, void`;
            for (const name of originalNames) {
                yield `, '${name}'`;
            }
            yield `>[`;
            yield* (0, stringLiteralKey_1.generateStringLiteralKey)(tag, startTagOffset, {
                ...codeFeatures_1.codeFeatures.semanticWithoutHighlight,
                ...options.vueCompilerOptions.checkUnknownComponents
                    ? codeFeatures_1.codeFeatures.verification
                    : codeFeatures_1.codeFeatures.doNotReportTs2339AndTs2551,
            });
            yield `]${utils_1.endOfLine}`;
            if (utils_1.identifierRegex.test((0, shared_1.camelize)(tag))) {
                // navigation support
                yield `/** @ts-ignore @type {typeof ${names.components}.`;
                yield* (0, camelized_1.generateCamelized)(tag, 'template', startTagOffset, codeFeatures_1.codeFeatures.navigation);
                if (tag[0] !== tag[0].toUpperCase()) {
                    yield ` | typeof ${names.components}.`;
                    yield* (0, camelized_1.generateCamelized)((0, shared_1.capitalize)(tag), 'template', startTagOffset, codeFeatures_1.codeFeatures.navigation);
                }
                if (endTagOffset !== undefined) {
                    yield ` | typeof ${names.components}.`;
                    yield* (0, camelized_1.generateCamelized)(tag, 'template', endTagOffset, codeFeatures_1.codeFeatures.navigation);
                    if (tag[0] !== tag[0].toUpperCase()) {
                        yield ` | typeof ${names.components}.`;
                        yield* (0, camelized_1.generateCamelized)((0, shared_1.capitalize)(tag), 'template', endTagOffset, codeFeatures_1.codeFeatures.navigation);
                    }
                }
                yield `} */${utils_1.newLine}`;
                // auto import support
                yield* (0, camelized_1.generateCamelized)(tag, 'template', startTagOffset, codeFeatures_1.codeFeatures.importCompletionOnly);
                yield utils_1.endOfLine;
            }
        }
    }
    yield* generateComponentBody(options, ctx, node, tag, startTagOffset, props, componentVar);
}
function* generateComponentBody(options, ctx, node, tag, tagOffset, props, componentVar) {
    let isCtxVarUsed = false;
    let isPropsVarUsed = false;
    const getCtxVar = () => (isCtxVarUsed = true, ctxVar);
    const getPropsVar = () => (isPropsVarUsed = true, propsVar);
    ctx.components.push(getCtxVar);
    const failGeneratedExpressions = [];
    const propCodes = [...(0, elementProps_1.generateElementProps)(options, ctx, node, props, options.vueCompilerOptions.checkUnknownProps, failGeneratedExpressions)];
    const functionalVar = ctx.getInternalVariable();
    const vNodeVar = ctx.getInternalVariable();
    const ctxVar = ctx.getInternalVariable();
    const propsVar = ctx.getInternalVariable();
    yield `// @ts-ignore${utils_1.newLine}`;
    yield `const ${functionalVar} = ${options.vueCompilerOptions.checkUnknownProps ? '__VLS_asFunctionalComponent0' : '__VLS_asFunctionalComponent1'}(${componentVar}, new ${componentVar}({${utils_1.newLine}`;
    yield* (0, muggle_string_1.toString)(propCodes);
    yield `}))${utils_1.endOfLine}`;
    yield `const `;
    const token = yield* (0, boundary_1.startBoundary)('template', node.loc.start.offset, codeFeatures_1.codeFeatures.doNotReportTs6133);
    yield vNodeVar;
    yield (0, boundary_1.endBoundary)(token, node.loc.end.offset);
    yield ` = ${functionalVar}`;
    if (ctx.currentInfo.generic) {
        const { content, offset } = ctx.currentInfo.generic;
        const token = yield* (0, boundary_1.startBoundary)('template', offset, codeFeatures_1.codeFeatures.verification);
        yield `<`;
        yield [content, 'template', offset, codeFeatures_1.codeFeatures.all];
        yield `>`;
        yield (0, boundary_1.endBoundary)(token, offset + content.length);
    }
    yield `(`;
    const token2 = yield* (0, boundary_1.startBoundary)('template', tagOffset, codeFeatures_1.codeFeatures.verification);
    yield `{${utils_1.newLine}`;
    yield* propCodes;
    yield `}`;
    yield (0, boundary_1.endBoundary)(token2, tagOffset + tag.length);
    yield `, ...__VLS_functionalComponentArgsRest(${functionalVar}))${utils_1.endOfLine}`;
    yield* generateFailedExpressions(options, ctx, failGeneratedExpressions);
    yield* (0, elementEvents_1.generateElementEvents)(options, ctx, node, componentVar, getCtxVar, getPropsVar);
    yield* (0, elementDirectives_1.generateElementDirectives)(options, ctx, node);
    const templateRef = getTemplateRef(node);
    const isRootNode = ctx.singleRootNodes.has(node)
        && !options.vueCompilerOptions.fallthroughComponentNames.includes((0, shared_2.hyphenateTag)(tag));
    if (templateRef || isRootNode) {
        const componentInstanceVar = ctx.getInternalVariable();
        yield `var ${componentInstanceVar} = {} as (Parameters<NonNullable<typeof ${getCtxVar()}['expose']>>[0] | null)`;
        if (ctx.inVFor) {
            yield `[]`;
        }
        yield utils_1.endOfLine;
        if (templateRef) {
            const typeExp = `typeof ${ctx.getHoistVariable(componentInstanceVar)}`;
            ctx.addTemplateRef(templateRef[0], typeExp, templateRef[1]);
        }
        if (isRootNode) {
            ctx.singleRootElTypes.add(`NonNullable<typeof ${componentInstanceVar}>['$el']`);
        }
    }
    if (hasVBindAttrs(options, ctx, node)) {
        ctx.inheritedAttrVars.add(getPropsVar());
    }
    yield* generateStyleScopedClassReferences(options, node);
    const slotDir = node.props.find(p => p.type === CompilerDOM.NodeTypes.DIRECTIVE && p.name === 'slot');
    if (slotDir || node.children.length) {
        yield* (0, vSlot_1.generateVSlot)(options, ctx, node, slotDir, getCtxVar());
    }
    if (isCtxVarUsed) {
        yield `var ${ctxVar}!: __VLS_FunctionalComponentCtx<typeof ${componentVar}, typeof ${vNodeVar}>${utils_1.endOfLine}`;
    }
    if (isPropsVarUsed) {
        yield `var ${propsVar}!: __VLS_FunctionalComponentProps<typeof ${componentVar}, typeof ${vNodeVar}>${utils_1.endOfLine}`;
    }
    ctx.components.pop();
}
function* generateElement(options, ctx, node) {
    const [startTagOffset, endTagOffset] = (0, shared_2.getElementTagOffsets)(node, options.template);
    const failedPropExps = [];
    yield `${options.vueCompilerOptions.checkUnknownProps ? `__VLS_asFunctionalElement0` : `__VLS_asFunctionalElement1`}(${names.intrinsics}`;
    yield* (0, propertyAccess_1.generatePropertyAccess)(options, ctx, node.tag, startTagOffset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
    if (endTagOffset !== undefined) {
        yield `, `;
        yield names.intrinsics;
        yield* (0, propertyAccess_1.generatePropertyAccess)(options, ctx, node.tag, endTagOffset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
    }
    yield `)(`;
    const token = yield* (0, boundary_1.startBoundary)('template', startTagOffset, codeFeatures_1.codeFeatures.verification);
    yield `{${utils_1.newLine}`;
    yield* (0, elementProps_1.generateElementProps)(options, ctx, node, node.props, options.vueCompilerOptions.checkUnknownProps, failedPropExps);
    yield `}`;
    yield (0, boundary_1.endBoundary)(token, startTagOffset + node.tag.length);
    yield `)${utils_1.endOfLine}`;
    yield* generateFailedExpressions(options, ctx, failedPropExps);
    yield* (0, elementDirectives_1.generateElementDirectives)(options, ctx, node);
    const templateRef = getTemplateRef(node);
    if (templateRef) {
        let typeExp = `__VLS_Elements['${node.tag}']`;
        if (ctx.inVFor) {
            typeExp += `[]`;
        }
        ctx.addTemplateRef(templateRef[0], typeExp, templateRef[1]);
    }
    if (ctx.singleRootNodes.has(node)) {
        ctx.singleRootElTypes.add(`__VLS_Elements['${node.tag}']`);
    }
    if (hasVBindAttrs(options, ctx, node)) {
        ctx.inheritedAttrVars.add(`__VLS_intrinsics.${node.tag}`);
    }
    yield* generateStyleScopedClassReferences(options, node);
    for (const child of node.children) {
        yield* (0, templateChild_1.generateTemplateChild)(options, ctx, child);
    }
}
function* generateStyleScopedClassReferences({ template, typescript: ts }, node) {
    for (const prop of node.props) {
        if (prop.type === CompilerDOM.NodeTypes.ATTRIBUTE
            && prop.name === 'class'
            && prop.value) {
            const [text, start] = (0, shared_2.normalizeAttributeValue)(prop.value);
            for (const [className, offset] of forEachClassName(text)) {
                yield* (0, styleScopedClasses_1.generateStyleScopedClassReference)(template, className, start + offset);
            }
        }
        else if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
            && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
            && prop.arg.content === 'class') {
            const content = '(' + prop.exp.content + ')';
            const startOffset = prop.exp.loc.start.offset - 1;
            const ast = (0, utils_1.getTypeScriptAST)(ts, template, content);
            const literals = [];
            for (const node of (0, utils_1.forEachNode)(ts, ast)) {
                if (!ts.isExpressionStatement(node)
                    || !ts.isParenthesizedExpression(node.expression)) {
                    continue;
                }
                const { expression } = node.expression;
                if (ts.isStringLiteralLike(expression)) {
                    literals.push(expression);
                }
                else if (ts.isArrayLiteralExpression(expression)) {
                    yield* walkArrayLiteral(expression);
                }
                else if (ts.isObjectLiteralExpression(expression)) {
                    yield* walkObjectLiteral(expression);
                }
            }
            for (const literal of literals) {
                const start = literal.end - literal.text.length - 1 + startOffset;
                for (const [className, offset] of forEachClassName(literal.text)) {
                    yield* (0, styleScopedClasses_1.generateStyleScopedClassReference)(template, className, start + offset);
                }
            }
            function* walkArrayLiteral(node) {
                const { elements } = node;
                for (const element of elements) {
                    if (ts.isStringLiteralLike(element)) {
                        literals.push(element);
                    }
                    else if (ts.isObjectLiteralExpression(element)) {
                        yield* walkObjectLiteral(element);
                    }
                }
            }
            function* walkObjectLiteral(node) {
                const { properties } = node;
                for (const property of properties) {
                    if (ts.isPropertyAssignment(property)) {
                        const { name } = property;
                        if (ts.isIdentifier(name)) {
                            const text = (0, shared_2.getNodeText)(ts, name, ast);
                            yield* (0, styleScopedClasses_1.generateStyleScopedClassReference)(template, text, name.end - text.length + startOffset);
                        }
                        else if (ts.isStringLiteral(name)) {
                            literals.push(name);
                        }
                        else if (ts.isComputedPropertyName(name)) {
                            const { expression } = name;
                            if (ts.isStringLiteralLike(expression)) {
                                literals.push(expression);
                            }
                        }
                    }
                    else if (ts.isShorthandPropertyAssignment(property)) {
                        const text = (0, shared_2.getNodeText)(ts, property.name, ast);
                        yield* (0, styleScopedClasses_1.generateStyleScopedClassReference)(template, text, property.name.end - text.length + startOffset);
                    }
                }
            }
        }
    }
}
function* forEachClassName(content) {
    let offset = 0;
    for (const className of content.split(' ')) {
        yield [className, offset];
        offset += className.length + 1;
    }
}
function* generateFailedExpressions(options, ctx, failGeneratedExpressions) {
    for (const failedExp of failGeneratedExpressions) {
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, failedExp.node.loc.source, failedExp.node.loc.start.offset, failedExp.prefix, failedExp.suffix);
        yield utils_1.endOfLine;
    }
}
function getTemplateRef(node) {
    for (const prop of node.props) {
        if (prop.type === CompilerDOM.NodeTypes.ATTRIBUTE
            && prop.name === 'ref'
            && prop.value) {
            return (0, shared_2.normalizeAttributeValue)(prop.value);
        }
    }
}
function hasVBindAttrs(options, ctx, node) {
    return options.vueCompilerOptions.fallthroughAttributes && ((options.inheritAttrs && ctx.singleRootNodes.has(node))
        || node.props.some(prop => prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && prop.name === 'bind'
            && prop.exp?.loc.source === '$attrs'));
}
//# sourceMappingURL=element.js.map