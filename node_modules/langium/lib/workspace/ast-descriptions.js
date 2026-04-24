/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { CancellationToken } from '../utils/cancellation.js';
import { isMultiReference, isReference } from '../syntax-tree.js';
import { getDocument, streamAst, streamReferences } from '../utils/ast-utils.js';
import { toDocumentSegment } from '../utils/cst-utils.js';
import { interruptAndCheck } from '../utils/promise-utils.js';
import { UriUtils } from '../utils/uri-utils.js';
export class DefaultAstNodeDescriptionProvider {
    constructor(services) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.nameProvider = services.references.NameProvider;
    }
    createDescription(node, name, document) {
        const doc = document ?? getDocument(node);
        name ?? (name = this.nameProvider.getName(node));
        const path = this.astNodeLocator.getAstNodePath(node);
        if (!name) {
            throw new Error(`Node at path ${path} has no name.`);
        }
        let nameNodeSegment;
        const nameSegmentGetter = () => nameNodeSegment ?? (nameNodeSegment = toDocumentSegment(this.nameProvider.getNameNode(node) ?? node.$cstNode));
        return {
            node,
            name,
            get nameSegment() {
                return nameSegmentGetter();
            },
            selectionSegment: toDocumentSegment(node.$cstNode),
            type: node.$type,
            documentUri: doc.uri,
            path
        };
    }
}
export class DefaultReferenceDescriptionProvider {
    constructor(services) {
        this.nodeLocator = services.workspace.AstNodeLocator;
    }
    async createDescriptions(document, cancelToken = CancellationToken.None) {
        const descr = [];
        const rootNode = document.parseResult.value;
        for (const astNode of streamAst(rootNode)) {
            await interruptAndCheck(cancelToken);
            streamReferences(astNode).forEach(refInfo => {
                if (!refInfo.reference.error) {
                    descr.push(...this.createInfoDescriptions(refInfo));
                }
            });
        }
        return descr;
    }
    createInfoDescriptions(refInfo) {
        const reference = refInfo.reference;
        if (reference.error || !reference.$refNode) {
            return [];
        }
        let items = [];
        if (isReference(reference) && reference.$nodeDescription) {
            items = [reference.$nodeDescription];
        }
        else if (isMultiReference(reference)) {
            items = reference.items.map(e => e.$nodeDescription).filter(e => e !== undefined);
        }
        const sourceUri = getDocument(refInfo.container).uri;
        const sourcePath = this.nodeLocator.getAstNodePath(refInfo.container);
        const descriptions = [];
        const segment = toDocumentSegment(reference.$refNode);
        for (const item of items) {
            descriptions.push({
                sourceUri,
                sourcePath,
                targetUri: item.documentUri,
                targetPath: item.path,
                segment,
                local: UriUtils.equals(item.documentUri, sourceUri)
            });
        }
        return descriptions;
    }
}
//# sourceMappingURL=ast-descriptions.js.map