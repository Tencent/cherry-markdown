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
exports.generateTemplateChild = generateTemplateChild;
exports.parseInterpolationNode = parseInterpolationNode;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("../../utils/shared");
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const element_1 = require("./element");
const interpolation_1 = require("./interpolation");
const slotOutlet_1 = require("./slotOutlet");
const vFor_1 = require("./vFor");
const vIf_1 = require("./vIf");
const vSlot_1 = require("./vSlot");
function* generateTemplateChild(options, ctx, node, enterNode = true) {
    if (enterNode && !ctx.enter(node)) {
        return;
    }
    const cur = node;
    if (cur.codegenNode?.type === CompilerDOM.NodeTypes.JS_CACHE_EXPRESSION) {
        cur.codegenNode = cur.codegenNode.value;
    }
    if (node.type === CompilerDOM.NodeTypes.ROOT) {
        for (const item of collectSingleRootNodes(options, node.children)) {
            ctx.singleRootNodes.add(item);
        }
        for (const child of node.children) {
            yield* generateTemplateChild(options, ctx, child);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.ELEMENT) {
        let slotDir;
        if (node.tagType === CompilerDOM.ElementTypes.SLOT) {
            yield* (0, slotOutlet_1.generateSlotOutlet)(options, ctx, node);
        }
        else if (node.tagType === CompilerDOM.ElementTypes.TEMPLATE
            && ctx.components.length
            && (slotDir = node.props.find(p => p.type === CompilerDOM.NodeTypes.DIRECTIVE && p.name === 'slot'))) {
            yield* (0, vSlot_1.generateVSlot)(options, ctx, node, slotDir, ctx.components[ctx.components.length - 1]());
        }
        else if (node.tagType === CompilerDOM.ElementTypes.ELEMENT
            || node.tagType === CompilerDOM.ElementTypes.TEMPLATE) {
            yield* (0, element_1.generateElement)(options, ctx, node);
        }
        else {
            yield* (0, element_1.generateComponent)(options, ctx, node);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.TEXT_CALL) {
        // {{ var }}
        yield* generateTemplateChild(options, ctx, node.content, false);
    }
    else if (node.type === CompilerDOM.NodeTypes.COMPOUND_EXPRESSION) {
        // {{ ... }} {{ ... }}
        for (const child of node.children) {
            if (typeof child !== 'object') {
                continue;
            }
            yield* generateTemplateChild(options, ctx, child, false);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.INTERPOLATION) {
        // {{ ... }}
        const [content, start] = parseInterpolationNode(node, options.template.content);
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, codeFeatures_1.codeFeatures.all, content, start, `(`, `)${utils_1.endOfLine}`);
    }
    else if (node.type === CompilerDOM.NodeTypes.IF) {
        // v-if / v-else-if / v-else
        yield* (0, vIf_1.generateVIf)(options, ctx, node);
    }
    else if (node.type === CompilerDOM.NodeTypes.FOR) {
        // v-for
        yield* (0, vFor_1.generateVFor)(options, ctx, node);
    }
    else if (node.type === CompilerDOM.NodeTypes.TEXT) {
        // not needed progress
    }
    if (enterNode) {
        yield* ctx.exit();
    }
}
function* collectSingleRootNodes(options, children) {
    // Exclude the effect of comments on the root node
    children = children.filter(node => node.type !== CompilerDOM.NodeTypes.COMMENT);
    if (children.length !== 1) {
        // "null" is used to determine whether the component is not always has a single root
        if (children.length > 1) {
            yield null;
        }
        return;
    }
    const child = children[0];
    if (child.type === CompilerDOM.NodeTypes.IF) {
        for (const branch of child.branches) {
            yield* collectSingleRootNodes(options, branch.children);
        }
        return;
    }
    else if (child.type !== CompilerDOM.NodeTypes.ELEMENT) {
        return;
    }
    yield child;
    const tag = (0, shared_1.hyphenateTag)(child.tag);
    if (options.vueCompilerOptions.fallthroughComponentNames.includes(tag)) {
        yield* collectSingleRootNodes(options, child.children);
    }
}
function parseInterpolationNode(node, template) {
    let start = node.content.loc.start.offset;
    let end = node.content.loc.end.offset;
    // fix https://github.com/vuejs/language-tools/issues/1787
    while (template[start - 1]?.trim() === '') {
        start--;
    }
    while (template[end]?.trim() === '') {
        end++;
    }
    return [template.slice(start, end), start];
}
//# sourceMappingURL=templateChild.js.map