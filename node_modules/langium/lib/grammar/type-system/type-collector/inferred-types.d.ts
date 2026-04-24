/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { ParserRule, InfixRule } from '../../../languages/generated/ast.js';
import type { PlainAstTypes } from './plain-types.js';
import type { LangiumCoreServices } from '../../../index.js';
export declare function collectInferredTypes(parserRules: ParserRule[], datatypeRules: ParserRule[], infixRules: InfixRule[], declared: PlainAstTypes, services?: LangiumCoreServices): PlainAstTypes;
//# sourceMappingURL=inferred-types.d.ts.map