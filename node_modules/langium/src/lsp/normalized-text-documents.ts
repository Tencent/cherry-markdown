/******************************************************************************
 * Copyright 2024 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type {
    Connection, DidOpenTextDocumentParams, DidChangeTextDocumentParams, DidCloseTextDocumentParams, TextDocumentsConfiguration, TextDocumentChangeEvent,
    TextDocumentWillSaveEvent, RequestHandler, TextEdit, Event, WillSaveTextDocumentParams, CancellationToken, DidSaveTextDocumentParams,
    NotebookCell,
    NotebookDocument,
    DocumentUri,
    NotificationHandler
} from 'vscode-languageserver';
import { TextDocumentSyncKind, Disposable, Emitter } from 'vscode-languageserver';
import type { URI } from '../utils/uri-utils.js';
import { UriUtils } from '../utils/uri-utils.js';
// For some reason, this isn't exported by vscode-languageserver
import type { NotebookDocumentChangeEvent } from 'vscode-languageserver/lib/common/notebook.js';

export type TextDocumentConnection = Pick<Connection,
'onDidOpenTextDocument' |
'onDidChangeTextDocument' |
'onDidCloseTextDocument' |
'onWillSaveTextDocument' |
'onWillSaveTextDocumentWaitUntil' |
'onDidSaveTextDocument'
>;

/**
 * A manager service that keeps track of all currently opened text documents.
 *
 * Designed to be compatible with the `TextDocuments` class in the `vscode-languageserver` package.
 */
export interface TextDocuments<T extends { uri: string }> {
    /**
     * An event that fires when a text document managed by this manager
     * has been opened.
     */
    readonly onDidOpen: Event<TextDocumentChangeEvent<T>>;
    /**
     * An event that fires when a text document managed by this manager
     * has been opened or the content changes.
     */
    readonly onDidChangeContent: Event<TextDocumentChangeEvent<T>>;
    /**
     * An event that fires when a text document managed by this manager
     * will be saved.
     */
    readonly onWillSave: Event<TextDocumentWillSaveEvent<T>>;
    /**
     * Sets a handler that will be called if a participant wants to provide
     * edits during a text document save.
     */
    onWillSaveWaitUntil(handler: RequestHandler<TextDocumentWillSaveEvent<T>, TextEdit[], void>): void;
    /**
     * An event that fires when a text document managed by this manager
     * has been saved.
     */
    readonly onDidSave: Event<TextDocumentChangeEvent<T>>;
    /**
     * An event that fires when a text document managed by this manager
     * has been closed.
     */
    readonly onDidClose: Event<TextDocumentChangeEvent<T>>;
    /**
     * Returns the document for the given URI. Returns undefined if
     * the document is not managed by this instance.
     *
     * @param uri The text document's URI to retrieve.
     * @return the text document or `undefined`.
     */
    get(uri: string | URI): T | undefined;
    /**
     * Sets the text document managed by this instance.
     * @param document The text document to add.
     * @returns `true` if the document didn't exist yet, `false` if it was already present.
     */
    set(document: T): boolean;
    /**
     * Deletes a text document managed by this instance.
     */
    delete(uri: string | URI | T): void;
    /**
     * Returns all text documents managed by this instance.
     *
     * @return all text documents.
     */
    all(): T[];
    /**
     * Returns the URIs of all text documents managed by this instance.
     *
     * @return the URI's of all text documents.
     */
    keys(): string[];
    /**
     * Listens for `low level` notification on the given connection to
     * update the text documents managed by this instance.
     *
     * Please note that the connection only provides handlers not an event model. Therefore
     * listening on a connection will overwrite the following handlers on a connection:
     * `onDidOpenTextDocument`, `onDidChangeTextDocument`, `onDidCloseTextDocument`,
     * `onWillSaveTextDocument`, `onWillSaveTextDocumentWaitUntil` and `onDidSaveTextDocument`.
     *
     * Use the corresponding events on the TextDocuments instance instead.
     *
     * @param connection The connection to listen on.
     */
    listen(connection: TextDocumentConnection): Disposable;
}

