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
exports.generateVIf = generateVIf;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const muggle_string_1 = require("muggle-string");
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const interpolation_1 = require("./interpolation");
const templateChild_1 = require("./templateChild");
function* generateVIf(options, ctx, node) {
    const originalBlockConditionsLength = ctx.blockConditions.length;
    const isFragment = node.codegenNode
        && 'consequent' in node.codegenNode
        && 'tag' in node.codegenNode.consequent
        && node.codegenNode.consequent.tag === CompilerDOM.FRAGMENT;
    for (let i = 0; i < node.branches.length; i++) {
        const branch = node.branches[i];
        if (i === 0) {
            yield `if `;
        }
        else if (branch.condition) {
            yield `else if `;
        }
        else {
            yield `else `;
        }
        let addedBlockCondition = false;
        if (branch.condition?.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION) {
            const codes = [...(0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, branch.condition.content, branch.condition.loc.start.offset, `(`, `)`)];
            yield* codes;
            ctx.blockConditions.push((0, muggle_string_1.toString)(codes));
            addedBlockCondition = true;
            yield ` `;
        }
        yield `{${utils_1.newLine}`;
        for (const child of branch.children) {
            yield* (0, templateChild_1.generateTemplateChild)(options, ctx, child, i !== 0 || isFragment);
        }
        yield `}${utils_1.newLine}`;
        if (addedBlockCondition) {
            ctx.blockConditions[ctx.blockConditions.length - 1] = `!${ctx.blockConditions[ctx.blockConditions.length - 1]}`;
        }
    }
    ctx.blockConditions.length = originalBlockConditionsLength;
}
//# sourceMappingURL=vIf.js.map