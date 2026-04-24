"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStyleScopedClasses = generateStyleScopedClasses;
const styleScopedClasses_1 = require("../template/styleScopedClasses");
const utils_1 = require("../utils");
const common_1 = require("./common");
function* generateStyleScopedClasses({ vueCompilerOptions, styles }) {
    const { resolveStyleClassNames, resolveStyleImports } = vueCompilerOptions;
    if (!resolveStyleClassNames) {
        return;
    }
    const scopedStyles = styles.filter(style => resolveStyleClassNames === true || style.scoped);
    if (!scopedStyles.length) {
        return;
    }
    const visited = new Set();
    const deferredGenerations = [];
    yield `type __VLS_StyleScopedClasses = {}`;
    for (const style of scopedStyles) {
        if (resolveStyleImports) {
            yield* (0, common_1.generateStyleImports)(style);
        }
        for (const className of style.classNames) {
            if (!visited.has(className.text)) {
                visited.add(className.text);
                yield* (0, common_1.generateClassProperty)(style.name, className.text, className.offset, 'boolean');
            }
            else {
                deferredGenerations.push((0, styleScopedClasses_1.generateStyleScopedClassReference)(style, className.text.slice(1), className.offset + 1));
            }
        }
    }
    yield utils_1.endOfLine;
    for (const generate of deferredGenerations) {
        yield* generate;
    }
}
//# sourceMappingURL=scopedClasses.js.map