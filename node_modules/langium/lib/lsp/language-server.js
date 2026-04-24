/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { DidChangeConfigurationNotification, Emitter, LSPErrorCodes, ResponseError, TextDocumentSyncKind } from 'vscode-languageserver-protocol';
import { eagerLoad } from '../dependency-injection.js';
import { isOperationCancelled } from '../utils/promise-utils.js';
import { URI } from '../utils/uri-utils.js';
import { DocumentState } from '../workspace/documents.js';
import { mergeCompletionProviderOptions } from './completion/completion-provider.js';
import { mergeSemanticTokenProviderOptions } from './semantic-token-provider.js';
import { mergeSignatureHelpOptions } from './signature-help-provider.js';
export class DefaultLanguageServer {
    constructor(services) {
        this.onInitializeEmitter = new Emitter();
        this.onInitializedEmitter = new Emitter();
        this.services = services;
    }
    get onInitialize() {
        return this.onInitializeEmitter.event;
    }
    get onInitialized() {
        return this.onInitializedEmitter.event;
    }
    async initialize(params) {
        this.eagerLoadServices();
        this.fireInitializeOnDefaultServices(params);
        this.onInitializeEmitter.fire(params);
        this.onInitializeEmitter.dispose();
        return this.buildInitializeResult(params);
    }
    /**
     * Eagerly loads all services before emitting the `onInitialize` event.
     * Ensures that all services are able to catch the event.
     */
    eagerLoadServices() {
        eagerLoad(this.services);
        this.services.ServiceRegistry.all.forEach(language => eagerLoad(language));
    }
    hasService(callback) {
        const allServices = this.services.ServiceRegistry.all;
        return allServices.some(services => callback(services) !== undefined);
    }
    buildInitializeResult(_params) {
        const documentUpdateHandler = this.services.lsp.DocumentUpdateHandler;
        const fileOperationOptions = this.services.lsp.FileOperationHandler?.fileOperationOptions;
        const allServices = this.services.ServiceRegistry.all;
        const hasFormattingService = this.hasService(e => e.lsp?.Formatter);
        const formattingOnTypeOptions = allServices.map(e => e.lsp?.Formatter?.formatOnTypeOptions).find(e => Boolean(e));
        const hasCodeActionProvider = this.hasService(e => e.lsp?.CodeActionProvider);
        const hasSemanticTokensProvider = this.hasService(e => e.lsp?.SemanticTokenProvider);
        const semanticTokensOptions = mergeSemanticTokenProviderOptions(allServices.map(e => e.lsp?.SemanticTokenProvider?.semanticTokensOptions));
        const commandNames = this.services.lsp?.ExecuteCommandHandler?.commands;
        const hasDocumentLinkProvider = this.hasService(e => e.lsp?.DocumentLinkProvider);
        const signatureHelpOptions = mergeSignatureHelpOptions(allServices.map(e => e.lsp?.SignatureHelp?.signatureHelpOptions));
        const hasGoToTypeProvider = this.hasService(e => e.lsp?.TypeProvider);
        const hasGoToImplementationProvider = this.hasService(e => e.lsp?.ImplementationProvider);
        const hasCompletionProvider = this.hasService(e => e.lsp?.CompletionProvider);
        const completionOptions = mergeCompletionProviderOptions(allServices.map(e => e.lsp?.CompletionProvider?.completionOptions));
        const hasReferencesProvider = this.hasService(e => e.lsp?.ReferencesProvider);
        const hasDocumentSymbolProvider = this.hasService(e => e.lsp?.DocumentSymbolProvider);
        const hasDefinitionProvider = this.hasService(e => e.lsp?.DefinitionProvider);
        const hasDocumentHighlightProvider = this.hasService(e => e.lsp?.DocumentHighlightProvider);
        const hasFoldingRangeProvider = this.hasService(e => e.lsp?.FoldingRangeProvider);
        const hasHoverProvider = this.hasService(e => e.lsp?.HoverProvider);
        const hasRenameProvider = this.hasService(e => e.lsp?.RenameProvider);
        const hasCallHierarchyProvider = this.hasService(e => e.lsp?.CallHierarchyProvider);
        const hasTypeHierarchyProvider = this.hasService((e) => e.lsp?.TypeHierarchyProvider);
        const hasCodeLensProvider = this.hasService(e => e.lsp?.CodeLensProvider);
        const hasDeclarationProvider = this.hasService(e => e.lsp?.DeclarationProvider);
        const hasInlayHintProvider = this.hasService(e => e.lsp?.InlayHintProvider);
        const workspaceSymbolProvider = this.services.lsp?.WorkspaceSymbolProvider;
        const result = {
            capabilities: {
                workspace: {
                    workspaceFolders: {
                        supported: true
                    },
                    fileOperations: fileOperationOptions
                },
                executeCommandProvider: commandNames && {
                    commands: commandNames
                },
                textDocumentSync: {
                    change: TextDocumentSyncKind.Incremental,
                    openClose: true,
                    save: Boolean(documentUpdateHandler.didSaveDocument),
                    willSave: Boolean(documentUpdateHandler.willSaveDocument),
                    willSaveWaitUntil: Boolean(documentUpdateHandler.willSaveDocumentWaitUntil)
                },
                completionProvider: hasCompletionProvider ? completionOptions : undefined,
                referencesProvider: hasReferencesProvider,
                documentSymbolProvider: hasDocumentSymbolProvider,
                definitionProvider: hasDefinitionProvider,
                typeDefinitionProvider: hasGoToTypeProvider,
                documentHighlightProvider: hasDocumentHighlightProvider,
                codeActionProvider: hasCodeActionProvider,
                documentFormattingProvider: hasFormattingService,
                documentRangeFormattingProvider: hasFormattingService,
                documentOnTypeFormattingProvider: formattingOnTypeOptions,
                foldingRangeProvider: hasFoldingRangeProvider,
                hoverProvider: hasHoverProvider,
                renameProvider: hasRenameProvider ? {
                    prepareProvider: true
                } : undefined,
                semanticTokensProvider: hasSemanticTokensProvider
                    ? semanticTokensOptions
                    : undefined,
                signatureHelpProvider: signatureHelpOptions,
                implementationProvider: hasGoToImplementationProvider,
                callHierarchyProvider: hasCallHierarchyProvider
                    ? {}
                    : undefined,
                typeHierarchyProvider: hasTypeHierarchyProvider
                    ? {}
                    : undefined,
                documentLinkProvider: hasDocumentLinkProvider
                    ? { resolveProvider: false }
                    : undefined,
                codeLensProvider: hasCodeLensProvider
                    ? { resolveProvider: false }
                    : undefined,
                declarationProvider: hasDeclarationProvider,
                inlayHintProvider: hasInlayHintProvider
                    ? { resolveProvider: false }
                    : undefined,
                workspaceSymbolProvider: workspaceSymbolProvider
                    ? { resolveProvider: Boolean(workspaceSymbolProvider.resolveSymbol) }
                    : undefined
            }
        };
        return result;
    }
    initialized(params) {
        this.fireInitializedOnDefaultServices(params);
        this.onInitializedEmitter.fire(params);
        this.onInitializedEmitter.dispose();
    }
    fireInitializeOnDefaultServices(params) {
        this.services.workspace.ConfigurationProvider.initialize(params);
        this.services.workspace.WorkspaceManager.initialize(params);
    }
    fireInitializedOnDefaultServices(params) {
        const connection = this.services.lsp.Connection;
        const configurationParams = connection ? {
            ...params,
            register: params => connection.client.register(DidChangeConfigurationNotification.type, params),
            fetchConfiguration: params => connection.workspace.getConfiguration(params)
        } : params;
        // do not await the promises of the following calls, as they must not block the initialization process!
        //  otherwise, there is the danger of out-of-order processing of subsequent incoming messages from the language client
        // however, awaiting should be possible in general, e.g. in unit test scenarios
        this.services.workspace.ConfigurationProvider.initialized(configurationParams)
            .catch(err => console.error('Error in ConfigurationProvider initialization:', err));
        this.services.workspace.WorkspaceManager.initialized(params)
            .catch(err => console.error('Error in WorkspaceManager initialization:', err));
    }
}
function isDocumentState(obj) {
    return typeof obj === 'number';
}
export var WorkspaceState;
(function (WorkspaceState) {
    WorkspaceState.Parsed = Object.freeze({ type: 'workspace', state: DocumentState.Parsed });
    WorkspaceState.IndexedContent = Object.freeze({ type: 'workspace', state: DocumentState.IndexedContent });
    WorkspaceState.ComputedScopes = Object.freeze({ type: 'workspace', state: DocumentState.ComputedScopes });
    WorkspaceState.Linked = Object.freeze({ type: 'workspace', state: DocumentState.Linked });
    WorkspaceState.IndexedReferences = Object.freeze({ type: 'workspace', state: DocumentState.IndexedReferences });
    WorkspaceState.Validated = Object.freeze({ type: 'workspace', state: DocumentState.Validated });
})(WorkspaceState || (WorkspaceState = {}));
export function startLanguageServer(services, serviceRequirements = {}) {
    const connection = services.lsp.Connection;
    if (!connection) {
        throw new Error('Starting a language server requires the languageServer.Connection service to be set.');
    }
    addDocumentUpdateHandler(connection, services);
    addFileOperationHandler(connection, services);
    addDiagnosticsHandler(connection, services);
    addCompletionHandler(connection, services, serviceRequirements.CompletionProvider);
    addFindReferencesHandler(connection, services, serviceRequirements.ReferencesProvider);
    addDocumentSymbolHandler(connection, services, serviceRequirements.DocumentSymbolProvider);
    addGotoDefinitionHandler(connection, services, serviceRequirements.DefinitionProvider);
    addGoToTypeDefinitionHandler(connection, services, serviceRequirements.TypeProvider);
    addGoToImplementationHandler(connection, services, serviceRequirements.ImplementationProvider);
    addDocumentHighlightHandler(connection, services, serviceRequirements.DocumentHighlightProvider);
    addFoldingRangeHandler(connection, services, serviceRequirements.FoldingRangeProvider);
    addFormattingHandler(connection, services, serviceRequirements.Formatter);
    addCodeActionHandler(connection, services, serviceRequirements.CodeActionProvider);
    addRenameHandler(connection, services, serviceRequirements.RenameProvider);
    addHoverHandler(connection, services, serviceRequirements.HoverProvider);
    addInlayHintHandler(connection, services, serviceRequirements.InlayHintProvider);
    addSemanticTokenHandler(connection, services, serviceRequirements.SemanticTokenProvider);
    addExecuteCommandHandler(connection, services);
    addSignatureHelpHandler(connection, services, serviceRequirements.SignatureHelp);
    addCallHierarchyHandler(connection, services, serviceRequirements.CallHierarchyProvider);
    addTypeHierarchyHandler(connection, services, serviceRequirements.TypeHierarchyProvider);
    addCodeLensHandler(connection, services, serviceRequirements.CodeLensProvider);
    addDocumentLinkHandler(connection, services, serviceRequirements.DocumentLinkProvider);
    addConfigurationChangeHandler(connection, services);
    addGoToDeclarationHandler(connection, services, serviceRequirements.DeclarationProvider);
    addWorkspaceSymbolHandler(connection, services, serviceRequirements.WorkspaceSymbolProvider);
    connection.onInitialize(params => {
        return services.lsp.LanguageServer.initialize(params);
    });
    connection.onInitialized(params => {
        services.lsp.LanguageServer.initialized(params);
    });
    // Make the text document manager listen on the connection for open, change and close text document events.
    const documents = services.workspace.TextDocuments;
    documents.listen(connection);
    // Start listening for incoming messages from the client.
    connection.listen();
}
/**
 * Adds a handler for document updates when content changes, or watch catches a change.
 * In the case there is no handler service registered, this function does nothing.
 */
