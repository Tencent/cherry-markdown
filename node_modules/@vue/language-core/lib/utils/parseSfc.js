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
exports.parse = parse;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const shared_1 = require("./shared");
function parse(source) {
    const errors = [];
    const ast = CompilerDOM.parse(source, {
        // there are no components at SFC parsing level
        isNativeTag: () => true,
        // preserve all whitespaces
        isPreTag: () => true,
        parseMode: 'sfc',
        onError: e => {
            errors.push(e);
        },
        comments: true,
    });
    const descriptor = {
        filename: 'anonymous.vue',
        source,
        comments: [],
        template: null,
        script: null,
        scriptSetup: null,
        styles: [],
        customBlocks: [],
        cssVars: [],
        slotted: false,
        shouldForceReload: () => false,
    };
    ast.children.forEach(node => {
        if (node.type === CompilerDOM.NodeTypes.COMMENT) {
            descriptor.comments.push(node.content);
            return;
        }
        else if (node.type !== CompilerDOM.NodeTypes.ELEMENT) {
            return;
        }
        switch (node.tag) {
            case 'template':
                descriptor.template = createBlock(node, source);
                break;
            case 'script':
                const scriptBlock = createBlock(node, source);
                const isSetup = !!scriptBlock.setup;
                if (isSetup && !descriptor.scriptSetup) {
                    descriptor.scriptSetup = scriptBlock;
                    break;
                }
                if (!isSetup && !descriptor.script) {
                    descriptor.script = scriptBlock;
                    break;
                }
                break;
            case 'style':
                const styleBlock = createBlock(node, source);
                descriptor.styles.push(styleBlock);
                break;
            default:
                descriptor.customBlocks.push(createBlock(node, source));
                break;
        }
    });
    return {
        descriptor,
        errors,
    };
}
function createBlock(node, source) {
    const type = node.tag;
    let { start, end } = node.loc;
    let content = '';
    if (node.children.length) {
        start = node.children[0].loc.start;
        end = node.children[node.children.length - 1].loc.end;
        content = source.slice(start.offset, end.offset);
    }
    else {
        const offset = node.loc.source.indexOf(`</`);
        if (offset > -1) {
            start = {
                line: start.line,
                column: start.column + offset,
                offset: start.offset + offset,
            };
        }
        end = Object.assign({}, start);
    }
    const loc = {
        source: content,
        start,
        end,
    };
    const attrs = {};
    const block = {
        type,
        content,
        loc,
        attrs,
    };
    node.props.forEach(p => {
        if (p.type === CompilerDOM.NodeTypes.ATTRIBUTE) {
            attrs[p.name] = p.value ? p.value.content || true : true;
            if (p.name === 'lang') {
                block.lang = p.value?.content;
            }
            else if (p.name === 'src') {
                block.__src = parseAttr(p, node);
            }
            else if (isScriptBlock(block)) {
                if (p.name === 'vapor') {
                    block.setup ??= attrs[p.name];
                    block.__generic ??= true;
                }
                else if (p.name === 'setup') {
                    block.setup = attrs[p.name];
                }
                else if (p.name === 'generic') {
                    block.__generic = parseAttr(p, node);
                }
            }
            else if (isStyleBlock(block)) {
                if (p.name === 'scoped') {
                    block.scoped = true;
                }
                else if (p.name === 'module') {
                    block.__module = parseAttr(p, node);
                }
            }
        }
    });
    return block;
}
function isScriptBlock(block) {
    return block.type === 'script';
}
function isStyleBlock(block) {
    return block.type === 'style';
}
function parseAttr(p, node) {
    if (!p.value) {
        return true;
    }
    const [content, offset] = (0, shared_1.normalizeAttributeValue)(p.value);
    return {
        text: content,
        offset: offset - node.loc.start.offset,
        quotes: offset > p.value.loc.start.offset,
    };
}
//# sourceMappingURL=parseSfc.js.map