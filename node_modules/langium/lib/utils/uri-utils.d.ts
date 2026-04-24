/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { URI, Utils } from 'vscode-uri';
export { URI };
export declare namespace UriUtils {
    const basename: typeof Utils.basename;
    const dirname: typeof Utils.dirname;
    const extname: typeof Utils.extname;
    const joinPath: typeof Utils.joinPath;
    const resolvePath: typeof Utils.resolvePath;
    function equals(a?: URI | string, b?: URI | string): boolean;
    function relative(from: URI | string, to: URI | string): string;
    function normalize(uri: URI | string): string;
    function contains(parent: URI | string, child: URI | string): boolean;
}
interface InternalUriTrieNode<T> {
    name: string;
    children: Map<string, InternalUriTrieNode<T>>;
    parent?: InternalUriTrieNode<T>;
    element?: T;
}
export interface UriTrieNode<T> {
    name: string;
    uri: string;
    element?: T;
}
/**
 * A trie structure for URIs. It allows to insert, delete and find elements by their URI.
 * More specifically, it allows to efficiently find all elements that are children of a given URI.
 *
 * Unlike a regular trie, this implementation uses the name of the URI segments as keys.
 *
 * @see {@link https://en.wikipedia.org/wiki/Trie}
 */
export declare class UriTrie<T> {
    protected readonly root: InternalUriTrieNode<T>;
    protected normalizeUri(uri: URI | string): string;
    clear(): void;
    insert(uri: URI | string, element: T): void;
    delete(uri: URI | string): void;
    has(uri: URI | string): boolean;
    hasNode(uri: URI | string): boolean;
    find(uri: URI | string): T | undefined;
    findNode(uri: URI | string): UriTrieNode<T> | undefined;
    findChildren(uri: URI | string): Array<UriTrieNode<T>>;
    all(): T[];
    findAll(prefix: URI | string): T[];
    protected getNode(uri: string, create: true): InternalUriTrieNode<T>;
    protected getNode(uri: string, create: false): InternalUriTrieNode<T> | undefined;
    protected collectValues(node: InternalUriTrieNode<T>): T[];
}
//# sourceMappingURL=uri-utils.d.ts.map