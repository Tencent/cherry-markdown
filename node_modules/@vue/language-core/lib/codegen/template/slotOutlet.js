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
exports.generateSlotOutlet = generateSlotOutlet;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("../../utils/shared");
const codeFeatures_1 = require("../codeFeatures");
const inlayHints_1 = require("../inlayHints");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const elementProps_1 = require("./elementProps");
const interpolation_1 = require("./interpolation");
const propertyAccess_1 = require("./propertyAccess");
const templateChild_1 = require("./templateChild");
function* generateSlotOutlet(options, ctx, node) {
    const [startTagOffset] = (0, shared_1.getElementTagOffsets)(node, options.template);
    const startTagEndOffset = startTagOffset + node.tag.length;
    const propsVar = ctx.getInternalVariable();
    const nameProp = node.props.find(prop => {
        if (prop.type === CompilerDOM.NodeTypes.ATTRIBUTE) {
            return prop.name === 'name';
        }
        if (prop.name === 'bind'
            && prop.arg?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
            return prop.arg.content === 'name';
        }
    });
    if (options.hasDefineSlots) {
        yield `__VLS_asFunctionalSlot(`;
        if (nameProp) {
            let codes;
            if (nameProp.type === CompilerDOM.NodeTypes.ATTRIBUTE && nameProp.value) {
                const [content, offset] = (0, shared_1.normalizeAttributeValue)(nameProp.value);
                codes = (0, propertyAccess_1.generatePropertyAccess)(options, ctx, content, offset, codeFeatures_1.codeFeatures.navigationAndVerification);
            }
            else if (nameProp.type === CompilerDOM.NodeTypes.DIRECTIVE
                && nameProp.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
                codes = [
                    `[`,
                    ...(0, elementProps_1.generatePropExp)(options, ctx, nameProp, nameProp.exp),
                    `]`,
                ];
            }
            else {
                codes = [`['default']`];
            }
            const token = yield* (0, boundary_1.startBoundary)('template', nameProp.loc.start.offset, codeFeatures_1.codeFeatures.verification);
            yield options.slotsAssignName ?? names.slots;
            yield* codes;
            yield (0, boundary_1.endBoundary)(token, nameProp.loc.end.offset);
        }
        else {
            const token = yield* (0, boundary_1.startBoundary)('template', startTagOffset, codeFeatures_1.codeFeatures.verification);
            yield `${options.slotsAssignName ?? names.slots}[`;
            const token2 = yield* (0, boundary_1.startBoundary)('template', startTagOffset, codeFeatures_1.codeFeatures.verification);
            yield `'default'`;
            yield (0, boundary_1.endBoundary)(token2, startTagEndOffset);
            yield `]`;
            yield (0, boundary_1.endBoundary)(token, startTagEndOffset);
        }
        yield `)(`;
        const token = yield* (0, boundary_1.startBoundary)('template', startTagOffset, codeFeatures_1.codeFeatures.verification);
        yield `{${utils_1.newLine}`;
        yield* (0, elementProps_1.generateElementProps)(options, ctx, node, node.props.filter(prop => prop !== nameProp), true);
        yield `}`;
        yield (0, boundary_1.endBoundary)(token, startTagEndOffset);
        yield `)${utils_1.endOfLine}`;
    }
    else {
        yield `var ${propsVar} = {${utils_1.newLine}`;
        yield* (0, elementProps_1.generateElementProps)(options, ctx, node, node.props.filter(prop => prop !== nameProp), options.vueCompilerOptions.checkUnknownProps);
        yield `}${utils_1.endOfLine}`;
        if (nameProp?.type === CompilerDOM.NodeTypes.ATTRIBUTE
            && nameProp.value) {
            ctx.slots.push({
                name: nameProp.value.content,
                offset: nameProp.loc.start.offset + nameProp.loc.source.indexOf(nameProp.value.content, nameProp.name.length),
                tagRange: [startTagOffset, startTagOffset + node.tag.length],
                nodeLoc: node.loc,
                propsVar: ctx.getHoistVariable(propsVar),
            });
        }
        else if (nameProp?.type === CompilerDOM.NodeTypes.DIRECTIVE
            && nameProp.exp?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
            const isShortHand = nameProp.arg?.loc.start.offset === nameProp.exp.loc.start.offset;
            if (isShortHand) {
                ctx.inlayHints.push((0, inlayHints_1.createVBindShorthandInlayHintInfo)(nameProp.exp.loc, 'name'));
            }
            const expVar = ctx.getInternalVariable();
            yield `var ${expVar} = __VLS_tryAsConstant(`;
            yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, isShortHand
                ? codeFeatures_1.codeFeatures.withoutHighlightAndCompletion
                : codeFeatures_1.codeFeatures.all, nameProp.exp.content, nameProp.exp.loc.start.offset);
            yield `)${utils_1.endOfLine}`;
            ctx.dynamicSlots.push({
                expVar: ctx.getHoistVariable(expVar),
                propsVar: ctx.getHoistVariable(propsVar),
            });
        }
        else {
            ctx.slots.push({
                name: 'default',
                tagRange: [startTagOffset, startTagEndOffset],
                nodeLoc: node.loc,
                propsVar: ctx.getHoistVariable(propsVar),
            });
        }
    }
    for (const child of node.children) {
        yield* (0, templateChild_1.generateTemplateChild)(options, ctx, child);
    }
}
//# sourceMappingURL=slotOutlet.js.map