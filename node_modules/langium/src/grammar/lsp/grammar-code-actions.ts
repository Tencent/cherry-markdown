/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { Diagnostic } from 'vscode-languageserver';
import { CodeActionKind } from 'vscode-languageserver';
import type { CodeActionParams } from 'vscode-languageserver-protocol';
import type { CodeAction, Command, Position } from 'vscode-languageserver-types';
import * as ast from '../../languages/generated/ast.js';
import type { CodeActionProvider } from '../../lsp/code-action.js';
import type { LangiumServices } from '../../lsp/lsp-services.js';
import type { AstReflection, Reference, ReferenceInfo } from '../../syntax-tree.js';
import { getContainerOfType } from '../../utils/ast-utils.js';
import { findLeafNodeAtOffset } from '../../utils/cst-utils.js';
import type { MaybePromise } from '../../utils/promise-utils.js';
import { escapeRegExp } from '../../utils/regexp-utils.js';
import type { URI } from '../../utils/uri-utils.js';
import { UriUtils } from '../../utils/uri-utils.js';
import type { LinkingErrorData } from '../../validation/document-validator.js';
import { DocumentValidator } from '../../validation/document-validator.js';
import type { DiagnosticData } from '../../validation/validation-registry.js';
import type { LangiumDocument } from '../../workspace/documents.js';
import type { IndexManager } from '../../workspace/index-manager.js';
import { IssueCodes } from '../validation/validator.js';

export class LangiumGrammarCodeActionProvider implements CodeActionProvider {

    protected readonly reflection: AstReflection;
    protected readonly indexManager: IndexManager;

    constructor(services: LangiumServices) {
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;
    }

    getCodeActions(document: LangiumDocument<ast.Grammar>, params: CodeActionParams): MaybePromise<Array<Command | CodeAction>> {
        const result: CodeAction[] = [];
        const acceptor = (ca: CodeAction | undefined) => ca && result.push(ca);
        for (const diagnostic of params.context.diagnostics) {
            this.createCodeActions(diagnostic, document, acceptor);
        }
        return result;
    }

    private createCodeActions(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>, accept: (ca: CodeAction | undefined) => void): void {
        switch ((diagnostic.data as DiagnosticData)?.code) {
            case IssueCodes.GrammarNameUppercase:
            case IssueCodes.RuleNameUppercase:
                accept(this.makeUpperCase(diagnostic, document));
                break;
            case IssueCodes.UseRegexTokens:
                accept(this.fixRegexTokens(diagnostic, document));
                break;
            case IssueCodes.EntryRuleTokenSyntax:
                accept(this.addEntryKeyword(diagnostic, document));
                break;
            case IssueCodes.CrossRefTokenSyntax:
                accept(this.fixCrossRefSyntax(diagnostic, document));
                break;
            case IssueCodes.ParserRuleToTypeDecl:
                accept(this.replaceParserRuleByTypeDeclaration(diagnostic, document));
                break;
            case IssueCodes.UnnecessaryFileExtension:
                accept(this.fixUnnecessaryFileExtension(diagnostic, document));
                break;
            case IssueCodes.MissingReturns:
                accept(this.fixMissingReturns(diagnostic, document));
                break;
            case IssueCodes.InvalidInfers:
            case IssueCodes.InvalidReturns:
                accept(this.fixInvalidReturnsInfers(diagnostic, document));
                break;
            case IssueCodes.MissingInfer:
                accept(this.fixMissingInfer(diagnostic, document));
                break;
            case IssueCodes.MissingCrossRefTerminal:
                accept(this.fixMissingCrossRefTerminal(diagnostic, document));
                break;
            case IssueCodes.SuperfluousInfer:
                accept(this.fixSuperfluousInfer(diagnostic, document));
                break;
            case DocumentValidator.LinkingError: {
                const data = diagnostic.data as LinkingErrorData;
                if (data && data.containerType === 'RuleCall' && data.property === 'rule') {
                    accept(this.addNewRule(diagnostic, data, document));
                }
                if (data) {
                    this.lookInGlobalScope(diagnostic, data, document).forEach(accept);
                }
                break;
            }
        }
        return undefined;
    }

