/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { DidChangeWatchedFilesNotification, FileChangeType } from 'vscode-languageserver';
import { stream } from '../utils/stream.js';
import { URI } from '../utils/uri-utils.js';
import { Emitter } from '../utils/event.js';
export class DefaultDocumentUpdateHandler {
    constructor(services) {
        this.onWatchedFilesChangeEmitter = new Emitter();
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
    registerFileWatcher(services) {
        const watchers = this.getWatchers();
        if (watchers.length > 0) {
            const connection = services.lsp.Connection;
            const options = { watchers };
            connection?.client.register(DidChangeWatchedFilesNotification.type, options);
        }
    }
    getWatchers() {
        return [{
                // We need to watch all file changes in the workspace
                // Otherwise we miss changes to directories
                // This is a limitation of specific language client implementations
                globPattern: '**/*'
            }];
    }
    fireDocumentUpdate(changed, deleted) {
        // Only fire the document update when the workspace manager is ready
        // Otherwise, we might miss the initial indexing of the workspace
        this.workspaceManager.ready.then(() => {
            this.workspaceLock.write(token => this.documentBuilder.update(changed, deleted, token));
        }).catch(err => {
            // This should never happen, but if it does, we want to know about it
            console.error('Workspace initialization failed. Could not perform document update.', err);
        });
    }
    didChangeContent(change) {
        this.fireDocumentUpdate([URI.parse(change.document.uri)], []);
    }
    didChangeWatchedFiles(params) {
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
    get onWatchedFilesChange() {
        return this.onWatchedFilesChangeEmitter.event;
    }
}
//# sourceMappingURL=document-update-handler.js.map