// Adapted from:
// https://github.com/microsoft/vscode-languageserver-node/blob/8f5fa710d3a9f60ff5e7583a9e61b19f86e39da3/server/src/common/textDocuments.ts

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/**
 * Normalizing text document manager. Normalizes all incoming URIs to the same format used by VS Code.
 */
export class NormalizedTextDocuments<T extends { uri: string }> implements TextDocuments<T> {

    private readonly _configuration: TextDocumentsConfiguration<T>;

    private readonly _syncedDocuments: Map<string, T>;

    private readonly _onDidChangeContent: Emitter<TextDocumentChangeEvent<T>>;
    private readonly _onDidOpen: Emitter<TextDocumentChangeEvent<T>>;
    private readonly _onDidClose: Emitter<TextDocumentChangeEvent<T>>;
    private readonly _onDidSave: Emitter<TextDocumentChangeEvent<T>>;
    private readonly _onWillSave: Emitter<TextDocumentWillSaveEvent<T>>;
    private _willSaveWaitUntil: RequestHandler<TextDocumentWillSaveEvent<T>, TextEdit[], void> | undefined;

    public constructor(configuration: TextDocumentsConfiguration<T>) {
        this._configuration = configuration;
        this._syncedDocuments = new Map();

        this._onDidChangeContent = new Emitter<TextDocumentChangeEvent<T>>();
        this._onDidOpen = new Emitter<TextDocumentChangeEvent<T>>();
        this._onDidClose = new Emitter<TextDocumentChangeEvent<T>>();
        this._onDidSave = new Emitter<TextDocumentChangeEvent<T>>();
        this._onWillSave = new Emitter<TextDocumentWillSaveEvent<T>>();
    }

    public get onDidOpen(): Event<TextDocumentChangeEvent<T>> {
        return this._onDidOpen.event;
    }

    public get onDidChangeContent(): Event<TextDocumentChangeEvent<T>> {
        return this._onDidChangeContent.event;
    }

    public get onWillSave(): Event<TextDocumentWillSaveEvent<T>> {
        return this._onWillSave.event;
    }

    public onWillSaveWaitUntil(handler: RequestHandler<TextDocumentWillSaveEvent<T>, TextEdit[], void>) {
        this._willSaveWaitUntil = handler;
    }

    public get onDidSave(): Event<TextDocumentChangeEvent<T>> {
        return this._onDidSave.event;
    }

    public get onDidClose(): Event<TextDocumentChangeEvent<T>> {
        return this._onDidClose.event;
    }

    public get(uri: string | URI): T | undefined {
        return this._syncedDocuments.get(UriUtils.normalize(uri));
    }