    /**
     * Adds missing returns for parser rule
     */
    private fixMissingReturns(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const text = document.textDocument.getText(diagnostic.range);
        if (text) {
            return {
                title: `Add explicit return type for parser rule ${text}`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: diagnostic.range,
                            newText: `${text} returns ${text}` // suggestion adds missing 'return'
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixInvalidReturnsInfers(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const data = diagnostic.data as DiagnosticData;
        if (data && data.actionSegment) {
            const text = document.textDocument.getText(data.actionSegment.range);
            return {
                title: `Correct ${text} usage`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: data.actionSegment.range,
                            newText: text === 'infers' ? 'returns' : 'infers'
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixMissingInfer(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const data = diagnostic.data as DiagnosticData;
        if (data && data.actionSegment) {
            return {
                title: "Correct 'infer' usage",
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {
                                start: data.actionSegment.range.end,
                                end: data.actionSegment.range.end
                            },
                            newText: 'infer '
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixMissingCrossRefTerminal(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const grammar = document.parseResult.value;
        const idTerminal = grammar.rules.find(rule => ast.isTerminalRule(rule) && rule.name === 'ID');
        if (idTerminal) {
            return {
                title: 'Use ID token to resolve cross-reference',
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {
                                start: diagnostic.range.end,
                                end: diagnostic.range.end
                            },
                            newText: ':ID'
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixSuperfluousInfer(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const data = diagnostic.data as DiagnosticData;
        if (data && data.actionRange) {
            return {
                title: "Remove the 'infer' keyword",
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: data.actionRange,
                            newText: ''
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private isRuleReplaceable(rule: ast.ParserRule): boolean {
        /** at the moment, only "pure" parser rules are supported:
         * - supported are only Alternatives (recursively) and "infers"
         * - "returns" is not relevant, since cross-references would not refer to the parser rule, but to its "return type" instead
         */
        return !rule.fragment && !rule.entry && rule.parameters.length === 0 && !rule.returnType && !rule.dataType;
    }
    private replaceRule(rule: ast.ParserRule): string {
        const type = rule.inferredType ?? rule;
        return type.name;
    }
    private isDefinitionReplaceable(node: ast.AbstractElement): boolean {
        if (ast.isRuleCall(node)) {
            return node.arguments.length === 0 && ast.isParserRule(node.rule.ref) && this.isRuleReplaceable(node.rule.ref);
        }
        if (ast.isAlternatives(node)) {
            return node.elements.every(child => this.isDefinitionReplaceable(child));
        }
        return false;
    }
    private replaceDefinition(node: ast.AbstractElement): string {
        if (ast.isRuleCall(node) && node.rule.ref) {
            return node.rule.ref.name;
        }
        if (ast.isAlternatives(node)) {
            return node.elements.map(child => this.replaceDefinition(child)).join(' | ');
        }
        throw new Error('missing code for ' + node);
    }

    private replaceParserRuleByTypeDeclaration(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const rootCst = document.parseResult.value.$cstNode;
        if (rootCst) {
            const offset = document.textDocument.offsetAt(diagnostic.range.start);
            const cstNode = findLeafNodeAtOffset(rootCst, offset);
            const rule = getContainerOfType(cstNode?.astNode, ast.isParserRule);
            if (rule && rule.$cstNode) {
                const isReplaceable = this.isRuleReplaceable(rule) && this.isDefinitionReplaceable(rule.definition);
                if (isReplaceable) {
                    const newText = `type ${this.replaceRule(rule)} = ${this.replaceDefinition(rule.definition)};`;
                    return {
                        title: 'Replace with type declaration',
                        kind: CodeActionKind.QuickFix,
                        diagnostics: [diagnostic],
                        isPreferred: true,
                        edit: {
                            changes: {
                                [document.textDocument.uri]: [{
                                    range: diagnostic.range,
                                    newText
                                }]
                            }
                        }
                    };
                }
            }
        }
        return undefined;
    }

    private fixUnnecessaryFileExtension(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction {
        const end = {...diagnostic.range.end};
        end.character -= 1;
        const start = {...end};
        start.character -= '.langium'.length;
        return {
            title: 'Remove file extension',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: {
                changes: {
                    [document.textDocument.uri]: [{
                        range: {
                            start,
                            end
                        },
                        newText: ''
                    }]
                }
            }
        };
    }

    private makeUpperCase(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction {
        const range = {
            start: diagnostic.range.start,
            end: {
                line: diagnostic.range.start.line,
                character: diagnostic.range.start.character + 1
            }
        };
        return {
            title: 'First letter to upper case',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: {
                changes: {
                    [document.textDocument.uri]: [{
                        range,
                        newText: document.textDocument.getText(range).toUpperCase()
                    }]
                }
            }
        };
    }

    private addEntryKeyword(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        return {
            title: 'Add entry keyword',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: {
                changes: {
                    [document.textDocument.uri]: [{
                        range: {start: diagnostic.range.start, end: diagnostic.range.start},
                        newText: 'entry '
                    }]
                }
            }
        };
    }

    private fixRegexTokens(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const offset = document.textDocument.offsetAt(diagnostic.range.start);
        const rootCst = document.parseResult.value.$cstNode;
        if (rootCst) {
            const cstNode = findLeafNodeAtOffset(rootCst, offset);
            const container = getContainerOfType(cstNode?.astNode, ast.isCharacterRange);
            if (container && container.right && container.$cstNode) {
                const left = container.left.value;
                const right = container.right.value;
                return {
                    title: 'Refactor into regular expression',
                    kind: CodeActionKind.QuickFix,
                    diagnostics: [diagnostic],
                    isPreferred: true,
                    edit: {
                        changes: {
                            [document.textDocument.uri]: [{
                                range: container.$cstNode.range,
                                newText: `/[${escapeRegExp(left)}-${escapeRegExp(right)}]/`
                            }]
                        }
                    }
                };
            }
        }
        return undefined;
    }

    private fixCrossRefSyntax(diagnostic: Diagnostic, document: LangiumDocument<ast.Grammar>): CodeAction {
        return {
            title: "Replace '|' with ':'",
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: {
                changes: {
                    [document.textDocument.uri]: [{
                        range: diagnostic.range,
                        newText: ':'
                    }]
                }
            }
        };
    }

    private addNewRule(diagnostic: Diagnostic, data: LinkingErrorData, document: LangiumDocument<ast.Grammar>): CodeAction | undefined {
        const offset = document.textDocument.offsetAt(diagnostic.range.start);
        const rootCst = document.parseResult.value.$cstNode;
        if (rootCst) {
            const cstNode = findLeafNodeAtOffset(rootCst, offset);
            const container = getContainerOfType(cstNode?.astNode, ast.isParserRule);
            if (container && container.$cstNode) {
                return {
                    title: `Add new rule '${data.refText}'`,
                    kind: CodeActionKind.QuickFix,
                    diagnostics: [diagnostic],
                    isPreferred: false,
                    edit: {
                        changes: {
                            [document.textDocument.uri]: [{
                                range: {
                                    start: container.$cstNode.range.end,
                                    end: container.$cstNode.range.end
                                },
                                newText: '\n\n' + data.refText + ':\n    /* TODO implement rule */ {infer ' + data.refText + '};'
                            }]
                        }
                    }
                };
            }
        }
        return undefined;
    }

    private lookInGlobalScope(diagnostic: Diagnostic, data: LinkingErrorData, document: LangiumDocument<ast.Grammar>): CodeAction[] {
        const refInfo: ReferenceInfo = {
            container: {
                $type: data.containerType
            },
            property: data.property,
            reference: {
                $refText: data.refText
            } as Reference
        };
        const referenceType = this.reflection.getReferenceType(refInfo);
        const candidates = this.indexManager.allElements(referenceType).filter(e => e.name === data.refText);

        const result: CodeAction[] = [];
        let shortestPathIndex = -1;
        let shortestPathLength = -1;
        for (const candidate of candidates) {
            if (UriUtils.equals(candidate.documentUri, document.uri)) {
                continue;
            }
            // Find an import path and a position to insert the import
            const importPath = getRelativeImport(document.uri, candidate.documentUri);
            let position: Position | undefined;
            let suffix = '';
            const grammar = document.parseResult.value as ast.Grammar;
            const nextImport = grammar.imports.find(imp => imp.path && importPath < imp.path);
            if (nextImport) {
                // Insert the new import alphabetically
                position = nextImport.$cstNode?.range.start;
            } else if (grammar.imports.length > 0) {
                // Put the new import after the last import
                const rangeEnd = grammar.imports[grammar.imports.length - 1].$cstNode!.range.end;
                if (rangeEnd) {
                    position = { line: rangeEnd.line + 1, character: 0 };
                }
            } else if (grammar.rules.length > 0) {
                // Put the new import before the first rule
                position = grammar.rules[0].$cstNode?.range.start;
                suffix = '\n';
            }

            if (position) {
                if (shortestPathIndex < 0 || importPath.length < shortestPathLength) {
                    shortestPathIndex = result.length;
                    shortestPathLength = importPath.length;
                }
                // Add an import declaration for the candidate in the global scope
                result.push({
                    title: `Add import to '${importPath}'`,
                    kind: CodeActionKind.QuickFix,
                    diagnostics: [diagnostic],
                    isPreferred: false,
                    edit: {
                        changes: {
                            [document.textDocument.uri]: [{
                                range: {
                                    start: position,
                                    end: position
                                },
                                newText: `import '${importPath}'\n${suffix}`
                            }]
                        }
                    }
                });
            }
        }

        // Mark the code action with the shortest import path as preferred
        if (shortestPathIndex >= 0) {
            result[shortestPathIndex].isPreferred = true;
        }
        return result;
    }

}

function getRelativeImport(source: URI, target: URI): string {
    const sourceDir = UriUtils.dirname(source);
    let relativePath = UriUtils.relative(sourceDir, target);
    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
        relativePath = './' + relativePath;
    }
    if (relativePath.endsWith('.langium')) {
        relativePath = relativePath.substring(0, relativePath.length - '.langium'.length);
    }
    return relativePath;
}
