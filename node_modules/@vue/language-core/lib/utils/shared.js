"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hyphenateTag = void 0;
exports.hyphenateAttr = hyphenateAttr;
exports.normalizeAttributeValue = normalizeAttributeValue;
exports.getElementTagOffsets = getElementTagOffsets;
exports.getStartEnd = getStartEnd;
exports.getNodeText = getNodeText;
const shared_1 = require("@vue/shared");
const shared_2 = require("@vue/shared");
Object.defineProperty(exports, "hyphenateTag", { enumerable: true, get: function () { return shared_2.hyphenate; } });
function hyphenateAttr(str) {
    let hyphencase = (0, shared_1.hyphenate)(str);
    // fix https://github.com/vuejs/core/issues/8811
    if (str.length && str[0] !== str[0].toLowerCase()) {
        hyphencase = '-' + hyphencase;
    }
    return hyphencase;
}
function normalizeAttributeValue(node) {
    const { source, start } = node.loc;
    if ((source.startsWith('"') && source.endsWith('"'))
        || (source.startsWith("'") && source.endsWith("'"))) {
        return [source.slice(1, -1), start.offset + 1];
    }
    return [source, start.offset];
}
function getElementTagOffsets(node, template) {
    const tagOffsets = [
        template.content.indexOf(node.tag, node.loc.start.offset),
    ];
    if (!node.isSelfClosing && template.lang === 'html') {
        const endTagOffset = node.loc.start.offset + node.loc.source.lastIndexOf(node.tag);
        if (endTagOffset > tagOffsets[0]) {
            tagOffsets.push(endTagOffset);
        }
    }
    return tagOffsets;
}
function getStartEnd(ts, node, ast) {
    return {
        node,
        start: ts.getTokenPosOfNode(node, ast),
        end: node.end,
    };
}
function getNodeText(ts, node, ast) {
    const { start, end } = getStartEnd(ts, node, ast);
    return ast.text.slice(start, end);
}
//# sourceMappingURL=shared.js.map