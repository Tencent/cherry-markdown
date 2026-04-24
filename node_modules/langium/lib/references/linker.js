/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { CancellationToken } from '../utils/cancellation.js';
import { isAstNode, isAstNodeDescription, isLinkingError } from '../syntax-tree.js';
import { findRootNode, streamAst, streamReferences } from '../utils/ast-utils.js';
import { interruptAndCheck } from '../utils/promise-utils.js';
import { DocumentState } from '../workspace/documents.js';
export const RefResolving = Symbol('RefResolving');
export class DefaultLinker {
    constructor(services) {
        this.reflection = services.shared.AstReflection;
        this.langiumDocuments = () => services.shared.workspace.LangiumDocuments;
        this.scopeProvider = services.references.ScopeProvider;
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.profiler = services.shared.profilers.LangiumProfiler;
        this.languageId = services.LanguageMetaData.languageId;
    }
    async link(document, cancelToken = CancellationToken.None) {
        if (this.profiler?.isActive('linking')) {
            const task = this.profiler.createTask('linking', this.languageId);
            task.start();
            try {
                for (const node of streamAst(document.parseResult.value)) {
                    await interruptAndCheck(cancelToken);
                    streamReferences(node).forEach(ref => {
                        const name = `${node.$type}:${ref.property}`;
                        task.startSubTask(name);
                        try {
                            this.doLink(ref, document);
                        }
                        finally {
                            task.stopSubTask(name);
                        }
                    });
                }
            }
            finally {
                task.stop();
            }
        }
        else {
            for (const node of streamAst(document.parseResult.value)) {
                await interruptAndCheck(cancelToken);
                streamReferences(node).forEach(ref => this.doLink(ref, document));
            }
        }
    }
    doLink(refInfo, document) {
        const ref = refInfo.reference;
        // The reference may already have been resolved lazily by accessing its `ref` property.
        if ('_ref' in ref && ref._ref === undefined) {
            ref._ref = RefResolving;
            try {
                const description = this.getCandidate(refInfo);
                if (isLinkingError(description)) {
                    ref._ref = description;
                }
                else {
                    ref._nodeDescription = description;
                    const linkedNode = this.loadAstNode(description);
                    ref._ref = linkedNode ?? this.createLinkingError(refInfo, description);
                }
            }
            catch (err) {
                console.error(`An error occurred while resolving reference to '${ref.$refText}':`, err);
                const errorMessage = err.message ?? String(err);
                ref._ref = {
                    info: refInfo,
                    message: `An error occurred while resolving reference to '${ref.$refText}': ${errorMessage}`
                };
            }
            document.references.push(ref);
        }
        else if ('_items' in ref && ref._items === undefined) {
            ref._items = RefResolving;
            try {
                const descriptions = this.getCandidates(refInfo);
                const items = [];
                if (isLinkingError(descriptions)) {
                    ref._linkingError = descriptions;
                }
                else {
                    for (const description of descriptions) {
                        const linkedNode = this.loadAstNode(description);
                        if (linkedNode) {
                            items.push({ ref: linkedNode, $nodeDescription: description });
                        }
                    }
                }
                ref._items = items;
            }
            catch (err) {
                ref._linkingError = {
                    info: refInfo,
                    message: `An error occurred while resolving reference to '${ref.$refText}': ${err}`
                };
                ref._items = [];
            }
            document.references.push(ref);
        }
    }
    unlink(document) {
        for (const ref of document.references) {
            if ('_ref' in ref) {
                ref._ref = undefined;
                delete ref._nodeDescription;
            }
            else if ('_items' in ref) {
                ref._items = undefined;
                delete ref._linkingError;
            }
        }
        document.references = [];
    }
    getCandidate(refInfo) {
        const scope = this.scopeProvider.getScope(refInfo);
        const description = scope.getElement(refInfo.reference.$refText);
        return description ?? this.createLinkingError(refInfo);
    }
    getCandidates(refInfo) {
        const scope = this.scopeProvider.getScope(refInfo);
        const descriptions = scope.getElements(refInfo.reference.$refText).distinct(desc => `${desc.documentUri}#${desc.path}`).toArray();
        return descriptions.length > 0 ? descriptions : this.createLinkingError(refInfo);
    }
    buildReference(node, property, refNode, refText) {
        // See behavior description in doc of Linker, update that on changes in here.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const linker = this;
        const reference = {
            $refNode: refNode,
            $refText: refText,
            _ref: undefined,
            get ref() {
                if (isAstNode(this._ref)) {
                    // Most frequent case: the target is already resolved.
                    return this._ref;
                }
                else if (isAstNodeDescription(this._nodeDescription)) {
                    // A candidate has been found before, but it is not loaded yet.
                    const linkedNode = linker.loadAstNode(this._nodeDescription);
                    this._ref = linkedNode ??
                        linker.createLinkingError({ reference, container: node, property }, this._nodeDescription);
                }
                else if (this._ref === undefined) {
                    // The reference has not been linked yet, so do that now.
                    this._ref = RefResolving;
                    const document = findRootNode(node).$document;
                    const refData = linker.getLinkedNode({ reference, container: node, property });
                    if (refData.error && document && document.state < DocumentState.ComputedScopes) {
                        // Document scope is not ready, don't set `this._ref` so linker can retry later.
                        return this._ref = undefined;
                    }
                    this._ref = refData.node ?? refData.error;
                    this._nodeDescription = refData.descr;
                    document?.references.push(this);
                }
                else if (this._ref === RefResolving) {
                    linker.throwCyclicReferenceError(node, property, refText);
                }
                return isAstNode(this._ref) ? this._ref : undefined;
            },
            get $nodeDescription() {
                return this._nodeDescription;
            },
            get error() {
                return isLinkingError(this._ref) ? this._ref : undefined;
            }
        };
        return reference;
    }
    buildMultiReference(node, property, refNode, refText) {
        // See behavior description in doc of Linker, update that on changes in here.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const linker = this;
        const reference = {
            $refNode: refNode,
            $refText: refText,
            _items: undefined,
            get items() {
                if (Array.isArray(this._items)) {
                    return this._items;
                }
                else if (this._items === undefined) {
                    this._items = RefResolving;
                    const document = findRootNode(node).$document;
                    const descriptions = linker.getCandidates({
                        reference,
                        container: node,
                        property
                    });
                    const items = [];
                    if (isLinkingError(descriptions)) {
                        this._linkingError = descriptions;
                    }
                    else {
                        for (const description of descriptions) {
                            const linkedNode = linker.loadAstNode(description);
                            if (linkedNode) {
                                items.push({ ref: linkedNode, $nodeDescription: description });
                            }
                        }
                    }
                    this._items = items;
                    document?.references.push(this);
                }
                else if (this._items === RefResolving) {
                    linker.throwCyclicReferenceError(node, property, refText);
                }
                return Array.isArray(this._items) ? this._items : [];
            },
            get error() {
                if (this._linkingError) {
                    return this._linkingError;
                }
                const refs = this.items;
                if (refs.length > 0) {
                    return undefined;
                }
                else {
                    return (this._linkingError = linker.createLinkingError({ reference, container: node, property }));
                }
            }
        };
        return reference;
    }
    throwCyclicReferenceError(node, property, refText) {
        throw new Error(`Cyclic reference resolution detected: ${this.astNodeLocator.getAstNodePath(node)}/${property} (symbol '${refText}')`);
    }
    getLinkedNode(refInfo) {
        try {
            const description = this.getCandidate(refInfo);
            if (isLinkingError(description)) {
                return { error: description };
            }
            const linkedNode = this.loadAstNode(description);
            if (linkedNode) {
                return { node: linkedNode, descr: description };
            }
            else {
                return {
                    descr: description,
                    error: this.createLinkingError(refInfo, description)
                };
            }
        }
        catch (err) {
            console.error(`An error occurred while resolving reference to '${refInfo.reference.$refText}':`, err);
            const errorMessage = err.message ?? String(err);
            return {
                error: {
                    info: refInfo,
                    message: `An error occurred while resolving reference to '${refInfo.reference.$refText}': ${errorMessage}`
                }
            };
        }
    }
    loadAstNode(nodeDescription) {
        if (nodeDescription.node) {
            return nodeDescription.node;
        }
        const doc = this.langiumDocuments().getDocument(nodeDescription.documentUri);
        if (!doc) {
            return undefined;
        }
        return this.astNodeLocator.getAstNode(doc.parseResult.value, nodeDescription.path);
    }
    createLinkingError(refInfo, targetDescription) {
        // Check whether the document is sufficiently processed by the DocumentBuilder. If not, this is a hint for a bug
        // in the language implementation.
        const document = findRootNode(refInfo.container).$document;
        if (document && document.state < DocumentState.ComputedScopes) {
            console.warn(`Attempted reference resolution before document reached ComputedScopes state (${document.uri}).`);
        }
        const referenceType = this.reflection.getReferenceType(refInfo);
        return {
            info: refInfo,
            message: `Could not resolve reference to ${referenceType} named '${refInfo.reference.$refText}'.`,
            targetDescription
        };
    }
}
//# sourceMappingURL=linker.js.map