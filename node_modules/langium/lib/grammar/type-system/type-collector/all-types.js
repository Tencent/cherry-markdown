/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { collectInferredTypes } from './inferred-types.js';
import { collectDeclaredTypes } from './declared-types.js';
import { getDocument } from '../../../utils/ast-utils.js';
import { isInfixRule, isParserRule } from '../../../languages/generated/ast.js';
import { resolveImport } from '../../internal-grammar-util.js';
import { isDataTypeRule } from '../../../utils/grammar-utils.js';
export function collectTypeResources(grammars, services) {
    const astResources = collectAllAstResources(grammars, undefined, undefined, services);
    const declared = collectDeclaredTypes(astResources.interfaces, astResources.types, services);
    const inferred = collectInferredTypes(astResources.parserRules, astResources.datatypeRules, astResources.infixRules, declared, services);
    return {
        astResources,
        inferred,
        declared
    };
}
///////////////////////////////////////////////////////////////////////////////
export function collectAllAstResources(grammars, visited = new Set(), astResources = { parserRules: [], infixRules: [], datatypeRules: [], interfaces: [], types: [] }, services) {
    if (!Array.isArray(grammars))
        grammars = [grammars];
    for (const grammar of grammars) {
        const doc = getDocument(grammar);
        if (visited.has(doc.uri)) {
            continue;
        }
        visited.add(doc.uri);
        for (const rule of grammar.rules) {
            if (isParserRule(rule) && !rule.fragment) {
                if (isDataTypeRule(rule)) {
                    astResources.datatypeRules.push(rule);
                }
                else {
                    astResources.parserRules.push(rule);
                }
            }
            else if (isInfixRule(rule)) {
                astResources.infixRules.push(rule);
            }
        }
        grammar.interfaces.forEach(e => astResources.interfaces.push(e));
        grammar.types.forEach(e => astResources.types.push(e));
        const documents = services?.shared.workspace.LangiumDocuments;
        if (documents) {
            const importedGrammars = grammar.imports.map(e => resolveImport(documents, e)).filter(e => e !== undefined);
            collectAllAstResources(importedGrammars, visited, astResources, services);
        }
    }
    return astResources;
}
//# sourceMappingURL=all-types.js.map