export function addDocumentUpdateHandler(connection, services) {
    const handler = services.lsp.DocumentUpdateHandler;
    const documents = services.workspace.TextDocuments;
    if (handler.didOpenDocument) {
        documents.onDidOpen(change => handler.didOpenDocument(change));
    }
    if (handler.didChangeContent) {
        documents.onDidChangeContent(change => handler.didChangeContent(change));
    }
    if (handler.didCloseDocument) {
        documents.onDidClose(change => handler.didCloseDocument(change));
    }
    if (handler.didSaveDocument) {
        documents.onDidSave(change => handler.didSaveDocument(change));
    }
    if (handler.willSaveDocument) {
        documents.onWillSave(event => handler.willSaveDocument(event));
    }
    if (handler.willSaveDocumentWaitUntil) {
        documents.onWillSaveWaitUntil(event => handler.willSaveDocumentWaitUntil(event));
    }
    if (handler.didChangeWatchedFiles) {
        connection.onDidChangeWatchedFiles(params => handler.didChangeWatchedFiles(params));
    }
}
export function addFileOperationHandler(connection, services) {
    const handler = services.lsp.FileOperationHandler;
    if (!handler) {
        return;
    }
    if (handler.didCreateFiles) {
        connection.workspace.onDidCreateFiles(params => handler.didCreateFiles(params));
    }
    if (handler.didRenameFiles) {
        connection.workspace.onDidRenameFiles(params => handler.didRenameFiles(params));
    }
    if (handler.didDeleteFiles) {
        connection.workspace.onDidDeleteFiles(params => handler.didDeleteFiles(params));
    }
    if (handler.willCreateFiles) {
        connection.workspace.onWillCreateFiles(params => handler.willCreateFiles(params));
    }
    if (handler.willRenameFiles) {
        connection.workspace.onWillRenameFiles(params => handler.willRenameFiles(params));
    }
    if (handler.willDeleteFiles) {
        connection.workspace.onWillDeleteFiles(params => handler.willDeleteFiles(params));
    }
}
export function addDiagnosticsHandler(connection, services) {
    const documentBuilder = services.workspace.DocumentBuilder;
    documentBuilder.onUpdate(async (_, deleted) => {
        for (const uri of deleted) {
            connection.sendDiagnostics({
                uri: uri.toString(),
                diagnostics: []
            });
        }
    });
    documentBuilder.onDocumentPhase(DocumentState.Validated, async (document) => {
        if (document.diagnostics) {
            connection.sendDiagnostics({
                uri: document.uri.toString(),
                diagnostics: document.diagnostics
            });
        }
    });
}
export function addCompletionHandler(connection, services, requiredState = DocumentState.Linked) {
    connection.onCompletion(createRequestHandler((services, document, params, cancelToken) => {
        return services.lsp?.CompletionProvider?.getCompletion(document, params, cancelToken);
    }, services, requiredState));
}
export function addFindReferencesHandler(connection, services, requiredState = WorkspaceState.IndexedReferences) {
    connection.onReferences(createRequestHandler((services, document, params, cancelToken) => services.lsp?.ReferencesProvider?.findReferences(document, params, cancelToken), services, requiredState));
}
export function addCodeActionHandler(connection, services, requiredState = DocumentState.Validated) {
    connection.onCodeAction(createRequestHandler((services, document, params, cancelToken) => services.lsp?.CodeActionProvider?.getCodeActions(document, params, cancelToken), services, requiredState));
}
export function addDocumentSymbolHandler(connection, services, requiredState = DocumentState.Parsed) {
    connection.onDocumentSymbol(createRequestHandler((services, document, params, cancelToken) => services.lsp?.DocumentSymbolProvider?.getSymbols(document, params, cancelToken), services, requiredState));
}
export function addGotoDefinitionHandler(connection, services, requiredState = DocumentState.Linked) {
    connection.onDefinition(createRequestHandler((services, document, params, cancelToken) => services.lsp?.DefinitionProvider?.getDefinition(document, params, cancelToken), services, requiredState));
}
export function addGoToTypeDefinitionHandler(connection, services, requiredState = DocumentState.Linked) {
    connection.onTypeDefinition(createRequestHandler((services, document, params, cancelToken) => services.lsp?.TypeProvider?.getTypeDefinition(document, params, cancelToken), services, requiredState));
}
export function addGoToImplementationHandler(connection, services, requiredState = WorkspaceState.IndexedReferences) {
    connection.onImplementation(createRequestHandler((services, document, params, cancelToken) => services.lsp?.ImplementationProvider?.getImplementation(document, params, cancelToken), services, requiredState));
}
export function addGoToDeclarationHandler(connection, services, requiredState = DocumentState.Linked) {
    connection.onDeclaration(createRequestHandler((services, document, params, cancelToken) => services.lsp?.DeclarationProvider?.getDeclaration(document, params, cancelToken), services, requiredState));
}
export function addDocumentHighlightHandler(connection, services, requiredState = WorkspaceState.IndexedReferences) {
    connection.onDocumentHighlight(createRequestHandler((services, document, params, cancelToken) => services.lsp?.DocumentHighlightProvider?.getDocumentHighlight(document, params, cancelToken), services, requiredState));
}
export function addHoverHandler(connection, services, requiredState = DocumentState.Linked) {
    connection.onHover(createRequestHandler((services, document, params, cancelToken) => services.lsp?.HoverProvider?.getHoverContent(document, params, cancelToken), services, requiredState));
}
export function addFoldingRangeHandler(connection, services, requiredState = DocumentState.Parsed) {
    connection.onFoldingRanges(createRequestHandler((services, document, params, cancelToken) => services.lsp?.FoldingRangeProvider?.getFoldingRanges(document, params, cancelToken), services, requiredState));
}
export function addFormattingHandler(connection, services, requiredState = DocumentState.Parsed) {
    connection.onDocumentFormatting(createRequestHandler((services, document, params, cancelToken) => services.lsp?.Formatter?.formatDocument(document, params, cancelToken), services, requiredState));
    connection.onDocumentRangeFormatting(createRequestHandler((services, document, params, cancelToken) => services.lsp?.Formatter?.formatDocumentRange(document, params, cancelToken), services, requiredState));
    connection.onDocumentOnTypeFormatting(createRequestHandler((services, document, params, cancelToken) => services.lsp?.Formatter?.formatDocumentOnType(document, params, cancelToken), services, requiredState));
}
export function addRenameHandler(connection, services, requiredState = WorkspaceState.IndexedReferences) {
    connection.onRenameRequest(createRequestHandler((services, document, params, cancelToken) => services.lsp?.RenameProvider?.rename(document, params, cancelToken), services, requiredState));
    connection.onPrepareRename(createRequestHandler((services, document, params, cancelToken) => services.lsp?.RenameProvider?.prepareRename(document, params, cancelToken), services, requiredState));
}
export function addInlayHintHandler(connection, services, requiredState = DocumentState.IndexedReferences) {
    connection.languages.inlayHint.on(createServerRequestHandler((services, document, params, cancelToken) => services.lsp?.InlayHintProvider?.getInlayHints(document, params, cancelToken), services, requiredState));
}
export function addSemanticTokenHandler(connection, services, requiredState = DocumentState.Linked) {
    // If no semantic token provider is registered that's fine. Just return an empty result
    const emptyResult = { data: [] };
    connection.languages.semanticTokens.on(createServerRequestHandler((services, document, params, cancelToken) => {
        if (services.lsp?.SemanticTokenProvider) {
            return services.lsp.SemanticTokenProvider.semanticHighlight(document, params, cancelToken);
        }
        return emptyResult;
    }, services, requiredState));
    connection.languages.semanticTokens.onDelta(createServerRequestHandler((services, document, params, cancelToken) => {
        if (services.lsp?.SemanticTokenProvider) {
            return services.lsp.SemanticTokenProvider.semanticHighlightDelta(document, params, cancelToken);
        }
        return emptyResult;
    }, services, requiredState));
    connection.languages.semanticTokens.onRange(createServerRequestHandler((services, document, params, cancelToken) => {
        if (services.lsp?.SemanticTokenProvider) {
            return services.lsp.SemanticTokenProvider.semanticHighlightRange(document, params, cancelToken);
        }
        return emptyResult;
    }, services, requiredState));
}
export function addConfigurationChangeHandler(connection, services) {
    connection.onDidChangeConfiguration(change => {
        services.workspace.ConfigurationProvider.updateConfiguration(change);
    });
}
export function addExecuteCommandHandler(connection, services) {
    const commandHandler = services.lsp.ExecuteCommandHandler;
    if (commandHandler) {
        connection.onExecuteCommand(async (params, token) => {
            try {
                return await commandHandler.executeCommand(params.command, params.arguments ?? [], token);
            }
            catch (err) {
                return responseError(err);
            }
        });
    }
}
export function addDocumentLinkHandler(connection, services, requiredState = DocumentState.Parsed) {
    connection.onDocumentLinks(createServerRequestHandler((services, document, params, cancelToken) => services.lsp?.DocumentLinkProvider?.getDocumentLinks(document, params, cancelToken), services, requiredState));
}
export function addSignatureHelpHandler(connection, services, requiredState = DocumentState.IndexedReferences) {
    connection.onSignatureHelp(createServerRequestHandler((services, document, params, cancelToken) => services.lsp?.SignatureHelp?.provideSignatureHelp(document, params, cancelToken), services, requiredState));
}
export function addCodeLensHandler(connection, services, requiredState = DocumentState.IndexedReferences) {
    connection.onCodeLens(createServerRequestHandler((services, document, params, cancelToken) => services.lsp?.CodeLensProvider?.provideCodeLens(document, params, cancelToken), services, requiredState));
}
export function addWorkspaceSymbolHandler(connection, services, requiredState = WorkspaceState.IndexedContent) {
    const workspaceSymbolProvider = services.lsp.WorkspaceSymbolProvider;
    if (workspaceSymbolProvider) {
        if (isDocumentState(requiredState) || requiredState.type === 'document') {
            throw new Error('Workspace symbol requests are independent of a certain document, so the given document-specific required state is invalid. Provide a service requirement of type "workspace".');
        }
        const documentBuilder = services.workspace.DocumentBuilder;
        connection.onWorkspaceSymbol(async (params, token) => {
            try {
                await documentBuilder.waitUntil(requiredState.state, token);
                return await workspaceSymbolProvider.getSymbols(params, token);
            }
            catch (err) {
                return responseError(err);
            }
        });
        const resolveWorkspaceSymbol = workspaceSymbolProvider.resolveSymbol?.bind(workspaceSymbolProvider);
        if (resolveWorkspaceSymbol) {
            connection.onWorkspaceSymbolResolve(async (workspaceSymbol, token) => {
                try {
                    await documentBuilder.waitUntil(requiredState.state, token);
                    return await resolveWorkspaceSymbol(workspaceSymbol, token);
                }
                catch (err) {
                    return responseError(err);
                }
            });
        }
    }
}
export function addCallHierarchyHandler(connection, services, requiredState = WorkspaceState.IndexedReferences) {
    connection.languages.callHierarchy.onPrepare(createServerRequestHandler(async (services, document, params, cancelToken) => {
        if (services.lsp?.CallHierarchyProvider) {
            const result = await services.lsp.CallHierarchyProvider.prepareCallHierarchy(document, params, cancelToken);
            return result ?? null;
        }
        return null;
    }, services, requiredState));
    connection.languages.callHierarchy.onIncomingCalls(createHierarchyRequestHandler(async (services, params, cancelToken) => {
        if (services.lsp?.CallHierarchyProvider) {
            const result = await services.lsp.CallHierarchyProvider.incomingCalls(params, cancelToken);
            return result ?? null;
        }
        return null;
    }, services, requiredState));
    connection.languages.callHierarchy.onOutgoingCalls(createHierarchyRequestHandler(async (services, params, cancelToken) => {
        if (services.lsp?.CallHierarchyProvider) {
            const result = await services.lsp.CallHierarchyProvider.outgoingCalls(params, cancelToken);
            return result ?? null;
        }
        return null;
    }, services, requiredState));
}
export function addTypeHierarchyHandler(connection, sharedServices, requiredState = WorkspaceState.IndexedReferences) {
    // Don't register type hierarchy handlers if no type hierarchy provider is registered
    if (!sharedServices.ServiceRegistry.all.some((services) => services.lsp?.TypeHierarchyProvider)) {
        return;
    }
    connection.languages.typeHierarchy.onPrepare(createServerRequestHandler(async (services, document, params, cancelToken) => {
        const result = await services.lsp?.TypeHierarchyProvider?.prepareTypeHierarchy(document, params, cancelToken);
        return result ?? null;
    }, sharedServices, requiredState));
    connection.languages.typeHierarchy.onSupertypes(createHierarchyRequestHandler(async (services, params, cancelToken) => {
        const result = await services.lsp?.TypeHierarchyProvider?.supertypes(params, cancelToken);
        return result ?? null;
    }, sharedServices, requiredState));
    connection.languages.typeHierarchy.onSubtypes(createHierarchyRequestHandler(async (services, params, cancelToken) => {
        const result = await services.lsp?.TypeHierarchyProvider?.subtypes(params, cancelToken);
        return result ?? null;
    }, sharedServices, requiredState));
}
export function createHierarchyRequestHandler(serviceCall, sharedServices, requiredState) {
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params, cancelToken) => {
        const uri = URI.parse(params.item.uri);
        const cancellationError = await waitUntilPhase(sharedServices, cancelToken, uri, requiredState);
        if (cancellationError) {
            return cancellationError;
        }
        if (!serviceRegistry.hasServices(uri)) {
            const errorText = `Could not find service instance for uri: '${uri}'`;
            console.debug(errorText);
            return responseError(new Error(errorText));
        }
        const language = serviceRegistry.getServices(uri);
        try {
            return await serviceCall(language, params, cancelToken);
        }
        catch (err) {
            return responseError(err);
        }
    };
}
export function createServerRequestHandler(serviceCall, sharedServices, requiredState) {
    const documents = sharedServices.workspace.LangiumDocuments;
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params, cancelToken) => {
        const uri = URI.parse(params.textDocument.uri);
        const cancellationError = await waitUntilPhase(sharedServices, cancelToken, uri, requiredState);
        if (cancellationError) {
            return cancellationError;
        }
        if (!serviceRegistry.hasServices(uri)) {
            const errorText = `Could not find service instance for uri: '${uri}'`;
            console.debug(errorText);
            return responseError(new Error(errorText));
        }
        const language = serviceRegistry.getServices(uri);
        try {
            const document = await documents.getOrCreateDocument(uri);
            return await serviceCall(language, document, params, cancelToken);
        }
        catch (err) {
            return responseError(err);
        }
    };
}
export function createRequestHandler(serviceCall, sharedServices, requiredState) {
    const documents = sharedServices.workspace.LangiumDocuments;
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params, cancelToken) => {
        const uri = URI.parse(params.textDocument.uri);
        const cancellationError = await waitUntilPhase(sharedServices, cancelToken, uri, requiredState);
        if (cancellationError) {
            return cancellationError;
        }
        if (!serviceRegistry.hasServices(uri)) {
            console.debug(`Could not find service instance for uri: '${uri.toString()}'`);
            return null;
        }
        const language = serviceRegistry.getServices(uri);
        try {
            const document = await documents.getOrCreateDocument(uri);
            return await serviceCall(language, document, params, cancelToken);
        }
        catch (err) {
            return responseError(err);
        }
    };
}
async function waitUntilPhase(services, cancelToken, uri, requiredState) {
    if (requiredState !== undefined) {
        const documentBuilder = services.workspace.DocumentBuilder;
        const workspaceManager = services.workspace.WorkspaceManager;
        try {
            await workspaceManager.ready; // mandatory if awaiting the state of a document (uri !== undefined) while the LS is starting
            if (isDocumentState(requiredState)) {
                await documentBuilder.waitUntil(requiredState, uri, cancelToken);
            }
            else if (requiredState.type === 'document') {
                await documentBuilder.waitUntil(requiredState.state, uri, cancelToken);
            }
            else {
                await documentBuilder.waitUntil(requiredState.state, cancelToken);
            }
        }
        catch (err) {
            return responseError(err);
        }
    }
    return undefined;
}
function responseError(err) {
    if (isOperationCancelled(err)) {
        return new ResponseError(LSPErrorCodes.RequestCancelled, 'The request has been cancelled.');
    }
    if (err instanceof ResponseError) {
        return err;
    }
    throw err;
}
//# sourceMappingURL=language-server.js.map