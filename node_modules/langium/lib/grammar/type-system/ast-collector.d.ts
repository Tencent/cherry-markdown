/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { type Grammar } from '../../languages/generated/ast.js';
import { type LangiumCoreServices } from '../../services.js';
import type { ValidationAstTypes } from './type-collector/all-types.js';
import type { PlainAstTypes } from './type-collector/plain-types.js';
import type { AstTypes } from './type-collector/types.js';
/**
 * Collects all types for the generated AST. The types collector entry point.
 *
 * @param grammars All grammars involved in the type generation process
 * @param config some optional configurations
 */
export declare function collectAst(grammars: Grammar | Grammar[], config?: {
    /** Langium core services to resolve imports as needed, and to pass along JSDoc comments to the generated AST */
    services?: LangiumCoreServices;
    filterNonAstTypeUnions?: boolean;
}): AstTypes;
/**
 * Collects all types used during the validation process.
 * The validation process requires us to compare our inferred types with our declared types.
 *
 * @param grammars All grammars involved in the validation process
 * @param services Langium core services to resolve imports as needed, and to pass along JSDoc comments to the generated AST
 */
export declare function collectValidationAst(grammars: Grammar | Grammar[], services?: LangiumCoreServices): ValidationAstTypes;
export declare function createAstTypes(first: PlainAstTypes, second?: PlainAstTypes): AstTypes;
export declare function specifyAstNodeProperties(astTypes: AstTypes): void;
//# sourceMappingURL=ast-collector.d.ts.map