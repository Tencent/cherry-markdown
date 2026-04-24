/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type {
    CallHierarchyIncomingCallsParams,
    CallHierarchyOutgoingCallsParams,
    CancellationToken,
    Connection,
    Disposable,
    Event,
    HandlerResult,
    InitializedParams,
    InitializeParams,
    InitializeResult,
    RequestHandler,
    SemanticTokens,
    SemanticTokensDelta,
    SemanticTokensDeltaParams,
    SemanticTokensDeltaPartialResult,
    SemanticTokensParams,
    SemanticTokensPartialResult,
    SemanticTokensRangeParams,
    ServerRequestHandler,
    TextDocumentIdentifier,
    TypeHierarchySubtypesParams,
    TypeHierarchySupertypesParams
} from 'vscode-languageserver';
import { DidChangeConfigurationNotification, Emitter, LSPErrorCodes, ResponseError, TextDocumentSyncKind } from 'vscode-languageserver-protocol';
import { eagerLoad } from '../dependency-injection.js';
import type { LangiumCoreServices } from '../services.js';
import { isOperationCancelled } from '../utils/promise-utils.js';
import { URI } from '../utils/uri-utils.js';
import type { ConfigurationInitializedParams } from '../workspace/configuration.js';
import { DocumentState, type LangiumDocument } from '../workspace/documents.js';
import { mergeCompletionProviderOptions } from './completion/completion-provider.js';
import type { LangiumSharedServices, PartialLangiumLSPServices } from './lsp-services.js';
import { mergeSemanticTokenProviderOptions } from './semantic-token-provider.js';
import { mergeSignatureHelpOptions } from './signature-help-provider.js';

export interface LanguageServer {
    initialize(params: InitializeParams): Promise<InitializeResult>
    initialized(params: InitializedParams): void
    onInitialize(callback: (params: InitializeParams) => void): Disposable
    onInitialized(callback: (params: InitializedParams) => void): Disposable
}

/**
 * Language-specific core and optional LSP services.
 * To be used while accessing the language-specific services via the service registry without a-priori knowledge about the presence of LSP services for the particular languages.
 * Shared services should be accessed via the language server's `services` property.
 */
export type LangiumCoreAndPartialLSPServices = Omit<LangiumCoreServices & PartialLangiumLSPServices, 'shared'>

export class DefaultLanguageServer implements LanguageServer {

    protected onInitializeEmitter = new Emitter<InitializeParams>();
    protected onInitializedEmitter = new Emitter<InitializedParams>();

    protected readonly services: LangiumSharedServices;

    constructor(services: LangiumSharedServices) {
        this.services = services;
    }

    get onInitialize(): Event<InitializeParams> {
        return this.onInitializeEmitter.event;
    }

    get onInitialized(): Event<InitializedParams> {
        return this.onInitializedEmitter.event;
    }