    public set(document: T): boolean {
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

    public delete(uri: string | T | URI): void {
        const uriString = UriUtils.normalize(typeof uri === 'object' && 'uri' in uri ? uri.uri : uri);
        const syncedDocument = this._syncedDocuments.get(uriString);
        if (syncedDocument !== undefined) {
            this._syncedDocuments.delete(uriString);
            this._onDidClose.fire(Object.freeze({ document: syncedDocument }));
        }
    }

    public all(): T[] {
        return Array.from(this._syncedDocuments.values());
    }

    public keys(): string[] {
        return Array.from(this._syncedDocuments.keys());
    }

    public listen(connection: Connection): Disposable {
        // Required for interoperability with the the vscode-languageserver package
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (connection as any).__textDocumentSync = TextDocumentSyncKind.Incremental;
        const disposables: Disposable[] = [];
        disposables.push(connection.onDidOpenTextDocument((event: DidOpenTextDocumentParams) => {
            const td = event.textDocument;
            const uri = UriUtils.normalize(td.uri);
            const document = this._configuration.create(uri, td.languageId, td.version, td.text);

            this._syncedDocuments.set(uri, document);
            const toFire = Object.freeze({ document });
            this._onDidOpen.fire(toFire);
            this._onDidChangeContent.fire(toFire);
        }));
        disposables.push(connection.onDidChangeTextDocument((event: DidChangeTextDocumentParams) => {
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
        disposables.push(connection.onDidCloseTextDocument((event: DidCloseTextDocumentParams) => {
            const uri = UriUtils.normalize(event.textDocument.uri);
            const syncedDocument = this._syncedDocuments.get(uri);
            if (syncedDocument !== undefined) {
                this._syncedDocuments.delete(uri);
                this._onDidClose.fire(Object.freeze({ document: syncedDocument }));
            }
        }));
        disposables.push(connection.onWillSaveTextDocument((event: WillSaveTextDocumentParams) => {
            const syncedDocument = this._syncedDocuments.get(UriUtils.normalize(event.textDocument.uri));
            if (syncedDocument !== undefined) {
                this._onWillSave.fire(Object.freeze({ document: syncedDocument, reason: event.reason }));
            }
        }));
        disposables.push(connection.onWillSaveTextDocumentWaitUntil((event: WillSaveTextDocumentParams, token: CancellationToken) => {
            const syncedDocument = this._syncedDocuments.get(UriUtils.normalize(event.textDocument.uri));
            if (syncedDocument !== undefined && this._willSaveWaitUntil) {
                return this._willSaveWaitUntil(Object.freeze({ document: syncedDocument, reason: event.reason }), token);
            } else {
                return [];
            }
        }));
        disposables.push(connection.onDidSaveTextDocument((event: DidSaveTextDocumentParams) => {
            const syncedDocument = this._syncedDocuments.get(UriUtils.normalize(event.textDocument.uri));
            if (syncedDocument !== undefined) {
                this._onDidSave.fire(Object.freeze({ document: syncedDocument }));
            }
        }));
        return Disposable.create(() => { disposables.forEach(disposable => disposable.dispose()); });
    }
}

export interface NotebookDocuments<T extends { uri: string }> {
    get cellTextDocuments(): TextDocuments<T>;
    getCellTextDocument(cell: NotebookCell): T | undefined;
    getNotebookDocument(uri: string | URI): NotebookDocument | undefined;
    getNotebookCell(uri: string | URI): NotebookCell | undefined;
    findNotebookDocumentForCell(cell: string | URI | NotebookCell): NotebookDocument | undefined;
    get onDidOpen(): Event<NotebookDocument>;
    get onDidSave(): Event<NotebookDocument>;
    get onDidChange(): Event<NotebookDocumentChangeEvent>;
    get onDidClose(): Event<NotebookDocument>;
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
    listen(connection: Connection): Disposable;
}

export class NormalizedNotebookDocuments<T extends { uri: DocumentUri }> implements NotebookDocuments<T> {

    private readonly notebookDocuments = new Map<DocumentUri, NotebookDocument>();
    private readonly notebookCellMap = new Map<DocumentUri, [NotebookCell, NotebookDocument]>();

    private readonly _onDidOpen = new Emitter<NotebookDocument>();
    private readonly _onDidSave = new Emitter<NotebookDocument>();
    private readonly _onDidChange = new Emitter<NotebookDocumentChangeEvent>();
    private readonly _onDidClose = new Emitter<NotebookDocument>();

    private readonly _cellTextDocuments: TextDocuments<T>;

    constructor(configurationOrTextDocuments: TextDocumentsConfiguration<T> | TextDocuments<T>) {
        if ('listen' in configurationOrTextDocuments) {
            this._cellTextDocuments = configurationOrTextDocuments;
        } else {
            this._cellTextDocuments = new NormalizedTextDocuments<T>(configurationOrTextDocuments);
        }
    }

    get cellTextDocuments(): TextDocuments<T> {
        return this._cellTextDocuments;
    }

    getCellTextDocument(cell: NotebookCell): T | undefined {
        return this._cellTextDocuments.get(cell.document);
    }

    getNotebookDocument(uri: string | URI): NotebookDocument | undefined {
        return this.notebookDocuments.get(UriUtils.normalize(uri));
    }

    getNotebookCell(uri: string | URI): NotebookCell | undefined {
        const value = this.notebookCellMap.get(UriUtils.normalize(uri));
        return value && value[0];
    }

    findNotebookDocumentForCell(cell: string | URI | NotebookCell): NotebookDocument | undefined {
        const key = typeof cell === 'string' || 'scheme' in cell ? cell : cell.document;
        const value = this.notebookCellMap.get(UriUtils.normalize(key));
        return value && value[1];
    }

    get onDidOpen(): Event<NotebookDocument> {
        return this._onDidOpen.event;
    }

    get onDidSave(): Event<NotebookDocument> {
        return this._onDidSave.event;
    }

    get onDidChange(): Event<NotebookDocumentChangeEvent> {
        return this._onDidChange.event;
    }

    get onDidClose(): Event<NotebookDocument> {
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
    listen(connection: Connection): Disposable {
        const cellTextDocumentConnection = new CellTextDocumentConnection();
        const disposables: Disposable[] = [];

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
            let metadataChanged: boolean = false;
            const change = params.change;
            if (change.metadata !== undefined) {
                metadataChanged = true;
                notebookDocument.metadata = change.metadata;
            }

            const opened: DocumentUri[] = [];
            const closed: DocumentUri[] = [];
            const data: Required<Required<Required<NotebookDocumentChangeEvent>['cells']>['changed']>['data'] = [];
            const text: DocumentUri[] = [];
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
                    const cellUpdates: Map<string, NotebookCell> = new Map(changedCells.data.map(cell => [cell.document, cell]));
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

            const changeEvent: NotebookDocumentChangeEvent = { notebookDocument };
            if (metadataChanged) {
                changeEvent.metadata = { old: oldMetadata, new: notebookDocument.metadata };
            }

            const added: NotebookCell[] = [];
            for (const open of opened) {
                added.push(this.getNotebookCell(open)!);
            }
            const removed: NotebookCell[] = [];
            for (const close of closed) {
                removed.push(this.getNotebookCell(close)!);
            }
            const textContent: NotebookCell[] = [];
            for (const change of text) {
                textContent.push(this.getNotebookCell(change)!);
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

    private updateCellMap(notebookDocument: NotebookDocument): void {
        for (const cell of notebookDocument.cells) {
            this.notebookCellMap.set(cell.document, [cell, notebookDocument]);
        }
    }
}

class CellTextDocumentConnection implements TextDocumentConnection {

    private static readonly NULL_DISPOSE = Object.freeze({ dispose: () => { } });

    private openHandler: NotificationHandler<DidOpenTextDocumentParams> | undefined;
    private changeHandler: NotificationHandler<DidChangeTextDocumentParams> | undefined;
    private closeHandler: NotificationHandler<DidCloseTextDocumentParams> | undefined;

    onDidOpenTextDocument(handler: NotificationHandler<DidOpenTextDocumentParams>): Disposable {
        this.openHandler = handler;
        return Disposable.create(() => { this.openHandler = undefined; });
    }

    openTextDocument(params: DidOpenTextDocumentParams): void {
        this.openHandler && this.openHandler(params);
    }

    onDidChangeTextDocument(handler: NotificationHandler<DidChangeTextDocumentParams>): Disposable {
        this.changeHandler = handler;
        return Disposable.create(() => { this.changeHandler = handler; });
    }

    changeTextDocument(params: DidChangeTextDocumentParams): void {
        this.changeHandler && this.changeHandler(params);
    }

    onDidCloseTextDocument(handler: NotificationHandler<DidCloseTextDocumentParams>): Disposable {
        this.closeHandler = handler;
        return Disposable.create(() => { this.closeHandler = undefined; });
    }

    closeTextDocument(params: DidCloseTextDocumentParams): void {
        this.closeHandler && this.closeHandler(params);
    }

    onWillSaveTextDocument(): Disposable {
        return CellTextDocumentConnection.NULL_DISPOSE;
    }

    onWillSaveTextDocumentWaitUntil(): Disposable {
        return CellTextDocumentConnection.NULL_DISPOSE;
    }

    onDidSaveTextDocument(): Disposable {
        return CellTextDocumentConnection.NULL_DISPOSE;
    }
}
