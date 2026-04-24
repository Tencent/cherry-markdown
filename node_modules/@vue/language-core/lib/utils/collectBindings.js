"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectBindingNames = collectBindingNames;
exports.collectBindingRanges = collectBindingRanges;
exports.collectBindingIdentifiers = collectBindingIdentifiers;
const shared_1 = require("./shared");
function collectBindingNames(ts, node, ast) {
    return collectBindingIdentifiers(ts, node).map(({ id }) => (0, shared_1.getNodeText)(ts, id, ast));
}
function collectBindingRanges(ts, node, ast) {
    return collectBindingIdentifiers(ts, node).map(({ id }) => (0, shared_1.getStartEnd)(ts, id, ast));
}
function collectBindingIdentifiers(ts, node, results = [], isRest = false, initializer = undefined) {
    if (ts.isIdentifier(node)) {
        results.push({ id: node, isRest, initializer });
    }
    else if (ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node)) {
        for (const el of node.elements) {
            if (ts.isBindingElement(el)) {
                collectBindingIdentifiers(ts, el.name, results, !!el.dotDotDotToken, el.initializer);
            }
        }
    }
    else {
        ts.forEachChild(node, node => collectBindingIdentifiers(ts, node, results, false));
    }
    return results;
}
//# sourceMappingURL=collectBindings.js.map