    async initialize(params: InitializeParams): Promise<InitializeResult> {
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
    protected eagerLoadServices(): void {
        eagerLoad(this.services);
        this.services.ServiceRegistry.all.forEach(language => eagerLoad(language));
    }

    protected hasService(callback: (language: LangiumCoreAndPartialLSPServices) => object | undefined): boolean {
        const allServices: readonly LangiumCoreAndPartialLSPServices[] = this.services.ServiceRegistry.all;
        return allServices.some(services => callback(services) !== undefined);
    }

    protected buildInitializeResult(_params: InitializeParams): InitializeResult {
        const documentUpdateHandler = this.services.lsp.DocumentUpdateHandler;
        const fileOperationOptions = this.services.lsp.FileOperationHandler?.fileOperationOptions;
        const allServices: readonly LangiumCoreAndPartialLSPServices[] = this.services.ServiceRegistry.all;
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

        const result: InitializeResult = {
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

    initialized(params: InitializedParams): void {
        this.fireInitializedOnDefaultServices(params);

        this.onInitializedEmitter.fire(params);
        this.onInitializedEmitter.dispose();
    }

    protected fireInitializeOnDefaultServices(params: InitializeParams): void {
        this.services.workspace.ConfigurationProvider.initialize(params);
        this.services.workspace.WorkspaceManager.initialize(params);
    }

    protected fireInitializedOnDefaultServices(params: InitializedParams): void {
        const connection = this.services.lsp.Connection;
        const configurationParams = connection ? <ConfigurationInitializedParams>{
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

export interface ServiceRequirements {
    readonly CallHierarchyProvider: ServiceRequirement
    readonly CodeActionProvider: ServiceRequirement
    readonly CodeLensProvider: ServiceRequirement
    readonly CompletionProvider: ServiceRequirement
    readonly DeclarationProvider: ServiceRequirement
    readonly DefinitionProvider: ServiceRequirement
    readonly DocumentHighlightProvider: ServiceRequirement
    readonly DocumentLinkProvider: ServiceRequirement
    readonly DocumentSymbolProvider: ServiceRequirement
    readonly FoldingRangeProvider: ServiceRequirement
    readonly Formatter: ServiceRequirement
    readonly HoverProvider: ServiceRequirement
    readonly ImplementationProvider: ServiceRequirement
    readonly InlayHintProvider: ServiceRequirement
    readonly ReferencesProvider: ServiceRequirement
    readonly RenameProvider: ServiceRequirement
    readonly SemanticTokenProvider: ServiceRequirement
    readonly SignatureHelp: ServiceRequirement
    readonly TypeHierarchyProvider: ServiceRequirement
    readonly TypeProvider: ServiceRequirement
    readonly WorkspaceSymbolProvider: ServiceRequirement
}

export type ServiceRequirement = DocumentState | {
    // Either wait for the specific document or for the whole workspace to arrive at the given state
    readonly type: 'document' | 'workspace';
    readonly state: DocumentState;
}

function isDocumentState(obj: ServiceRequirement): obj is DocumentState {
    return typeof obj === 'number';
}

export namespace WorkspaceState {
    export const Parsed: ServiceRequirement = Object.freeze({ type: 'workspace', state: DocumentState.Parsed });
    export const IndexedContent: ServiceRequirement = Object.freeze({ type: 'workspace', state: DocumentState.IndexedContent });
    export const ComputedScopes: ServiceRequirement = Object.freeze({ type: 'workspace', state: DocumentState.ComputedScopes });
    export const Linked: ServiceRequirement = Object.freeze({ type: 'workspace', state: DocumentState.Linked });
    export const IndexedReferences: ServiceRequirement = Object.freeze({ type: 'workspace', state: DocumentState.IndexedReferences });
    export const Validated: ServiceRequirement = Object.freeze({ type: 'workspace', state: DocumentState.Validated });
}

export function startLanguageServer(services: LangiumSharedServices, serviceRequirements: Partial<ServiceRequirements> = {}): void {
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
export function addDocumentUpdateHandler(connection: Connection, services: LangiumSharedServices): void {
    const handler = services.lsp.DocumentUpdateHandler;
    const documents = services.workspace.TextDocuments;
    if (handler.didOpenDocument) {
        documents.onDidOpen(change => handler.didOpenDocument!(change));
    }
    if (handler.didChangeContent) {
        documents.onDidChangeContent(change => handler.didChangeContent!(change));
    }
    if (handler.didCloseDocument) {
        documents.onDidClose(change => handler.didCloseDocument!(change));
    }
    if (handler.didSaveDocument) {
        documents.onDidSave(change => handler.didSaveDocument!(change));
    }
    if (handler.willSaveDocument) {
        documents.onWillSave(event => handler.willSaveDocument!(event));
    }
    if (handler.willSaveDocumentWaitUntil) {
        documents.onWillSaveWaitUntil(event => handler.willSaveDocumentWaitUntil!(event));
    }
    if (handler.didChangeWatchedFiles) {
        connection.onDidChangeWatchedFiles(params => handler.didChangeWatchedFiles!(params));
    }
}

export function addFileOperationHandler(connection: Connection, services: LangiumSharedServices): void {
    const handler = services.lsp.FileOperationHandler;
    if (!handler) {
        return;
    }
    if (handler.didCreateFiles) {
        connection.workspace.onDidCreateFiles(params => handler.didCreateFiles!(params));
    }
    if (handler.didRenameFiles) {
        connection.workspace.onDidRenameFiles(params => handler.didRenameFiles!(params));
    }
    if (handler.didDeleteFiles) {
        connection.workspace.onDidDeleteFiles(params => handler.didDeleteFiles!(params));
    }
    if (handler.willCreateFiles) {
        connection.workspace.onWillCreateFiles(params => handler.willCreateFiles!(params));
    }
    if (handler.willRenameFiles) {
        connection.workspace.onWillRenameFiles(params => handler.willRenameFiles!(params));
    }
    if (handler.willDeleteFiles) {
        connection.workspace.onWillDeleteFiles(params => handler.willDeleteFiles!(params));
    }
}

export function addDiagnosticsHandler(connection: Connection, services: LangiumSharedServices): void {
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

export function addCompletionHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Linked): void {
    connection.onCompletion(createRequestHandler(
        (services, document, params, cancelToken) => {
            return services.lsp?.CompletionProvider?.getCompletion(document, params, cancelToken);
        },
        services,
        requiredState
    ));
}

export function addFindReferencesHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedReferences): void {
    connection.onReferences(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.ReferencesProvider?.findReferences(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addCodeActionHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Validated): void {
    connection.onCodeAction(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.CodeActionProvider?.getCodeActions(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addDocumentSymbolHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Parsed): void {
    connection.onDocumentSymbol(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.DocumentSymbolProvider?.getSymbols(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addGotoDefinitionHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Linked): void {
    connection.onDefinition(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.DefinitionProvider?.getDefinition(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addGoToTypeDefinitionHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Linked): void {
    connection.onTypeDefinition(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.TypeProvider?.getTypeDefinition(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addGoToImplementationHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedReferences): void {
    connection.onImplementation(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.ImplementationProvider?.getImplementation(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addGoToDeclarationHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Linked): void {
    connection.onDeclaration(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.DeclarationProvider?.getDeclaration(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addDocumentHighlightHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedReferences): void {
    connection.onDocumentHighlight(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.DocumentHighlightProvider?.getDocumentHighlight(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addHoverHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Linked): void {
    connection.onHover(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.HoverProvider?.getHoverContent(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addFoldingRangeHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Parsed): void {
    connection.onFoldingRanges(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.FoldingRangeProvider?.getFoldingRanges(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addFormattingHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Parsed): void {
    connection.onDocumentFormatting(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.Formatter?.formatDocument(document, params, cancelToken),
        services,
        requiredState
    ));
    connection.onDocumentRangeFormatting(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.Formatter?.formatDocumentRange(document, params, cancelToken),
        services,
        requiredState
    ));
    connection.onDocumentOnTypeFormatting(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.Formatter?.formatDocumentOnType(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addRenameHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedReferences): void {

    connection.onRenameRequest(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.RenameProvider?.rename(document, params, cancelToken),
        services,
        requiredState
    ));
    connection.onPrepareRename(createRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.RenameProvider?.prepareRename(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addInlayHintHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.IndexedReferences): void {
    connection.languages.inlayHint.on(createServerRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.InlayHintProvider?.getInlayHints(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addSemanticTokenHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Linked): void {
    // If no semantic token provider is registered that's fine. Just return an empty result
    const emptyResult: SemanticTokens = { data: [] };
    connection.languages.semanticTokens.on(createServerRequestHandler<SemanticTokensParams, SemanticTokens, SemanticTokensPartialResult, void>(
        (services, document, params, cancelToken) => {
            if (services.lsp?.SemanticTokenProvider) {
                return services.lsp.SemanticTokenProvider.semanticHighlight(document, params, cancelToken);
            }
            return emptyResult;
        },
        services,
        requiredState
    ));
    connection.languages.semanticTokens.onDelta(createServerRequestHandler<SemanticTokensDeltaParams, SemanticTokens | SemanticTokensDelta, SemanticTokensDeltaPartialResult, void>(
        (services, document, params, cancelToken) => {
            if (services.lsp?.SemanticTokenProvider) {
                return services.lsp.SemanticTokenProvider.semanticHighlightDelta(document, params, cancelToken);
            }
            return emptyResult;
        },
        services,
        requiredState
    ));
    connection.languages.semanticTokens.onRange(createServerRequestHandler<SemanticTokensRangeParams, SemanticTokens, SemanticTokensPartialResult, void>(
        (services, document, params, cancelToken) => {
            if (services.lsp?.SemanticTokenProvider) {
                return services.lsp.SemanticTokenProvider.semanticHighlightRange(document, params, cancelToken);
            }
            return emptyResult;
        },
        services,
        requiredState
    ));
}
export function addConfigurationChangeHandler(connection: Connection, services: LangiumSharedServices): void {
    connection.onDidChangeConfiguration(change => {
        services.workspace.ConfigurationProvider.updateConfiguration(change);
    });
}

export function addExecuteCommandHandler(connection: Connection, services: LangiumSharedServices): void {
    const commandHandler = services.lsp.ExecuteCommandHandler;
    if (commandHandler) {
        connection.onExecuteCommand(async (params, token) => {
            try {
                return await commandHandler.executeCommand(params.command, params.arguments ?? [], token);
            } catch (err) {
                return responseError(err);
            }
        });
    }
}

export function addDocumentLinkHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.Parsed): void {
    connection.onDocumentLinks(createServerRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.DocumentLinkProvider?.getDocumentLinks(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addSignatureHelpHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.IndexedReferences): void {
    connection.onSignatureHelp(createServerRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.SignatureHelp?.provideSignatureHelp(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addCodeLensHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = DocumentState.IndexedReferences): void {
    connection.onCodeLens(createServerRequestHandler(
        (services, document, params, cancelToken) => services.lsp?.CodeLensProvider?.provideCodeLens(document, params, cancelToken),
        services,
        requiredState
    ));
}

export function addWorkspaceSymbolHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedContent): void {
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
            } catch (err) {
                return responseError(err);
            }
        });
        const resolveWorkspaceSymbol = workspaceSymbolProvider.resolveSymbol?.bind(workspaceSymbolProvider);
        if (resolveWorkspaceSymbol) {
            connection.onWorkspaceSymbolResolve(async (workspaceSymbol, token) => {
                try {
                    await documentBuilder.waitUntil(requiredState.state, token);
                    return await resolveWorkspaceSymbol(workspaceSymbol, token);
                } catch (err) {
                    return responseError(err);
                }
            });
        }
    }
}

export function addCallHierarchyHandler(connection: Connection, services: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedReferences): void {
    connection.languages.callHierarchy.onPrepare(createServerRequestHandler(
        async (services, document, params, cancelToken) => {
            if (services.lsp?.CallHierarchyProvider) {
                const result = await services.lsp.CallHierarchyProvider.prepareCallHierarchy(document, params, cancelToken);
                return result ?? null;
            }
            return null;
        },
        services,
        requiredState
    ));

    connection.languages.callHierarchy.onIncomingCalls(createHierarchyRequestHandler(
        async (services, params, cancelToken) => {
            if (services.lsp?.CallHierarchyProvider) {
                const result = await services.lsp.CallHierarchyProvider.incomingCalls(params, cancelToken);
                return result ?? null;
            }
            return null;
        },
        services,
        requiredState
    ));

    connection.languages.callHierarchy.onOutgoingCalls(createHierarchyRequestHandler(
        async (services, params, cancelToken) => {
            if (services.lsp?.CallHierarchyProvider) {
                const result = await services.lsp.CallHierarchyProvider.outgoingCalls(params, cancelToken);
                return result ?? null;
            }
            return null;
        },
        services,
        requiredState
    ));
}

export function addTypeHierarchyHandler(connection: Connection, sharedServices: LangiumSharedServices, requiredState: ServiceRequirement = WorkspaceState.IndexedReferences): void {
    // Don't register type hierarchy handlers if no type hierarchy provider is registered
    if (!sharedServices.ServiceRegistry.all.some((services: LangiumCoreAndPartialLSPServices) => services.lsp?.TypeHierarchyProvider)) {
        return;
    }

    connection.languages.typeHierarchy.onPrepare(
        createServerRequestHandler(
            async (services, document, params, cancelToken) => {
                const result = await services.lsp?.TypeHierarchyProvider?.prepareTypeHierarchy(document, params, cancelToken);
                return result ?? null;
            },
            sharedServices,
            requiredState
        ),
    );

    connection.languages.typeHierarchy.onSupertypes(
        createHierarchyRequestHandler(
            async (services, params, cancelToken) => {
                const result = await services.lsp?.TypeHierarchyProvider?.supertypes(params, cancelToken);
                return result ?? null;
            },
            sharedServices,
            requiredState
        ),
    );

    connection.languages.typeHierarchy.onSubtypes(
        createHierarchyRequestHandler(
            async (services, params, cancelToken) => {
                const result = await services.lsp?.TypeHierarchyProvider?.subtypes(params, cancelToken);
                return result ?? null;
            },
            sharedServices,
            requiredState
        ),
    );
}

export function createHierarchyRequestHandler<P extends TypeHierarchySupertypesParams | TypeHierarchySubtypesParams | CallHierarchyIncomingCallsParams | CallHierarchyOutgoingCallsParams, R, PR, E = void>(
    serviceCall: (services: LangiumCoreAndPartialLSPServices, params: P, cancelToken: CancellationToken) => HandlerResult<R, E>,
    sharedServices: LangiumSharedServices,
    requiredState?: ServiceRequirement
): ServerRequestHandler<P, R, PR, E> {
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params: P, cancelToken: CancellationToken) => {
        const uri = URI.parse(params.item.uri);
        const cancellationError = await waitUntilPhase<E>(sharedServices, cancelToken, uri, requiredState);
        if (cancellationError) {
            return cancellationError;
        }
        if (!serviceRegistry.hasServices(uri)) {
            const errorText = `Could not find service instance for uri: '${uri}'`;
            console.debug(errorText);
            return responseError<E>(new Error(errorText));
        }
        const language = serviceRegistry.getServices(uri);
        try {
            return await serviceCall(language, params, cancelToken);
        } catch (err) {
            return responseError<E>(err);
        }
    };
}

export function createServerRequestHandler<P extends { textDocument: TextDocumentIdentifier }, R, PR, E = void>(
    serviceCall: (services: LangiumCoreAndPartialLSPServices, document: LangiumDocument, params: P, cancelToken: CancellationToken) => HandlerResult<R, E>,
    sharedServices: LangiumSharedServices,
    requiredState?: ServiceRequirement
): ServerRequestHandler<P, R, PR, E> {
    const documents = sharedServices.workspace.LangiumDocuments;
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params: P, cancelToken: CancellationToken) => {
        const uri = URI.parse(params.textDocument.uri);
        const cancellationError = await waitUntilPhase<E>(sharedServices, cancelToken, uri, requiredState);
        if (cancellationError) {
            return cancellationError;
        }
        if (!serviceRegistry.hasServices(uri)) {
            const errorText = `Could not find service instance for uri: '${uri}'`;
            console.debug(errorText);
            return responseError<E>(new Error(errorText));
        }
        const language = serviceRegistry.getServices(uri);
        try {
            const document = await documents.getOrCreateDocument(uri);
            return await serviceCall(language, document, params, cancelToken);
        } catch (err) {
            return responseError<E>(err);
        }
    };
}

export function createRequestHandler<P extends { textDocument: TextDocumentIdentifier }, R, E = void>(
    serviceCall: (services: LangiumCoreAndPartialLSPServices, document: LangiumDocument, params: P, cancelToken: CancellationToken) => HandlerResult<R, E>,
    sharedServices: LangiumSharedServices,
    requiredState?: ServiceRequirement
): RequestHandler<P, R | null, E> {
    const documents = sharedServices.workspace.LangiumDocuments;
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params: P, cancelToken: CancellationToken) => {
        const uri = URI.parse(params.textDocument.uri);
        const cancellationError = await waitUntilPhase<E>(sharedServices, cancelToken, uri, requiredState);
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
        } catch (err) {
            return responseError<E>(err);
        }
    };
}

async function waitUntilPhase<E>(services: LangiumSharedServices, cancelToken: CancellationToken, uri?: URI, requiredState?: ServiceRequirement): Promise<ResponseError<E> | undefined> {
    if (requiredState !== undefined) {
        const documentBuilder = services.workspace.DocumentBuilder;
        const workspaceManager = services.workspace.WorkspaceManager;
        try {
            await workspaceManager.ready; // mandatory if awaiting the state of a document (uri !== undefined) while the LS is starting
            if (isDocumentState(requiredState)) {
                await documentBuilder.waitUntil(requiredState, uri, cancelToken);
            } else if (requiredState.type === 'document') {
                await documentBuilder.waitUntil(requiredState.state, uri, cancelToken);
            } else {
                await documentBuilder.waitUntil(requiredState.state, cancelToken);
            }
        } catch (err) {
            return responseError(err);
        }
    }
    return undefined;
}

function responseError<E = void>(err: unknown): ResponseError<E> {
    if (isOperationCancelled(err)) {
        return new ResponseError(LSPErrorCodes.RequestCancelled, 'The request has been cancelled.');
    }
    if (err instanceof ResponseError) {
        return err;
    }
    throw err;
}
