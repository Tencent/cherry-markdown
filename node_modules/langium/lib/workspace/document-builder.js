/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { LSPErrorCodes, ResponseError } from 'vscode-languageserver-protocol';
import { CancellationToken } from '../utils/cancellation.js';
import { Disposable } from '../utils/disposable.js';
import { MultiMap } from '../utils/collections.js';
import { OperationCancelled, interruptAndCheck, isOperationCancelled } from '../utils/promise-utils.js';
import { stream } from '../utils/stream.js';
import { UriUtils } from '../utils/uri-utils.js';
import { DocumentState } from './documents.js';
export class DefaultDocumentBuilder {
    constructor(services) {
        this.updateBuildOptions = {
            // Default: run only the built-in validation checks and those in the _fast_ category (includes those without category)
            validation: {
                categories: ['built-in', 'fast']
            }
        };
        this.updateListeners = [];
        this.buildPhaseListeners = new MultiMap();
        this.documentPhaseListeners = new MultiMap();
        this.buildState = new Map();
        this.documentBuildWaiters = new Map();
        this.currentState = DocumentState.Changed;
        this.langiumDocuments = services.workspace.LangiumDocuments;
        this.langiumDocumentFactory = services.workspace.LangiumDocumentFactory;
        this.textDocuments = services.workspace.TextDocuments;
        this.indexManager = services.workspace.IndexManager;
        this.fileSystemProvider = services.workspace.FileSystemProvider;
        this.workspaceManager = () => services.workspace.WorkspaceManager;
        this.serviceRegistry = services.ServiceRegistry;
    }
    async build(documents, options = {}, cancelToken = CancellationToken.None) {
        for (const document of documents) {
            const key = document.uri.toString();
            if (document.state === DocumentState.Validated) {
                if (typeof options.validation === 'boolean' && options.validation) {
                    // Force re-running all validation checks
                    this.resetToState(document, DocumentState.IndexedReferences);
                }
                else if (typeof options.validation === 'object') {
                    // Validation with explicit options was requested for a document that has already been partly validated.
                    // In this case, we need to execute only the missing validation categories.
                    const categories = this.findMissingValidationCategories(document, options);
                    if (categories.length > 0) {
                        // Validate this document, since some of the requested validation categories are not executed yet.
                        //  In all other cases/else-branches, the document is not build at all.
                        this.buildState.set(key, {
                            completed: false,
                            options: {
                                validation: {
                                    categories
                                }
                            },
                            result: this.buildState.get(key)?.result,
                        });
                        // Reset the state, but keep the existing validation markers of the already completed validation categories.
                        document.state = DocumentState.IndexedReferences;
                    }
                }
            }
            else {
                // Default: forget any previous build options
                this.buildState.delete(key);
            }
        }
        this.currentState = DocumentState.Changed;
        await this.emitUpdate(documents.map(e => e.uri), []);
        await this.buildDocuments(documents, options, cancelToken);
    }
    async update(changed, deleted, cancelToken = CancellationToken.None) {
        this.currentState = DocumentState.Changed;
        // Remove all metadata of documents that are reported as deleted
        const deletedUris = [];
        for (const deletedUri of deleted) {
            // Since the deleted URI might point to a directory, we delete all documents within
            const deletedDocs = this.langiumDocuments.deleteDocuments(deletedUri);
            for (const doc of deletedDocs) {
                deletedUris.push(doc.uri);
                this.cleanUpDeleted(doc);
            }
        }
        // Since the changed URI might point to a directory, we need to check all (nested) documents in that directory
        const changedUris = (await Promise.all(changed.map(uri => this.findChangedUris(uri)))).flat();
        // Set the state of all changed documents to `Changed` so they are completely rebuilt
        for (const changedUri of changedUris) {
            let changedDocument = this.langiumDocuments.getDocument(changedUri);
            if (changedDocument === undefined) {
                // We create an unparsed, invalid document.
                // This will be parsed as soon as we reach the first document builder phase.
                // This allows to cancel the parsing process later in case we need it.
                changedDocument = this.langiumDocumentFactory.fromModel({ $type: 'INVALID' }, changedUri);
                changedDocument.state = DocumentState.Changed; // required, since `langiumDocumentFactory.fromModel` marks the new document as `DocumentState.Parsed`
                this.langiumDocuments.addDocument(changedDocument);
            }
            this.resetToState(changedDocument, DocumentState.Changed);
        }
        // Set the state of all documents that should be relinked to `ComputedScopes` (if not already lower)
        const allChangedUris = stream(changedUris).concat(deletedUris).map(uri => uri.toString()).toSet();
        this.langiumDocuments.all
            .filter(doc => !allChangedUris.has(doc.uri.toString()) && this.shouldRelink(doc, allChangedUris))
            .forEach(doc => this.resetToState(doc, DocumentState.ComputedScopes));
        // Notify listeners of the update
        await this.emitUpdate(changedUris, deletedUris);
        // Only allow interrupting the execution after all state changes are done
        await interruptAndCheck(cancelToken);
        // Collect and sort all documents that we should rebuild
        const rebuildDocuments = this.sortDocuments(this.langiumDocuments.all
            .filter(doc => 
        // This includes those that were reported as changed and those that we selected for relinking
        doc.state < DocumentState.Validated
            // This includes those for which a previous build has been cancelled
            || !this.buildState.get(doc.uri.toString())?.completed
            // `updateBuildOptions` changed between the last build (which is completed) and the current build,
            //  leading to incomplete results, e.g. some validation categories are requested, which are not executed during the last build
            || this.resultsAreIncomplete(doc, this.updateBuildOptions))
            .toArray());
        await this.buildDocuments(rebuildDocuments, this.updateBuildOptions, cancelToken);
    }
    resultsAreIncomplete(document, options) {
        return this.findMissingValidationCategories(document, options).length >= 1;
    }
    findMissingValidationCategories(document, options) {
        const state = this.buildState.get(document.uri.toString());
        const allCategories = this.serviceRegistry.getServices(document.uri).validation.ValidationRegistry.getAllValidationCategories(document);
        const executedCategories = state?.result?.validationChecks ? new Set(state?.result?.validationChecks) : state?.completed ? allCategories : new Set();
        const requestedCategories = (options === undefined || options.validation === true) ? allCategories
            : typeof options.validation === 'object' ? (options.validation.categories ?? allCategories) : [];
        return stream(requestedCategories).filter(requested => !executedCategories.has(requested)).toArray();
    }
    async findChangedUris(changed) {
        // Most common case is that the document/textDocument at the specified URI has changed
        const document = this.langiumDocuments.getDocument(changed) ?? this.textDocuments?.get(changed);
        if (document) {
            return [changed];
        }
        // If the document doesn't exist yet, we need to check what kind of file has changed
        try {
            const stat = await this.fileSystemProvider.stat(changed);
            if (stat.isDirectory) {
                // If a directory has changed, we need to check all documents in that directory
                const uris = await this.workspaceManager().searchFolder(changed);
                return uris;
            }
            else if (this.workspaceManager().shouldIncludeEntry(stat)) {
                // Return the changed URI if it's a file that we can handle
                return [changed];
            }
        }
        catch {
            // If we can't determine the file type, we discard the change
        }
        return [];
    }
    async emitUpdate(changed, deleted) {
        await Promise.all(this.updateListeners.map(listener => listener(changed, deleted)));
    }
    /**
     * Sort the given documents by priority. By default, documents with an open text document are prioritized.
     * This is useful to ensure that visible documents show their diagnostics before all other documents.
     *
     * This improves the responsiveness in large workspaces as users usually don't care about diagnostics
     * in files that are currently not opened in the editor.
     */
    sortDocuments(documents) {
        let left = 0;
        let right = documents.length - 1;
        while (left < right) {
            while (left < documents.length && this.hasTextDocument(documents[left])) {
                left++;
            }
            while (right >= 0 && !this.hasTextDocument(documents[right])) {
                right--;
            }
            if (left < right) {
                [documents[left], documents[right]] = [documents[right], documents[left]];
            }
        }
        return documents;
    }
    hasTextDocument(doc) {
        return Boolean(this.textDocuments?.get(doc.uri));
    }
    /**
     * Check whether the given document should be relinked after changes were found in the given URIs.
     */
    shouldRelink(document, changedUris) {
        // Relink documents with linking errors -- maybe those references can be resolved now
        if (document.references.some(ref => ref.error !== undefined)) {
            return true;
        }
        // Check whether the document is affected by any of the changed URIs
        return this.indexManager.isAffected(document, changedUris);
    }
    onUpdate(callback) {
        this.updateListeners.push(callback);
        return Disposable.create(() => {
            const index = this.updateListeners.indexOf(callback);
            if (index >= 0) {
                this.updateListeners.splice(index, 1);
            }
        });
    }
    resetToState(document, state) {
        switch (state) {
            case DocumentState.Changed: {
                // Fall through
            }
            case DocumentState.Parsed:
                this.indexManager.removeContent(document.uri);
            // Fall through
            case DocumentState.IndexedContent:
                document.localSymbols = undefined;
            // Fall through
            case DocumentState.ComputedScopes: {
                const linker = this.serviceRegistry.getServices(document.uri).references.Linker;
                linker.unlink(document);
                // Fall through
            }
            case DocumentState.Linked:
                this.indexManager.removeReferences(document.uri);
            // Fall through
            case DocumentState.IndexedReferences:
                document.diagnostics = undefined;
                this.buildState.delete(document.uri.toString());
            // Fall through
            case DocumentState.Validated:
            // do nothing and keep the buildState
        }
        if (document.state > state) {
            document.state = state;
        }
    }
    cleanUpDeleted(document) {
        this.buildState.delete(document.uri.toString());
        this.indexManager.remove(document.uri);
        // Since this method `cleanUpDeleted` is not available from outside, the following line is not necessary, since the state is already set before.
        //  This line does not hurt and makes the code to be in sync with `resetToState`.
        //  If `cleanUpDeleted` is called in custom document builders at some more places, this line becomes necessary.
        document.state = DocumentState.Changed;
    }
    /**
     * Build the given documents by stepping through all build phases. If a document's state indicates
     * that a certain build phase is already done, the phase is skipped for that document.
     *
     * @param documents The documents to build.
     * @param options the {@link BuildOptions} to use.
     * @param cancelToken A cancellation token that can be used to cancel the build.
     * @returns A promise that resolves when the build is done.
     */
    async buildDocuments(documents, options, cancelToken) {
        this.prepareBuild(documents, options);
        // 0. Parse content
        await this.runCancelable(documents, DocumentState.Parsed, cancelToken, doc => this.langiumDocumentFactory.update(doc, cancelToken));
        // 1. Index content: collect the documents' symbols being accessible by other documents
        await this.runCancelable(documents, DocumentState.IndexedContent, cancelToken, doc => this.indexManager.updateContent(doc, cancelToken));
        // 2. Local symbols: collect each documents' symbols being accessible within the document (only)
        await this.runCancelable(documents, DocumentState.ComputedScopes, cancelToken, async (doc) => {
            const scopeComputation = this.serviceRegistry.getServices(doc.uri).references.ScopeComputation;
            doc.localSymbols = await scopeComputation.collectLocalSymbols(doc, cancelToken);
        });
        // 3. Linking
        const toBeLinked = documents.filter(doc => this.shouldLink(doc));
        await this.runCancelable(toBeLinked, DocumentState.Linked, cancelToken, doc => {
            const linker = this.serviceRegistry.getServices(doc.uri).references.Linker;
            return linker.link(doc, cancelToken);
        });
        // 4. Index references
        await this.runCancelable(toBeLinked, DocumentState.IndexedReferences, cancelToken, doc => this.indexManager.updateReferences(doc, cancelToken));
        // 5. Validation
        const toBeValidated = documents.filter(doc => {
            if (this.shouldValidate(doc)) {
                return true; // the build state is marked as completed after finishing the validation for the current document
            }
            else {
                this.markAsCompleted(doc); // since the validation is skipped for this document, it is already completed now
                return false;
            }
        });
        await this.runCancelable(toBeValidated, DocumentState.Validated, cancelToken, async (doc) => {
            await this.validate(doc, cancelToken);
            this.markAsCompleted(doc);
        });
    }
    markAsCompleted(document) {
        const state = this.buildState.get(document.uri.toString());
        if (state) {
            state.completed = true;
        }
    }
    /**
     * Runs prior to beginning the build process to update the {@link DocumentBuildState} for each document
     *
     * @param documents collection of documents to be built
     * @param options the {@link BuildOptions} to use
     */
    prepareBuild(documents, options) {
        for (const doc of documents) {
            const key = doc.uri.toString();
            const state = this.buildState.get(key);
            if (!state // If the document has no previous build state, we set it.
                || state.completed // If it has one, but it's already marked as completed, we overwrite it.
            ) {
                this.buildState.set(key, {
                    completed: false,
                    options,
                    result: state?.result
                });
            }
            else {
                // If the previous build was not completed, we keep its DocumentState and continue from the DocumentState where it was cancelled,
                //  e.g. the previous build options are used, including the previously requested validation categories.
            }
        }
    }
    /**
     * Runs a cancelable operation on a set of documents to bring them to a specified {@link DocumentState}.
     *
     * @param documents The array of documents to process.
     * @param targetState The target {@link DocumentState} to bring the documents to.
     * @param cancelToken A token that can be used to cancel the operation.
     * @param callback A function to be called for each document.
     * @returns A promise that resolves when all documents have been processed or the operation is canceled.
     * @throws Will throw `OperationCancelled` if the operation is canceled via a `CancellationToken`.
     */
    async runCancelable(documents, targetState, cancelToken, callback) {
        for (const document of documents) {
            if (document.state < targetState) {
                await interruptAndCheck(cancelToken);
                await callback(document);
                document.state = targetState;
                await this.notifyDocumentPhase(document, targetState, cancelToken);
            }
        }
        // Do not use `filtered` here, as that will miss documents that have previously reached the current target state.
        // For example, this happens in case the cancellation triggers between the processing of two documents
        // or files that were picked up during the workspace initialization.
        const targetStateDocs = documents.filter(doc => doc.state === targetState);
        await this.notifyBuildPhase(targetStateDocs, targetState, cancelToken);
        this.currentState = targetState;
    }
    onBuildPhase(targetState, callback) {
        this.buildPhaseListeners.add(targetState, callback);
        return Disposable.create(() => {
            this.buildPhaseListeners.delete(targetState, callback);
        });
    }
    onDocumentPhase(targetState, callback) {
        this.documentPhaseListeners.add(targetState, callback);
        return Disposable.create(() => {
            this.documentPhaseListeners.delete(targetState, callback);
        });
    }
    waitUntil(state, uriOrToken, cancelToken) {
        let uri = undefined;
        if (uriOrToken && 'path' in uriOrToken) {
            uri = uriOrToken;
        }
        else {
            cancelToken = uriOrToken;
        }
        cancelToken ?? (cancelToken = CancellationToken.None);
        if (uri) {
            return this.awaitDocumentState(state, uri, cancelToken);
        }
        else {
            return this.awaitBuilderState(state, cancelToken);
        }
    }
    awaitDocumentState(state, uri, cancelToken) {
        const document = this.langiumDocuments.getDocument(uri);
        if (!document) {
            return Promise.reject(new ResponseError(LSPErrorCodes.ServerCancelled, `No document found for URI: ${uri.toString()}`));
        }
        else if (document.state >= state) {
            return Promise.resolve(uri);
        }
        else if (cancelToken.isCancellationRequested) {
            return Promise.reject(OperationCancelled);
        }
        else if (this.currentState >= state && state > document.state) {
            // this would imply that the document has been excluded from linking or validation, for example;
            // this should never occur, the LS need to make sure that the affected document is properly built,
            //  alternatively, the build state requirement need to be relaxed.
            return Promise.reject(new ResponseError(LSPErrorCodes.RequestFailed, `Document state of ${uri.toString()} is ${DocumentState[document.state]}, requiring ${DocumentState[state]}, but workspace state is already ${DocumentState[this.currentState]}. Returning undefined.`));
        }
        return new Promise((resolve, reject) => {
            const buildDisposable = this.onDocumentPhase(state, (doc) => {
                if (UriUtils.equals(doc.uri, uri)) {
                    buildDisposable.dispose();
                    cancelDisposable.dispose();
                    resolve(doc.uri);
                }
            });
            const cancelDisposable = cancelToken.onCancellationRequested(() => {
                buildDisposable.dispose();
                cancelDisposable.dispose();
                reject(OperationCancelled);
            });
        });
    }
    awaitBuilderState(state, cancelToken) {
        if (this.currentState >= state) {
            return Promise.resolve();
        }
        else if (cancelToken.isCancellationRequested) {
            return Promise.reject(OperationCancelled);
        }
        return new Promise((resolve, reject) => {
            const buildDisposable = this.onBuildPhase(state, () => {
                buildDisposable.dispose();
                cancelDisposable.dispose();
                resolve();
            });
            const cancelDisposable = cancelToken.onCancellationRequested(() => {
                buildDisposable.dispose();
                cancelDisposable.dispose();
                reject(OperationCancelled);
            });
        });
    }
    async notifyDocumentPhase(document, state, cancelToken) {
        const listeners = this.documentPhaseListeners.get(state);
        const listenersCopy = listeners.slice();
        for (const listener of listenersCopy) {
            try {
                await interruptAndCheck(cancelToken);
                await listener(document, cancelToken);
            }
            catch (err) {
                // Ignore cancellation errors
                // We want to finish the listeners before throwing
                if (!isOperationCancelled(err)) {
                    throw err;
                }
            }
        }
    }
    async notifyBuildPhase(documents, state, cancelToken) {
        if (documents.length === 0) {
            // Don't notify when no document has been processed
            return;
        }
        const listeners = this.buildPhaseListeners.get(state);
        const listenersCopy = listeners.slice();
        for (const listener of listenersCopy) {
            await interruptAndCheck(cancelToken);
            await listener(documents, cancelToken);
        }
    }
    /**
     * Determine whether the given document should be linked during a build. The default
     * implementation checks the `eagerLinking` property of the build options. If it's set to `true`
     * or `undefined`, the document is included in the linking phase. This also affects the
     * references indexing phase, which depends on eager linking.
     */
    shouldLink(document) {
        return this.getBuildOptions(document).eagerLinking ?? true;
    }
    /**
     * Determine whether the given document should be validated during a build. The default
     * implementation checks the `validation` property of the build options. If it's set to `true`
     * or a `ValidationOptions` object, the document is included in the validation phase.
     */
    shouldValidate(document) {
        return Boolean(this.getBuildOptions(document).validation);
    }
    /**
     * Run validation checks on the given document and store the resulting diagnostics in the document.
     * If the document already contains diagnostics, the new ones are added to the list.
     */
    async validate(document, cancelToken) {
        const validator = this.serviceRegistry.getServices(document.uri).validation.DocumentValidator;
        const options = this.getBuildOptions(document);
        const validationOptions = typeof options.validation === 'object' ? { ...options.validation } : {};
        validationOptions.categories = this.findMissingValidationCategories(document, options); // execute only not-yet-executed categories
        const diagnostics = await validator.validateDocument(document, validationOptions, cancelToken);
        if (document.diagnostics) {
            document.diagnostics.push(...diagnostics); // keep diagnostics of previously executed categories
        }
        else {
            document.diagnostics = diagnostics;
        }
        // Store information about the executed validation in the build state
        const state = this.buildState.get(document.uri.toString());
        if (state) {
            state.result ?? (state.result = {});
            if (state.result.validationChecks) {
                state.result.validationChecks = stream(state.result.validationChecks).concat(validationOptions.categories).distinct().toArray();
            }
            else {
                state.result.validationChecks = [...validationOptions.categories];
            }
        }
    }
    getBuildOptions(document) {
        return this.buildState.get(document.uri.toString())?.options ?? {};
    }
}
//# sourceMappingURL=document-builder.js.map