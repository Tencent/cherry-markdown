"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifierRegex = exports.endOfLine = exports.newLine = void 0;
exports.getTypeScriptAST = getTypeScriptAST;
exports.generateSfcBlockSection = generateSfcBlockSection;
exports.forEachNode = forEachNode;
const codeFeatures_1 = require("../codeFeatures");
exports.newLine = `\n`;
exports.endOfLine = `;${exports.newLine}`;
exports.identifierRegex = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const cacheMaps = new Map();
function getTypeScriptAST(ts, block, text) {
    if (!cacheMaps.has(block)) {
        cacheMaps.set(block, [block.content, new Map()]);
    }
    const cacheMap = cacheMaps.get(block);
    if (cacheMap[0] !== block.content) {
        cacheMap[0] = block.content;
        for (const [key, info] of cacheMap[1]) {
            if (info[1]) {
                info[1] = 0;
            }
            else {
                cacheMap[1].delete(key);
            }
        }
    }
    const cache = cacheMap[1].get(text);
    if (cache) {
        cache[1]++;
        return cache[0];
    }
    const ast = ts.createSourceFile('/dummy.ts', text, 99);
    cacheMap[1].set(text, [ast, 1]);
    return ast;
}
function* generateSfcBlockSection(block, start, end, features) {
    const text = block.content.slice(start, end);
    yield [text, block.name, start, features];
    // #3632
    if ('parseDiagnostics' in block.ast) {
        const textEnd = text.trimEnd().length;
        for (const diag of block.ast.parseDiagnostics) {
            const diagStart = diag.start;
            const diagEnd = diag.start + diag.length;
            if (diagStart >= textEnd && diagEnd <= end) {
                yield `;`;
                yield ['', block.name, end, codeFeatures_1.codeFeatures.verification];
                yield exports.newLine;
                break;
            }
        }
    }
}
function* forEachNode(ts, node) {
    const children = [];
    ts.forEachChild(node, child => {
        children.push(child);
    });
    for (const child of children) {
        yield child;
    }
}
//# sourceMappingURL=index.js.map