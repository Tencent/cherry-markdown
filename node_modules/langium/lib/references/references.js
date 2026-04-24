/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { findAssignment } from '../utils/grammar-utils.js';
import { isMultiReference, isReference } from '../syntax-tree.js';
import { getDocument, getReferenceNodes, streamAst, streamReferences } from '../utils/ast-utils.js';
import { isChildNode, toDocumentSegment } from '../utils/cst-utils.js';
import { stream } from '../utils/stream.js';
import { UriUtils } from '../utils/uri-utils.js';
import { isCrossReference } from '../languages/generated/ast.js';
export class DefaultReferences {
    constructor(services) {
        this.nameProvider = services.references.NameProvider;
        this.index = services.shared.workspace.IndexManager;
        this.nodeLocator = services.workspace.AstNodeLocator;
        this.documents = services.shared.workspace.LangiumDocuments;
        this.hasMultiReference = streamAst(services.Grammar).some(node => isCrossReference(node) && node.isMulti);
    }
    findDeclarations(sourceCstNode) {
        if (sourceCstNode) {
            const assignment = findAssignment(sourceCstNode);
            const nodeElem = sourceCstNode.astNode;
            if (assignment && nodeElem) {
                const reference = nodeElem[assignment.feature];
                if (isReference(reference) || isMultiReference(reference)) {
                    return getReferenceNodes(reference);
                }
                else if (Array.isArray(reference)) {
                    for (const ref of reference) {
                        if ((isReference(ref) || isMultiReference(ref)) && ref.$refNode
                            && ref.$refNode.offset <= sourceCstNode.offset
                            && ref.$refNode.end >= sourceCstNode.end) {
                            return getReferenceNodes(ref);
                        }
                    }
                }
            }
            if (nodeElem) {
                const nameNode = this.nameProvider.getNameNode(nodeElem);
                // Only return the targeted node in case the targeted cst node is the name node or part of it
                if (nameNode && (nameNode === sourceCstNode || isChildNode(sourceCstNode, nameNode))) {
                    return this.getSelfNodes(nodeElem);
                }
            }
        }
        return [];
    }
    /**
     * Returns all self-references for the specified node.
     * Since the node can be part of a multi-reference, this method returns all nodes that are part of the same multi-reference.
     */
    getSelfNodes(node) {
        if (!this.hasMultiReference) {
            return [node];
        }
        else {
            // In order to find all nodes that are part of the same multi-reference,
            // we need to find a reference that points to the node.
            // It will also point to the logical siblings of the node.
            const references = this.index.findAllReferences(node, this.nodeLocator.getAstNodePath(node));
            // We can simply use the first reference to find all logical siblings.
            // Looking through all references is not necessary and very inefficient.
            const headNode = this.getNodeFromReferenceDescription(references.head());
            if (headNode) {
                // We need to iterate over all references to find the one that points to the node.
                for (const ref of streamReferences(headNode)) {
                    if (isMultiReference(ref.reference) && ref.reference.items.some(item => item.ref === node)) {
                        // Once we found the reference, simply return all items of the multi-reference.
                        return ref.reference.items.map(item => item.ref);
                    }
                }
            }
            return [node];
        }
    }
    getNodeFromReferenceDescription(ref) {
        if (!ref) {
            return undefined;
        }
        const doc = this.documents.getDocument(ref.sourceUri);
        if (doc) {
            return this.nodeLocator.getAstNode(doc.parseResult.value, ref.sourcePath);
        }
        return undefined;
    }
    findDeclarationNodes(sourceCstNode) {
        const astNodes = this.findDeclarations(sourceCstNode);
        const cstNodes = [];
        for (const astNode of astNodes) {
            const cstNode = this.nameProvider.getNameNode(astNode) ?? astNode.$cstNode;
            if (cstNode) {
                cstNodes.push(cstNode);
            }
        }
        return cstNodes;
    }
    findReferences(targetNode, options) {
        const refs = [];
        if (options.includeDeclaration) {
            refs.push(...this.getSelfReferences(targetNode));
        }
        let indexReferences = this.index.findAllReferences(targetNode, this.nodeLocator.getAstNodePath(targetNode));
        if (options.documentUri) {
            indexReferences = indexReferences.filter(ref => UriUtils.equals(ref.sourceUri, options.documentUri));
        }
        refs.push(...indexReferences);
        return stream(refs);
    }
    getSelfReferences(targetNode) {
        const selfNodes = this.getSelfNodes(targetNode);
        const references = [];
        for (const selfNode of selfNodes) {
            const nameNode = this.nameProvider.getNameNode(selfNode);
            if (nameNode) {
                const doc = getDocument(selfNode);
                const path = this.nodeLocator.getAstNodePath(selfNode);
                references.push({
                    sourceUri: doc.uri,
                    sourcePath: path,
                    targetUri: doc.uri,
                    targetPath: path,
                    segment: toDocumentSegment(nameNode),
                    local: true
                });
            }
        }
        return references;
    }
}
//# sourceMappingURL=references.js.map