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
exports.generateElementProps = generateElementProps;
exports.generatePropExp = generatePropExp;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("@vue/shared");
const picomatch_1 = require("picomatch");
const shared_2 = require("../../utils/shared");
const codeFeatures_1 = require("../codeFeatures");
const inlayHints_1 = require("../inlayHints");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const camelized_1 = require("../utils/camelized");
const unicode_1 = require("../utils/unicode");
const elementDirectives_1 = require("./elementDirectives");
const elementEvents_1 = require("./elementEvents");
const interpolation_1 = require("./interpolation");
const objectProperty_1 = require("./objectProperty");
function* generateElementProps(options, ctx, node, props, strictPropsCheck, failGeneratedExpressions) {
    const isComponent = node.tagType === CompilerDOM.ElementTypes.COMPONENT;
    for (const prop of props) {
        if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && prop.name === 'on') {
            if (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                && !prop.arg.loc.source.startsWith('[')
                && !prop.arg.loc.source.endsWith(']')) {
                if (!isComponent) {
                    yield `...{ `;
                    yield* (0, elementEvents_1.generateEventArg)(options, prop.arg.loc.source, prop.arg.loc.start.offset);
                    yield `: `;
                    yield* (0, elementEvents_1.generateEventExpression)(options, ctx, prop);
                    yield `},`;
                }
                else {
                    yield `...{ '${(0, shared_1.camelize)('on-' + prop.arg.loc.source)}': {} as any },`;
                }
                yield utils_1.newLine;
            }
            else if (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                && prop.arg.loc.source.startsWith('[')
                && prop.arg.loc.source.endsWith(']')) {
                failGeneratedExpressions?.push({ node: prop.arg, prefix: `(`, suffix: `)` });
                failGeneratedExpressions?.push({ node: prop.exp, prefix: `() => {`, suffix: `}` });
            }
            else if (!prop.arg
                && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
                failGeneratedExpressions?.push({ node: prop.exp, prefix: `(`, suffix: `)` });
            }
        }
    }
    for (const prop of props) {
        if (prop.type === CompilerDOM.NodeTypes.DIRECTIVE
            && ((prop.name === 'bind' && prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION)
                || prop.name === 'model')
            && (!prop.exp || prop.exp.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION)) {
            let propName;
            if (prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
                propName = prop.arg.constType === CompilerDOM.ConstantTypes.CAN_STRINGIFY
                    ? prop.arg.content
                    : prop.arg.loc.source;
            }
            else {
                propName = getModelPropName(node, options.vueCompilerOptions);
            }
            if (propName === undefined
                || options.vueCompilerOptions.dataAttributes.some(pattern => (0, picomatch_1.isMatch)(propName, pattern))) {
                if (prop.exp && prop.exp.constType !== CompilerDOM.ConstantTypes.CAN_STRINGIFY) {
                    failGeneratedExpressions?.push({ node: prop.exp, prefix: `(`, suffix: `)` });
                }
                continue;
            }
            if (prop.name === 'bind'
                && prop.modifiers.some(m => m.content === 'prop' || m.content === 'attr')) {
                propName = propName.slice(1);
            }
            const shouldSpread = propName === 'style' || propName === 'class';
            const shouldCamelize = isComponent && getShouldCamelize(options, prop, propName);
            const features = getPropsCodeFeatures(strictPropsCheck);
            if (shouldSpread) {
                yield `...{ `;
            }
            const token = yield* (0, boundary_1.startBoundary)('template', prop.loc.start.offset, codeFeatures_1.codeFeatures.verification);
            if (prop.arg) {
                yield* (0, objectProperty_1.generateObjectProperty)(options, ctx, propName, prop.arg.loc.start.offset, features, shouldCamelize);
            }
            else {
                const token2 = yield* (0, boundary_1.startBoundary)('template', prop.loc.start.offset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
                yield propName;
                yield (0, boundary_1.endBoundary)(token2, prop.loc.start.offset + 'v-model'.length);
            }
            yield `: `;
            const argLoc = prop.arg?.loc ?? prop.loc;
            const token3 = yield* (0, boundary_1.startBoundary)('template', argLoc.start.offset, codeFeatures_1.codeFeatures.verification);
            yield* generatePropExp(options, ctx, prop, prop.exp);
            yield (0, boundary_1.endBoundary)(token3, argLoc.end.offset);
            yield (0, boundary_1.endBoundary)(token, prop.loc.end.offset);
            if (shouldSpread) {
                yield ` }`;
            }
            yield `,${utils_1.newLine}`;
            if (isComponent && prop.name === 'model' && prop.modifiers.length) {
                const propertyName = prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                    ? !prop.arg.isStatic
                        ? `[__VLS_tryAsConstant(\`\${${prop.arg.content}}Modifiers\`)]`
                        : (0, shared_1.camelize)(propName) + `Modifiers`
                    : `modelModifiers`;
                yield* (0, elementDirectives_1.generateModifiers)(options, ctx, prop, propertyName);
                yield utils_1.newLine;
            }
        }
        else if (prop.type === CompilerDOM.NodeTypes.ATTRIBUTE) {
            if (options.vueCompilerOptions.dataAttributes.some(pattern => (0, picomatch_1.isMatch)(prop.name, pattern))) {
                continue;
            }
            const shouldSpread = prop.name === 'style' || prop.name === 'class';
            const shouldCamelize = isComponent && getShouldCamelize(options, prop, prop.name);
            const features = getPropsCodeFeatures(strictPropsCheck);
            if (shouldSpread) {
                yield `...{ `;
            }
            const token = yield* (0, boundary_1.startBoundary)('template', prop.loc.start.offset, codeFeatures_1.codeFeatures.verification);
            const prefix = options.template.content.slice(prop.loc.start.offset, prop.loc.start.offset + 1);
            if (prefix === '.' || prefix === '#') {
                // Pug shorthand syntax
                for (const char of prop.name) {
                    yield [char, 'template', prop.loc.start.offset, features];
                }
            }
            else {
                yield* (0, objectProperty_1.generateObjectProperty)(options, ctx, prop.name, prop.loc.start.offset, features, shouldCamelize);
            }
            yield `: `;
            if (prop.name === 'style') {
                yield `{}`;
            }
            else if (prop.value) {
                yield* generateAttrValue(prop.value, codeFeatures_1.codeFeatures.withoutNavigation);
            }
            else {
                yield `true`;
            }
            yield (0, boundary_1.endBoundary)(token, prop.loc.end.offset);
            if (shouldSpread) {
                yield ` }`;
            }
            yield `,${utils_1.newLine}`;
        }
        else if (prop.name === 'bind'
            && !prop.arg
            && prop.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
            if (prop.exp.loc.source === '$attrs') {
                failGeneratedExpressions?.push({ node: prop.exp, prefix: `(`, suffix: `)` });
            }
            else {
                const token = yield* (0, boundary_1.startBoundary)('template', prop.exp.loc.start.offset, codeFeatures_1.codeFeatures.verification);
                yield `...`;
                yield* generatePropExp(options, ctx, prop, prop.exp);
                yield (0, boundary_1.endBoundary)(token, prop.exp.loc.end.offset);
                yield `,${utils_1.newLine}`;
            }
        }
    }
}
function* generatePropExp(options, ctx, prop, exp) {
    if (!exp) {
        yield `{}`;
    }
    else if (prop.arg?.loc.start.offset !== prop.exp?.loc.start.offset) {
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, exp.loc.source, exp.loc.start.offset, `(`, `)`);
    }
    else {
        const propVariableName = (0, shared_1.camelize)(exp.loc.source);
        if (utils_1.identifierRegex.test(propVariableName)) {
            const codes = (0, camelized_1.generateCamelized)(exp.loc.source, 'template', exp.loc.start.offset, codeFeatures_1.codeFeatures.withoutHighlightAndCompletion);
            if (ctx.scopes.some(scope => scope.has(propVariableName))) {
                yield* codes;
            }
            else if (options.setupRefs.has(propVariableName)) {
                yield* codes;
                yield `.value`;
            }
            else {
                ctx.recordComponentAccess('template', propVariableName, exp.loc.start.offset);
                yield names.ctx;
                yield `.`;
                yield* codes;
            }
            ctx.inlayHints.push((0, inlayHints_1.createVBindShorthandInlayHintInfo)(prop.loc, propVariableName));
        }
    }
}
function* generateAttrValue(node, features) {
    const quote = node.loc.source.startsWith("'") ? "'" : '"';
    const [content, offset] = (0, shared_2.normalizeAttributeValue)(node);
    yield quote;
    yield* (0, unicode_1.generateUnicode)(content, offset, features);
    yield quote;
}
function getShouldCamelize(options, prop, propName) {
    return (prop.type !== CompilerDOM.NodeTypes.DIRECTIVE
        || !prop.arg
        || (prop.arg.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION && prop.arg.isStatic))
        && (0, shared_2.hyphenateAttr)(propName) === propName
        && !options.vueCompilerOptions.htmlAttributes.some(pattern => (0, picomatch_1.isMatch)(propName, pattern));
}
function getPropsCodeFeatures(strictPropsCheck) {
    return {
        ...codeFeatures_1.codeFeatures.withoutHighlightAndCompletion,
        ...strictPropsCheck
            ? codeFeatures_1.codeFeatures.verification
            : codeFeatures_1.codeFeatures.doNotReportTs2353AndTs2561,
    };
}
function getModelPropName(node, vueCompilerOptions) {
    for (const modelName in vueCompilerOptions.experimentalModelPropName) {
        const tags = vueCompilerOptions.experimentalModelPropName[modelName];
        for (const tag in tags) {
            if (node.tag === tag || node.tag === (0, shared_2.hyphenateTag)(tag)) {
                const val = tags[tag];
                if (typeof val === 'object') {
                    const arr = Array.isArray(val) ? val : [val];
                    for (const attrs of arr) {
                        let failed = false;
                        for (const attr in attrs) {
                            const attrNode = node.props.find(prop => prop.type === CompilerDOM.NodeTypes.ATTRIBUTE && prop.name === attr);
                            if (!attrNode || attrNode.value?.content !== attrs[attr]) {
                                failed = true;
                                break;
                            }
                        }
                        if (!failed) {
                            // all match
                            return modelName || undefined;
                        }
                    }
                }
            }
        }
    }
    for (const modelName in vueCompilerOptions.experimentalModelPropName) {
        const tags = vueCompilerOptions.experimentalModelPropName[modelName];
        for (const tag in tags) {
            if (node.tag === tag || node.tag === (0, shared_2.hyphenateTag)(tag)) {
                const attrs = tags[tag];
                if (attrs === true) {
                    return modelName || undefined;
                }
            }
        }
    }
    return 'modelValue';
}
//# sourceMappingURL=elementProps.js.map