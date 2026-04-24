"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBindingRanges = parseBindingRanges;
exports.getClosestMultiLineCommentRange = getClosestMultiLineCommentRange;
const collectBindings_1 = require("../utils/collectBindings");
const shared_1 = require("../utils/shared");
function parseBindingRanges(ts, ast, componentExtsensions) {
    const bindings = [];
    const components = [];
    ts.forEachChild(ast, node => {
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                const ranges = (0, collectBindings_1.collectBindingRanges)(ts, decl.name, ast);
                bindings.push(...ranges);
            }
        }
        else if (ts.isFunctionDeclaration(node)) {
            if (node.name && ts.isIdentifier(node.name)) {
                bindings.push(_getStartEnd(node.name));
            }
        }
        else if (ts.isClassDeclaration(node)) {
            if (node.name) {
                bindings.push(_getStartEnd(node.name));
            }
        }
        else if (ts.isEnumDeclaration(node)) {
            bindings.push(_getStartEnd(node.name));
        }
        if (ts.isImportDeclaration(node)) {
            const moduleName = _getNodeText(node.moduleSpecifier).slice(1, -1);
            if (node.importClause && !node.importClause.isTypeOnly) {
                const { name, namedBindings } = node.importClause;
                if (name) {
                    if (componentExtsensions.some(ext => moduleName.endsWith(ext))) {
                        components.push(_getStartEnd(name));
                    }
                    else {
                        bindings.push(_getStartEnd(name));
                    }
                }
                if (namedBindings) {
                    if (ts.isNamedImports(namedBindings)) {
                        for (const element of namedBindings.elements) {
                            if (element.isTypeOnly) {
                                continue;
                            }
                            if (element.propertyName
                                && _getNodeText(element.propertyName) === 'default'
                                && componentExtsensions.some(ext => moduleName.endsWith(ext))) {
                                components.push(_getStartEnd(element.name));
                            }
                            else {
                                bindings.push(_getStartEnd(element.name));
                            }
                        }
                    }
                    else {
                        bindings.push(_getStartEnd(namedBindings.name));
                    }
                }
            }
        }
    });
    return {
        bindings,
        components,
    };
    function _getStartEnd(node) {
        return (0, shared_1.getStartEnd)(ts, node, ast);
    }
    function _getNodeText(node) {
        return (0, shared_1.getNodeText)(ts, node, ast);
    }
}
function getClosestMultiLineCommentRange(ts, node, parents, ast) {
    for (let i = parents.length - 1; i >= 0; i--) {
        if (ts.isStatement(node)) {
            break;
        }
        node = parents[i];
    }
    const comment = ts.getLeadingCommentRanges(ast.text, node.pos)
        ?.reverse()
        .find(range => range.kind === 3);
    if (comment) {
        return {
            node,
            start: comment.pos,
            end: comment.end,
        };
    }
}
//# sourceMappingURL=utils.js.map