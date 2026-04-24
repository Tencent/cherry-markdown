/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { URI } from 'vscode-uri';
import { isAstNode, isMultiReference, isReference } from '../syntax-tree.js';
import { getDocument } from '../utils/ast-utils.js';
import { findNodesForProperty } from '../utils/grammar-utils.js';
export function isAstNodeWithComment(node) {
    return typeof node.$comment === 'string';
}
function isIntermediateReference(obj) {
    return typeof obj === 'object' && !!obj && ('$ref' in obj || '$error' in obj);
}
export class DefaultJsonSerializer {
    constructor(services) {
        /** The set of AstNode properties to be ignored by the serializer. */
        this.ignoreProperties = new Set(['$container', '$containerProperty', '$containerIndex', '$document', '$cstNode']);
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.nameProvider = services.references.NameProvider;
        this.commentProvider = services.documentation.CommentProvider;
    }
    serialize(node, options) {
        const serializeOptions = options ?? {};
        const specificReplacer = options?.replacer;
        const defaultReplacer = (key, value) => this.replacer(key, value, serializeOptions);
        const replacer = specificReplacer ? (key, value) => specificReplacer(key, value, defaultReplacer) : defaultReplacer;
        try {
            this.currentDocument = getDocument(node);
            return JSON.stringify(node, replacer, options?.space);
        }
        finally {
            this.currentDocument = undefined;
        }
    }
    deserialize(content, options) {
        const deserializeOptions = options ?? {};
        const root = JSON.parse(content);
        this.linkNode(root, root, deserializeOptions);
        return root;
    }
    replacer(key, value, { refText, sourceText, textRegions, comments, uriConverter }) {
        if (this.ignoreProperties.has(key)) {
            return undefined;
        }
        else if (isReference(value)) {
            const refValue = value.ref;
            const $refText = refText ? value.$refText : undefined;
            if (refValue) {
                const targetDocument = getDocument(refValue);
                let targetUri = '';
                if (this.currentDocument && this.currentDocument !== targetDocument) {
                    if (uriConverter) {
                        targetUri = uriConverter(targetDocument.uri, refValue);
                    }
                    else {
                        targetUri = targetDocument.uri.toString();
                    }
                }
                const targetPath = this.astNodeLocator.getAstNodePath(refValue);
                return {
                    $ref: `${targetUri}#${targetPath}`,
                    $refText
                };
            }
            else {
                return {
                    $error: value.error?.message ?? 'Could not resolve reference',
                    $refText
                };
            }
        }
        else if (isMultiReference(value)) {
            const $refText = refText ? value.$refText : undefined;
            const $refs = [];
            for (const item of value.items) {
                const refValue = item.ref;
                const targetDocument = getDocument(item.ref);
                let targetUri = '';
                if (this.currentDocument && this.currentDocument !== targetDocument) {
                    if (uriConverter) {
                        targetUri = uriConverter(targetDocument.uri, refValue);
                    }
                    else {
                        targetUri = targetDocument.uri.toString();
                    }
                }
                const targetPath = this.astNodeLocator.getAstNodePath(refValue);
                $refs.push(`${targetUri}#${targetPath}`);
            }
            return {
                $refs,
                $refText
            };
        }
        else if (isAstNode(value)) {
            let astNode = undefined;
            if (textRegions) {
                astNode = this.addAstNodeRegionWithAssignmentsTo({ ...value });
                if ((!key || value.$document) && astNode?.$textRegion) {
                    // The document URI is added to the root node of the resulting JSON tree
                    astNode.$textRegion.documentURI = this.currentDocument?.uri.toString();
                }
            }
            if (sourceText && !key) {
                astNode ?? (astNode = { ...value });
                astNode.$sourceText = value.$cstNode?.text;
            }
            if (comments) {
                astNode ?? (astNode = { ...value });
                const comment = this.commentProvider.getComment(value);
                if (comment) {
                    astNode.$comment = comment.replace(/\r/g, '');
                }
            }
            return astNode ?? value;
        }
        else {
            return value;
        }
    }
    addAstNodeRegionWithAssignmentsTo(node) {
        const createDocumentSegment = cstNode => ({
            offset: cstNode.offset,
            end: cstNode.end,
            length: cstNode.length,
            range: cstNode.range,
        });
        if (node.$cstNode) {
            const textRegion = node.$textRegion = createDocumentSegment(node.$cstNode);
            const assignments = textRegion.assignments = {};
            Object.keys(node).filter(key => !key.startsWith('$')).forEach(key => {
                const propertyAssignments = findNodesForProperty(node.$cstNode, key).map(createDocumentSegment);
                if (propertyAssignments.length !== 0) {
                    assignments[key] = propertyAssignments;
                }
            });
            return node;
        }
        return undefined;
    }
    linkNode(node, root, options, container, containerProperty, containerIndex) {
        for (const [propertyName, item] of Object.entries(node)) {
            if (Array.isArray(item)) {
                for (let index = 0; index < item.length; index++) {
                    const element = item[index];
                    if (isIntermediateReference(element)) {
                        item[index] = this.reviveReference(node, propertyName, root, element, options);
                    }
                    else if (isAstNode(element)) {
                        this.linkNode(element, root, options, node, propertyName, index);
                    }
                }
            }
            else if (isIntermediateReference(item)) {
                node[propertyName] = this.reviveReference(node, propertyName, root, item, options);
            }
            else if (isAstNode(item)) {
                this.linkNode(item, root, options, node, propertyName);
            }
        }
        const mutable = node;
        mutable.$container = container;
        mutable.$containerProperty = containerProperty;
        mutable.$containerIndex = containerIndex;
    }
    reviveReference(container, property, root, reference, options) {
        let refText = reference.$refText;
        let error = reference.$error;
        let ref;
        if (reference.$ref) {
            const refNode = this.getRefNode(root, reference.$ref, options.uriConverter);
            if (isAstNode(refNode)) {
                if (!refText) {
                    refText = this.nameProvider.getName(refNode);
                }
                return {
                    $refText: refText ?? '',
                    ref: refNode
                };
            }
            else {
                error = refNode;
            }
        }
        else if (reference.$refs) {
            const refs = [];
            for (const refUri of reference.$refs) {
                const refNode = this.getRefNode(root, refUri, options.uriConverter);
                if (isAstNode(refNode)) {
                    refs.push({ ref: refNode });
                }
            }
            if (refs.length === 0) {
                ref = {
                    $refText: refText ?? '',
                    items: refs
                };
                error ?? (error = 'Could not resolve multi-reference');
            }
            else {
                return {
                    $refText: refText ?? '',
                    items: refs
                };
            }
        }
        if (error) {
            ref ?? (ref = {
                $refText: refText ?? '',
                ref: undefined
            });
            ref.error = {
                info: {
                    container,
                    property,
                    reference: ref
                },
                message: error
            };
            return ref;
        }
        else {
            return undefined;
        }
    }
    getRefNode(root, uri, uriConverter) {
        try {
            const fragmentIndex = uri.indexOf('#');
            if (fragmentIndex === 0) {
                const node = this.astNodeLocator.getAstNode(root, uri.substring(1));
                if (!node) {
                    return 'Could not resolve path: ' + uri;
                }
                return node;
            }
            if (fragmentIndex < 0) {
                const documentUri = uriConverter ? uriConverter(uri) : URI.parse(uri);
                const document = this.langiumDocuments.getDocument(documentUri);
                if (!document) {
                    return 'Could not find document for URI: ' + uri;
                }
                return document.parseResult.value;
            }
            const documentUri = uriConverter ? uriConverter(uri.substring(0, fragmentIndex)) : URI.parse(uri.substring(0, fragmentIndex));
            const document = this.langiumDocuments.getDocument(documentUri);
            if (!document) {
                return 'Could not find document for URI: ' + uri;
            }
            if (fragmentIndex === uri.length - 1) {
                return document.parseResult.value;
            }
            const node = this.astNodeLocator.getAstNode(document.parseResult.value, uri.substring(fragmentIndex + 1));
            if (!node) {
                return 'Could not resolve URI: ' + uri;
            }
            return node;
        }
        catch (err) {
            return String(err);
        }
    }
}
//# sourceMappingURL=json-serializer.js.map