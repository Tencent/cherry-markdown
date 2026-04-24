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
exports.forEachElementNode = forEachElementNode;
exports.forEachInterpolationNode = forEachInterpolationNode;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
function* forEachElementNode(node) {
    if (node.type === CompilerDOM.NodeTypes.ROOT) {
        for (const child of node.children) {
            yield* forEachElementNode(child);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.ELEMENT) {
        yield node;
        for (const child of node.children) {
            yield* forEachElementNode(child);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.IF) {
        for (const branch of node.branches) {
            for (const childNode of branch.children) {
                yield* forEachElementNode(childNode);
            }
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.FOR) {
        for (const child of node.children) {
            yield* forEachElementNode(child);
        }
    }
}
function* forEachInterpolationNode(node) {
    if (node.type === CompilerDOM.NodeTypes.ROOT) {
        for (const child of node.children) {
            yield* forEachInterpolationNode(child);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.ELEMENT) {
        for (const child of node.children) {
            yield* forEachInterpolationNode(child);
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.TEXT_CALL) {
        yield* forEachInterpolationNode(node.content);
    }
    else if (node.type === CompilerDOM.NodeTypes.COMPOUND_EXPRESSION) {
        for (const child of node.children) {
            if (typeof child === 'object') {
                yield* forEachInterpolationNode(child);
            }
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.INTERPOLATION) {
        yield node;
    }
    else if (node.type === CompilerDOM.NodeTypes.IF) {
        for (const branch of node.branches) {
            for (const childNode of branch.children) {
                yield* forEachInterpolationNode(childNode);
            }
        }
    }
    else if (node.type === CompilerDOM.NodeTypes.FOR) {
        for (const child of node.children) {
            yield* forEachInterpolationNode(child);
        }
    }
}
//# sourceMappingURL=forEachTemplateNode.js.map