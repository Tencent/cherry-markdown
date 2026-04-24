/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { ParserRule, Interface, Type, Grammar, InfixRule } from '../../../languages/generated/ast.js';
import type { URI } from '../../../utils/uri-utils.js';
import type { LangiumCoreServices } from '../../../index.js';
import type { PlainAstTypes } from './plain-types.js';
import type { AstTypes } from './types.js';
export interface AstResources {
    parserRules: ParserRule[];
    infixRules: InfixRule[];
    datatypeRules: ParserRule[];
    interfaces: Interface[];
    types: Type[];
}
export interface TypeResources {
    inferred: PlainAstTypes;
    declared: PlainAstTypes;
    astResources: AstResources;
}
export interface ValidationAstTypes {
    inferred: AstTypes;
    declared: AstTypes;
    astResources: AstResources;
}
export declare function collectTypeResources(grammars: Grammar | Grammar[], services?: LangiumCoreServices): TypeResources;
export declare function collectAllAstResources(grammars: Grammar | Grammar[], visited?: Set<URI>, astResources?: AstResources, services?: LangiumCoreServices): AstResources;
//# sourceMappingURL=all-types.d.ts.map