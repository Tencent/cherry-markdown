/******************************************************************************
 * Copyright 2024 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { TextDocumentSyncKind, Disposable, Emitter } from 'vscode-languageserver';
import { UriUtils } from '../utils/uri-utils.js';
// Adapted from:
// https://github.com/microsoft/vscode-languageserver-node/blob/8f5fa710d3a9f60ff5e7583a9e61b19f86e39da3/server/src/common/textDocuments.ts
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/**
 * Normalizing text document manager. Normalizes all incoming URIs to the same format used by VS Code.
 */
export class NormalizedTextDocuments {
    constructor(configuration) {
        this._configuration = configuration;
        this._syncedDocuments = new Map();
        this._onDidChangeContent = new Emitter();
        this._onDidOpen = new Emitter();
        this._onDidClose = new Emitter();
        this._onDidSave = new Emitter();
        this._onWillSave = new Emitter();
    }
    get onDidOpen() {
        return this._onDidOpen.event;
    }
    get onDidChangeContent() {
        return this._onDidChangeContent.event;
    }
    get onWillSave() {
        return this._onWillSave.event;
    }
    onWillSaveWaitUntil(handler) {
        this._willSaveWaitUntil = handler;
    }
    get onDidSave() {
        return this._onDidSave.event;
    }
    get onDidClose() {
        return this._onDidClose.event;
    }
    get(uri) {
        return this._syncedDocuments.get(UriUtils.normalize(uri));
    }
    set(document) {
        const uri = UriUtils.normalize(document.uri);
        let result = true;
        if (this._syncedDocuments.has(uri)) {
            result = false;
        }
        this._syncedDocuments.set(uri, document);
        const toFire = Object.freeze({ document });
        this._onDidOpen.fire(toFire);
        this._onDidChangeContent.fire(toFire);
        return result;
    }
    delete(uri) {
        const uriString = UriUtils.normalize(typeof uri === 'object' && 'uri' in uri ? uri.uri : uri);
        const syncedDocument = this._syncedDocuments.get(uriString);
        if (syncedDocument !== undefined) {
            this._syncedDocuments.delete(uriString);
            this._onDidClose.fire(Object.freeze({ document: syncedDocument }));
        }
    }
    all() {
        return Array.from(this._syncedDocuments.values());
    }
    keys() {
        return Array.from(this._syncedDocuments.keys());
    }
    listen(connection) {
        // Required for interoperability with the the vscode-languageserver package
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection.__textDocumentSync = TextDocumentSyncKind.Incremental;
        const disposables = [];
        disposables.push(connection.onDidOpenTextDocument((event) => {
            const td = event.textDocument;
            const uri = UriUtils.normalize(td.uri);
            const document = this._configuration.create(uri, td.languageId, td.version, td.text);
            this._syncedDocuments.set(uri, document);
            const toFire = Object.freeze({ document });
            this._onDidOpen.fire(toFire);
            this._onDidChangeContent.fire(toFire);
        }));
        disposables.push(connection.onDidChangeTextDocument((event) => {
            const td = event.textDocument;
            const changes = event.contentChanges;
            if (changes.length === 0) {
                return;
            }
            const { version } = td;
            if (version === null || version === undefined) {
                throw new Error(`Received document change event for ${td.uri} without valid version identifier`);
            }
            const uri = UriUtils.normalize(td.uri);
            let syncedDocument = this._syncedDocuments.get(uri);
            if (syncedDocument !== undefined) {
                syncedDocument = this._configuration.update(syncedDocument, changes, version);
                this._syncedDocuments.set(uri, syncedDocument);
                this._onDidChangeContent.fire(Object.freeze({ document: syncedDocument }));
            }
        }));
        disposables.push(connection.onDidCloseTextDocument((event) => {
            const uri = UriUtils.normalize(event.textDocument.uri);
            const syncedDocument = this._syncedDocuments.get(uri);
            if (syncedDocument !== undefined) {
                this._syncedDocuments.delete(uri);
                this._onDidClose.fire(Object.freeze({ document: syncedDocument }));
            }
        }));
        disposables.push(connection.onWillSaveTextDocument((event) => {
            const syncedDocument = this._syncedDocuments.get(UriUtils.normalize(event.textDocument.uri));
            if (syncedDocument !== undefined) {
                this._onWillSave.fire(Object.freeze({ document: syncedDocument, reason: event.reason }));
            }
        }));
        disposables.push(connection.onWillSaveTextDocumentWaitUntil((event, token) => {
            const syncedDocument = this._syncedDocuments.get(UriUtils.normalize(event.textDocument.uri));
            if (syncedDocument !== undefined && this._willSaveWaitUntil) {
                return this._willSaveWaitUntil(Object.freeze({ document: syncedDocument, reason: event.reason }), token);
            }
            else {
                return [];
            }
        }));
        disposables.push(connection.onDidSaveTextDocument((event) => {
            const syncedDocument = this._syncedDocuments.get(UriUtils.normalize(event.textDocument.uri));
            if (syncedDocument !== undefined) {
                this._onDidSave.fire(Object.freeze({ document: syncedDocument }));
            }
        }));
        return Disposable.create(() => { disposables.forEach(disposable => disposable.dispose()); });
    }
}
export class NormalizedNotebookDocuments {
    constructor(configurationOrTextDocuments) {
        this.notebookDocuments = new Map();
        this.notebookCellMap = new Map();
        this._onDidOpen = new Emitter();
        this._onDidSave = new Emitter();
        this._onDidChange = new Emitter();
        this._onDidClose = new Emitter();
        if ('listen' in configurationOrTextDocuments) {
            this._cellTextDocuments = configurationOrTextDocuments;
        }
        else {
            this._cellTextDocuments = new NormalizedTextDocuments(configurationOrTextDocuments);
        }
    }
    get cellTextDocuments() {
        return this._cellTextDocuments;
    }
    getCellTextDocument(cell) {
        return this._cellTextDocuments.get(cell.document);
    }
    getNotebookDocument(uri) {
        return this.notebookDocuments.get(UriUtils.normalize(uri));
    }
    getNotebookCell(uri) {
        const value = this.notebookCellMap.get(UriUtils.normalize(uri));
        return value && value[0];
    }
    findNotebookDocumentForCell(cell) {
        const key = typeof cell === 'string' || 'scheme' in cell ? cell : cell.document;
        const value = this.notebookCellMap.get(UriUtils.normalize(key));
        return value && value[1];
    }
    get onDidOpen() {
        return this._onDidOpen.event;
    }
    get onDidSave() {
        return this._onDidSave.event;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get onDidClose() {
        return this._onDidClose.event;
    }
    /**
     * Listens for `low level` notification on the given connection to
     * update the notebook documents managed by this instance.
     *
     * Please note that the connection only provides handlers not an event model. Therefore
     * listening on a connection will overwrite the following handlers on a connection:
     * `onDidOpenNotebookDocument`, `onDidChangeNotebookDocument`, `onDidSaveNotebookDocument`,
     *  and `onDidCloseNotebookDocument`.
     *
     * @param connection The connection to listen on.
     */
    listen(connection) {
        const cellTextDocumentConnection = new CellTextDocumentConnection();
        const disposables = [];
        disposables.push(this.cellTextDocuments.listen(cellTextDocumentConnection));
        disposables.push(connection.notebooks.synchronization.onDidOpenNotebookDocument((params) => {
            const uri = UriUtils.normalize(params.notebookDocument.uri);
            this.notebookDocuments.set(uri, params.notebookDocument);
            for (const cellTextDocument of params.cellTextDocuments) {
                cellTextDocumentConnection.openTextDocument({ textDocument: cellTextDocument });
            }
            this.updateCellMap(params.notebookDocument);
            this._onDidOpen.fire(params.notebookDocument);
        }));
        disposables.push(connection.notebooks.synchronization.onDidChangeNotebookDocument((params) => {
            const uri = UriUtils.normalize(params.notebookDocument.uri);
            const notebookDocument = this.notebookDocuments.get(uri);
            if (notebookDocument === undefined) {
                return;
            }
            notebookDocument.version = params.notebookDocument.version;
            const oldMetadata = notebookDocument.metadata;
            let metadataChanged = false;
            const change = params.change;
            if (change.metadata !== undefined) {
                metadataChanged = true;
                notebookDocument.metadata = change.metadata;
            }
            const opened = [];
            const closed = [];
            const data = [];
            const text = [];
            if (change.cells !== undefined) {
                const changedCells = change.cells;
                if (changedCells.structure !== undefined) {
                    const array = changedCells.structure.array;
                    notebookDocument.cells.splice(array.start, array.deleteCount, ...(array.cells !== undefined ? array.cells : []));
                    // Additional open cell text documents.
                    if (changedCells.structure.didOpen !== undefined) {
                        for (const open of changedCells.structure.didOpen) {
                            cellTextDocumentConnection.openTextDocument({ textDocument: open });
                            opened.push(open.uri);
                        }
                    }
                    // Additional closed cell test documents.
                    if (changedCells.structure.didClose) {
                        for (const close of changedCells.structure.didClose) {
                            cellTextDocumentConnection.closeTextDocument({ textDocument: close });
                            closed.push(close.uri);
                        }
                    }
                }
                if (changedCells.data !== undefined) {
                    const cellUpdates = new Map(changedCells.data.map(cell => [cell.document, cell]));
                    for (let i = 0; i <= notebookDocument.cells.length; i++) {
                        const change = cellUpdates.get(notebookDocument.cells[i].document);
                        if (change !== undefined) {
                            const old = notebookDocument.cells.splice(i, 1, change);
                            data.push({ old: old[0], new: change });
                            cellUpdates.delete(change.document);
                            if (cellUpdates.size === 0) {
                                break;
                            }
                        }
                    }
                }
                if (changedCells.textContent !== undefined) {
                    for (const cellTextDocument of changedCells.textContent) {
                        cellTextDocumentConnection.changeTextDocument({ textDocument: cellTextDocument.document, contentChanges: cellTextDocument.changes });
                        text.push(cellTextDocument.document.uri);
                    }
                }
            }
            // Update internal data structure.
            this.updateCellMap(notebookDocument);
            const changeEvent = { notebookDocument };
            if (metadataChanged) {
                changeEvent.metadata = { old: oldMetadata, new: notebookDocument.metadata };
            }
            const added = [];
            for (const open of opened) {
                added.push(this.getNotebookCell(open));
            }
            const removed = [];
            for (const close of closed) {
                removed.push(this.getNotebookCell(close));
            }
            const textContent = [];
            for (const change of text) {
                textContent.push(this.getNotebookCell(change));
            }
            if (added.length > 0 || removed.length > 0 || data.length > 0 || textContent.length > 0) {
                changeEvent.cells = { added, removed, changed: { data, textContent } };
            }
            if (changeEvent.metadata !== undefined || changeEvent.cells !== undefined) {
                this._onDidChange.fire(changeEvent);
            }
        }));
        disposables.push(connection.notebooks.synchronization.onDidSaveNotebookDocument((params) => {
            const notebookDocument = this.getNotebookDocument(params.notebookDocument.uri);
            if (notebookDocument === undefined) {
                return;
            }
            this._onDidSave.fire(notebookDocument);
        }));
        disposables.push(connection.notebooks.synchronization.onDidCloseNotebookDocument((params) => {
            const uri = UriUtils.normalize(params.notebookDocument.uri);
            const notebookDocument = this.notebookDocuments.get(uri);
            if (notebookDocument === undefined) {
                return;
            }
            this._onDidClose.fire(notebookDocument);
            for (const cellTextDocument of params.cellTextDocuments) {
                cellTextDocumentConnection.closeTextDocument({ textDocument: cellTextDocument });
            }
            this.notebookDocuments.delete(uri);
            for (const cell of notebookDocument.cells) {
                this.notebookCellMap.delete(cell.document);
            }
        }));
        return Disposable.create(() => { disposables.forEach(disposable => disposable.dispose()); });
    }
    updateCellMap(notebookDocument) {
        for (const cell of notebookDocument.cells) {
            this.notebookCellMap.set(cell.document, [cell, notebookDocument]);
        }
    }
}
class CellTextDocumentConnection {
    onDidOpenTextDocument(handler) {
        this.openHandler = handler;
        return Disposable.create(() => { this.openHandler = undefined; });
    }
    openTextDocument(params) {
        this.openHandler && this.openHandler(params);
    }
    onDidChangeTextDocument(handler) {
        this.changeHandler = handler;
        return Disposable.create(() => { this.changeHandler = handler; });
    }
    changeTextDocument(params) {
        this.changeHandler && this.changeHandler(params);
    }
    onDidCloseTextDocument(handler) {
        this.closeHandler = handler;
        return Disposable.create(() => { this.closeHandler = undefined; });
    }
    closeTextDocument(params) {
        this.closeHandler && this.closeHandler(params);
    }
    onWillSaveTextDocument() {
        return CellTextDocumentConnection.NULL_DISPOSE;
    }
    onWillSaveTextDocumentWaitUntil() {
        return CellTextDocumentConnection.NULL_DISPOSE;
    }
    onDidSaveTextDocument() {
        return CellTextDocumentConnection.NULL_DISPOSE;
    }
}
CellTextDocumentConnection.NULL_DISPOSE = Object.freeze({ dispose: () => { } });
//# sourceMappingURL=normalized-text-documents.js.map