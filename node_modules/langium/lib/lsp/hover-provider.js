/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { findCommentNode, findDeclarationNodeAtOffset } from '../utils/cst-utils.js';
import { isKeyword } from '../languages/generated/ast.js';
import { isJSDoc, parseJSDoc } from '../documentation/jsdoc.js';
import { isAstNodeWithComment } from '../serializer/json-serializer.js';
export class AstNodeHoverProvider {
    constructor(services) {
        this.references = services.references.References;
        this.grammarConfig = services.parser.GrammarConfig;
    }
    async getHoverContent(document, params) {
        const rootNode = document.parseResult?.value?.$cstNode;
        if (rootNode) {
            const offset = document.textDocument.offsetAt(params.position);
            const cstNode = findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
            if (cstNode && cstNode.offset + cstNode.length > offset) {
                const contents = [];
                const targetNodes = this.references.findDeclarations(cstNode);
                for (const targetNode of targetNodes) {
                    const content = await this.getAstNodeHoverContent(targetNode);
                    if (typeof content === 'string') {
                        contents.push(content);
                    }
                }
                if (contents.length > 0) {
                    return {
                        contents: {
                            kind: 'markdown',
                            value: contents.join(' ')
                        }
                    };
                }
                // Add support for documentation on keywords
                if (isKeyword(cstNode.grammarSource)) {
                    return this.getKeywordHoverContent(cstNode.grammarSource);
                }
            }
        }
        return undefined;
    }
    getKeywordHoverContent(node) {
        let comment = isAstNodeWithComment(node) ? node.$comment : undefined;
        if (!comment) {
            comment = findCommentNode(node.$cstNode, ['ML_COMMENT'])?.text;
        }
        if (comment && isJSDoc(comment)) {
            const content = parseJSDoc(comment).toMarkdown();
            if (content) {
                return {
                    contents: {
                        kind: 'markdown',
                        value: content
                    }
                };
            }
        }
        return undefined;
    }
}
export class MultilineCommentHoverProvider extends AstNodeHoverProvider {
    constructor(services) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
    }
    getAstNodeHoverContent(node) {
        const content = this.documentationProvider.getDocumentation(node);
        if (content) {
            return content;
        }
        return undefined;
    }
}
//# sourceMappingURL=hover-provider.js.map