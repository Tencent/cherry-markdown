"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueEmbeddedCode = void 0;
exports.useEmbeddedCodes = useEmbeddedCodes;
const alien_signals_1 = require("alien-signals");
const muggle_string_1 = require("muggle-string");
const buildMappings_1 = require("../utils/buildMappings");
class VueEmbeddedCode {
    id;
    lang;
    content;
    parentCodeId;
    linkedCodeMappings = [];
    embeddedCodes = [];
    constructor(id, lang, content) {
        this.id = id;
        this.lang = lang;
        this.content = content;
    }
}
exports.VueEmbeddedCode = VueEmbeddedCode;
function useEmbeddedCodes(plugins, fileName, sfc) {
    const getNameToBlockMap = (0, alien_signals_1.computed)(() => {
        const blocks = {};
        if (sfc.template) {
            blocks[sfc.template.name] = sfc.template;
        }
        if (sfc.script) {
            blocks[sfc.script.name] = sfc.script;
        }
        if (sfc.scriptSetup) {
            blocks[sfc.scriptSetup.name] = sfc.scriptSetup;
        }
        for (const block of sfc.styles) {
            blocks[block.name] = block;
        }
        for (const block of sfc.customBlocks) {
            blocks[block.name] = block;
        }
        return blocks;
    });
    const pluginsResult = plugins.map(useEmbeddedCodesForPlugin);
    return (0, alien_signals_1.computed)(() => {
        const result = [];
        const idToCodeMap = new Map();
        const virtualCodes = pluginsResult
            .map(getPluginResult => getPluginResult())
            .flat()
            .map(({ code, snapshot, mappings }) => {
            const virtualCode = {
                id: code.id,
                languageId: resolveCommonLanguageId(code.lang),
                linkedCodeMappings: code.linkedCodeMappings,
                snapshot,
                mappings,
                embeddedCodes: [],
            };
            idToCodeMap.set(code.id, virtualCode);
            return [code.parentCodeId, virtualCode];
        });
        for (const [parentCodeId, virtualCode] of virtualCodes) {
            if (!parentCodeId) {
                result.push(virtualCode);
                continue;
            }
            const parent = idToCodeMap.get(parentCodeId);
            if (parent) {
                parent.embeddedCodes ??= [];
                parent.embeddedCodes.push(virtualCode);
            }
            else {
                result.push(virtualCode);
            }
        }
        return result;
    });
    function useEmbeddedCodesForPlugin(plugin) {
        const getMap = (0, alien_signals_1.computed)(prevMap => {
            if (!plugin.getEmbeddedCodes) {
                return new Map();
            }
            const newCodeList = plugin.getEmbeddedCodes(fileName, sfc);
            const map = new Map();
            for (const { id, lang } of newCodeList) {
                const key = id + '__' + lang;
                if (prevMap?.has(key)) {
                    map.set(key, prevMap.get(key));
                }
                else {
                    map.set(key, useEmbeddedCode(id, lang));
                }
            }
            return map;
        });
        return (0, alien_signals_1.computed)(() => {
            const result = [];
            for (const generate of getMap().values()) {
                const { code, snapshot } = generate();
                result.push({
                    code,
                    snapshot,
                    mappings: getMappingsForCode(code),
                });
            }
            return result;
        });
    }
    function useEmbeddedCode(id, lang) {
        return (0, alien_signals_1.computed)(() => {
            const content = [];
            const code = new VueEmbeddedCode(id, lang, content);
            for (const plugin of plugins) {
                if (!plugin.resolveEmbeddedCode) {
                    continue;
                }
                try {
                    plugin.resolveEmbeddedCode(fileName, sfc, code);
                }
                catch (e) {
                    console.error(e);
                }
            }
            const newText = (0, muggle_string_1.toString)(code.content);
            const changeRanges = new Map();
            const snapshot = {
                getText: (start, end) => newText.slice(start, end),
                getLength: () => newText.length,
                getChangeRange(oldSnapshot) {
                    if (!changeRanges.has(oldSnapshot)) {
                        changeRanges.set(oldSnapshot, undefined);
                        const oldText = oldSnapshot.getText(0, oldSnapshot.getLength());
                        const changeRange = fullDiffTextChangeRange(oldText, newText);
                        if (changeRange) {
                            changeRanges.set(oldSnapshot, changeRange);
                        }
                    }
                    return changeRanges.get(oldSnapshot);
                },
            };
            return {
                code,
                snapshot,
            };
        });
    }
    function getMappingsForCode(code) {
        const mappings = (0, buildMappings_1.buildMappings)(code.content.map(segment => {
            if (typeof segment === 'string') {
                return segment;
            }
            const source = segment[1];
            if (source === undefined) {
                return segment;
            }
            const block = getNameToBlockMap()[source];
            if (!block) {
                return segment;
            }
            return [
                segment[0],
                undefined,
                segment[2] + block.startTagEnd,
                segment[3],
            ];
        }));
        const newMappings = [];
        const tokenMappings = new Map();
        for (let i = 0; i < mappings.length; i++) {
            const mapping = mappings[i];
            if (mapping.data.__combineToken !== undefined) {
                const token = mapping.data.__combineToken;
                if (tokenMappings.has(token)) {
                    const offsetMapping = tokenMappings.get(token);
                    offsetMapping.sourceOffsets.push(...mapping.sourceOffsets);
                    offsetMapping.generatedOffsets.push(...mapping.generatedOffsets);
                    offsetMapping.lengths.push(...mapping.lengths);
                }
                else {
                    tokenMappings.set(token, mapping);
                    newMappings.push(mapping);
                }
                continue;
            }
            if (mapping.data.__linkedToken !== undefined) {
                const token = mapping.data.__linkedToken;
                if (tokenMappings.has(token)) {
                    const prevMapping = tokenMappings.get(token);
                    code.linkedCodeMappings.push({
                        sourceOffsets: [prevMapping.generatedOffsets[0]],
                        generatedOffsets: [mapping.generatedOffsets[0]],
                        lengths: [Number(token.description)],
                        data: undefined,
                    });
                }
                else {
                    tokenMappings.set(token, mapping);
                }
                continue;
            }
            newMappings.push(mapping);
        }
        return newMappings;
    }
}
function fullDiffTextChangeRange(oldText, newText) {
    for (let start = 0; start < oldText.length && start < newText.length; start++) {
        if (oldText[start] !== newText[start]) {
            let end = oldText.length;
            for (let i = 0; i < oldText.length - start && i < newText.length - start; i++) {
                if (oldText[oldText.length - i - 1] !== newText[newText.length - i - 1]) {
                    break;
                }
                end--;
            }
            let length = end - start;
            let newLength = length + (newText.length - oldText.length);
            if (newLength < 0) {
                length -= newLength;
                newLength = 0;
            }
            return {
                span: { start, length },
                newLength,
            };
        }
    }
}
function resolveCommonLanguageId(lang) {
    switch (lang) {
        case 'js':
            return 'javascript';
        case 'cjs':
            return 'javascript';
        case 'mjs':
            return 'javascript';
        case 'ts':
            return 'typescript';
        case 'cts':
            return 'typescript';
        case 'mts':
            return 'typescript';
        case 'jsx':
            return 'javascriptreact';
        case 'tsx':
            return 'typescriptreact';
        case 'pug':
            return 'jade';
        case 'md':
            return 'markdown';
    }
    return lang;
}
//# sourceMappingURL=embeddedCodes.js.map