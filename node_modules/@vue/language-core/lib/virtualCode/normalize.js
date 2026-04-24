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
exports.normalizeTemplateAST = normalizeTemplateAST;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const forEachTemplateNode_1 = require("../utils/forEachTemplateNode");
// See https://github.com/vuejs/core/issues/3498
function normalizeTemplateAST(root) {
    // @ts-ignore
    const transformContext = {
        onError: () => { },
        helperString: str => str.toString(),
        replaceNode: () => { },
        cacheHandlers: false,
        prefixIdentifiers: false,
        scopes: {
            vFor: 0,
            vOnce: 0,
            vPre: 0,
            vSlot: 0,
        },
        expressionPlugins: ['typescript'],
    };
    for (const { children, codegenNode, props } of (0, forEachTemplateNode_1.forEachElementNode)(root)) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.type !== CompilerDOM.NodeTypes.ELEMENT) {
                continue;
            }
            const forNode = getVForNode(child, transformContext);
            if (forNode) {
                children[i] = forNode;
                continue;
            }
            const ifNode = getVIfNode(child, transformContext);
            if (ifNode) {
                const normalized = normalizeIfBranch(ifNode, children, i);
                children.splice(i, normalized.end - i + 1, normalized.node);
                continue;
            }
        }
        // #4539
        if (codegenNode
            && 'props' in codegenNode
            && codegenNode.props
            && 'properties' in codegenNode.props) {
            for (const p of codegenNode.props.properties) {
                if (p.key.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                    && p.key.content === 'key'
                    && !p.key.isHandlerKey
                    && !p.key.loc.source
                    && p.value.type === CompilerDOM.NodeTypes.SIMPLE_EXPRESSION
                    && p.value.constType === CompilerDOM.ConstantTypes.NOT_CONSTANT) {
                    const contentBeforeValue = root.loc.source.slice(0, p.value.loc.start.offset);
                    const argOffset = contentBeforeValue.lastIndexOf('key');
                    props.push({
                        type: CompilerDOM.NodeTypes.DIRECTIVE,
                        name: 'bind',
                        exp: p.value,
                        loc: p.loc,
                        arg: {
                            ...p.key,
                            loc: {
                                start: { line: -1, column: -1, offset: argOffset },
                                end: { line: -1, column: -1, offset: argOffset + 'key'.length },
                                source: 'key',
                            },
                        },
                        modifiers: [],
                    });
                    break;
                }
            }
        }
    }
}
function normalizeIfBranch(ifNode, children, start) {
    let end = start;
    let comments = [];
    for (let i = start + 1; i < children.length; i++) {
        const sibling = children[i];
        if (sibling.type === CompilerDOM.NodeTypes.COMMENT) {
            comments.push(sibling);
            continue;
        }
        if (sibling.type === CompilerDOM.NodeTypes.TEXT && !sibling.content.trim()) {
            continue;
        }
        const elseBranch = getVElseDirective(sibling);
        if (elseBranch) {
            const branchNode = {
                ...elseBranch.element,
                props: elseBranch.element.props.filter(prop => prop !== elseBranch.directive),
            };
            const branch = createIfBranch(branchNode, elseBranch.directive);
            if (comments.length) {
                branch.children = [...comments, ...branch.children];
            }
            ifNode.branches.push(branch);
            comments = [];
            end = i;
            continue;
        }
        break;
    }
    return { node: ifNode, end };
}
// source: https://github.com/vuejs/core/blob/25ebe3a42cd80ac0256355c2740a0258cdd7419d/packages/compiler-core/src/transforms/vIf.ts#L207
function createIfBranch(node, dir) {
    const isTemplateIf = node.tagType === CompilerDOM.ElementTypes.TEMPLATE;
    return {
        type: CompilerDOM.NodeTypes.IF_BRANCH,
        loc: node.loc,
        condition: dir.name === 'else' ? undefined : dir.exp,
        children: isTemplateIf && !CompilerDOM.findDir(node, 'for') && !CompilerDOM.findDir(node, 'slot')
            ? node.children
            : [node],
        userKey: CompilerDOM.findProp(node, 'key'),
        isTemplateIf,
    };
}
function getVElseDirective(node) {
    if (node.type !== CompilerDOM.NodeTypes.ELEMENT) {
        return;
    }
    const directive = node.props.find((prop) => prop.type === CompilerDOM.NodeTypes.DIRECTIVE
        && (prop.name === 'else-if' || prop.name === 'else'));
    if (directive) {
        return {
            element: node,
            directive,
        };
    }
}
function getVForNode(node, transformContext) {
    const forDirective = node.props.find((prop) => prop.type === CompilerDOM.NodeTypes.DIRECTIVE
        && prop.name === 'for');
    if (forDirective) {
        let forNode;
        CompilerDOM.processFor(node, forDirective, transformContext, _forNode => {
            forNode = { ..._forNode };
            return undefined;
        });
        if (forNode) {
            forNode.children = [{
                    ...node,
                    props: node.props.filter(prop => prop !== forDirective),
                }];
            return forNode;
        }
    }
}
function getVIfNode(node, transformContext) {
    const ifDirective = node.props.find((prop) => prop.type === CompilerDOM.NodeTypes.DIRECTIVE
        && prop.name === 'if');
    if (ifDirective) {
        let ifNode;
        CompilerDOM.processIf(node, ifDirective, transformContext, _ifNode => {
            ifNode = { ..._ifNode };
            return undefined;
        });
        if (ifNode) {
            for (const branch of ifNode.branches) {
                branch.children = [{
                        ...node,
                        props: node.props.filter(prop => prop !== ifDirective),
                    }];
            }
            return ifNode;
        }
    }
}
//# sourceMappingURL=normalize.js.map