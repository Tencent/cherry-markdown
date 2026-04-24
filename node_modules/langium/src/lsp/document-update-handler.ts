/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type {
    DidChangeWatchedFilesParams, DidChangeWatchedFilesRegistrationOptions, Disposable, Event, TextDocumentChangeEvent, TextDocumentWillSaveEvent, TextEdit, FileSystemWatcher
} from 'vscode-languageserver';
import { DidChangeWatchedFilesNotification, FileChangeType } from 'vscode-languageserver';
import { stream } from '../utils/stream.js';
import { URI } from '../utils/uri-utils.js';
import type { DocumentBuilder } from '../workspace/document-builder.js';
import type { TextDocument } from '../workspace/documents.js';
import type { WorkspaceLock } from '../workspace/workspace-lock.js';
import type { LangiumSharedServices } from './lsp-services.js';
import type { WorkspaceManager } from '../workspace/workspace-manager.js';
import type { ServiceRegistry } from '../service-registry.js';
import type { MaybePromise } from '../utils/promise-utils.js';
import { Emitter } from '../utils/event.js';

/**
 * Shared service for handling text document changes and watching relevant files.
 */
export interface DocumentUpdateHandler {

    /**
     * A document open event was triggered by the `TextDocuments` service.
     * @param event The document change event.
     */
    didOpenDocument?(event: TextDocumentChangeEvent<TextDocument>): void;

    /**
     * A content change event was triggered by the `TextDocuments` service.
     * @param event The document change event.
     */
    didChangeContent?(event: TextDocumentChangeEvent<TextDocument>): void;

    /**
     * A document save event (initiated) was triggered by the `TextDocuments` service.
     * @param event The document change event.
     */
    willSaveDocument?(event: TextDocumentWillSaveEvent<TextDocument>): void;

    /**
     * A document save event (initiated) was triggered by the `TextDocuments` service.
     * @param event The document change event.
     * @returns An array of text edits which will be applied to the document before it is saved.
     */
    willSaveDocumentWaitUntil?(event: TextDocumentWillSaveEvent<TextDocument>): MaybePromise<TextEdit[]>;

    /**
     * A document save event (completed) was triggered by the `TextDocuments` service.
     * @param event The document change event.
     */
    didSaveDocument?(event: TextDocumentChangeEvent<TextDocument>): void;

    /**
     * A document close event was triggered by the `TextDocuments` service.
     * @param event The document change event.
     */
    didCloseDocument?(event: TextDocumentChangeEvent<TextDocument>): void;

    /**
     * The client detected changes to files and folders watched by the language client.
     * @param params The files/folders change event.
     */
    didChangeWatchedFiles?(params: DidChangeWatchedFilesParams): void;

    /**
     * Register a listener for raw file system changes. Which changes are actually reported
     * depends on the file system watcher configuration.
     */
    onWatchedFilesChange(callback: (params: DidChangeWatchedFilesParams) => void): Disposable;

}

export class DefaultDocumentUpdateHandler implements DocumentUpdateHandler {

    protected readonly workspaceManager: WorkspaceManager;
    protected readonly documentBuilder: DocumentBuilder;
    protected readonly workspaceLock: WorkspaceLock;
    protected readonly serviceRegistry: ServiceRegistry;
    protected readonly onWatchedFilesChangeEmitter = new Emitter<DidChangeWatchedFilesParams>();

    constructor(services: LangiumSharedServices) {
        this.workspaceManager = services.workspace.WorkspaceManager;
        this.documentBuilder = services.workspace.DocumentBuilder;
        this.workspaceLock = services.workspace.WorkspaceLock;
        this.serviceRegistry = services.ServiceRegistry;

        let canRegisterFileWatcher = false;
        services.lsp.LanguageServer.onInitialize(params => {
            canRegisterFileWatcher = Boolean(params.capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration);
        });

        services.lsp.LanguageServer.onInitialized(_params => {
            if (canRegisterFileWatcher) {
                this.registerFileWatcher(services);
            }
        });
    }

    protected registerFileWatcher(services: LangiumSharedServices): void {
        const watchers = this.getWatchers();
        if (watchers.length > 0) {
            const connection = services.lsp.Connection;
            const options: DidChangeWatchedFilesRegistrationOptions = { watchers };
            connection?.client.register(DidChangeWatchedFilesNotification.type, options);
        }
    }

    protected getWatchers(): FileSystemWatcher[] {
        return [{
            // We need to watch all file changes in the workspace
            // Otherwise we miss changes to directories
            // This is a limitation of specific language client implementations
            globPattern: '**/*'
        }];
    }

    protected fireDocumentUpdate(changed: URI[], deleted: URI[]): void {
        // Only fire the document update when the workspace manager is ready
        // Otherwise, we might miss the initial indexing of the workspace
        this.workspaceManager.ready.then(() => {
            this.workspaceLock.write(token => this.documentBuilder.update(changed, deleted, token));
        }).catch(err => {
            // This should never happen, but if it does, we want to know about it
            console.error('Workspace initialization failed. Could not perform document update.', err);
        });
    }

    didChangeContent(change: TextDocumentChangeEvent<TextDocument>): void {
        this.fireDocumentUpdate([URI.parse(change.document.uri)], []);
    }

    didChangeWatchedFiles(params: DidChangeWatchedFilesParams): void {
        this.onWatchedFilesChangeEmitter.fire(params);
        const changedUris = stream(params.changes)
            .filter(c => c.type !== FileChangeType.Deleted)
            .distinct(c => c.uri)
            .map(c => URI.parse(c.uri))
            .toArray();
        const deletedUris = stream(params.changes)
            .filter(c => c.type === FileChangeType.Deleted)
            .distinct(c => c.uri)
            .map(c => URI.parse(c.uri))
            .toArray();
        this.fireDocumentUpdate(changedUris, deletedUris);
    }

    get onWatchedFilesChange(): Event<DidChangeWatchedFilesParams> {
        return this.onWatchedFilesChangeEmitter.event;
    }
}
