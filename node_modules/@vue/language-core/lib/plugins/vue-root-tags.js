"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const muggle_string_1 = require("muggle-string");
const shared_1 = require("./shared");
const plugin = () => {
    return {
        version: 2.2,
        getEmbeddedCodes() {
            return [{
                    id: 'root_tags',
                    lang: 'vue-root-tags',
                }];
        },
        resolveEmbeddedCode(_fileName, sfc, embeddedFile) {
            if (embeddedFile.id === 'root_tags') {
                embeddedFile.content.push([sfc.content, undefined, 0, shared_1.allCodeFeatures]);
                for (const block of [
                    sfc.template,
                    sfc.script,
                    sfc.scriptSetup,
                    ...sfc.styles,
                    ...sfc.customBlocks,
                ]) {
                    if (!block) {
                        continue;
                    }
                    const offset = block.content.lastIndexOf('\n', block.content.lastIndexOf('\n') - 1) + 1;
                    // fix folding range end position failed to mapping
                    (0, muggle_string_1.replaceSourceRange)(embeddedFile.content, undefined, block.startTagEnd, block.endTagStart, sfc.content.slice(block.startTagEnd, block.startTagEnd + offset), [
                        '',
                        undefined,
                        block.startTagEnd + offset,
                        { structure: true },
                    ], sfc.content.slice(block.startTagEnd + offset, block.endTagStart));
                }
            }
            else {
                embeddedFile.parentCodeId ??= 'root_tags';
            }
        },
    };
};
exports.default = plugin;
//# sourceMappingURL=vue-root-tags.js.map