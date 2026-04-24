/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { URI, Utils } from 'vscode-uri';

export { URI };

export namespace UriUtils {

    export const basename = Utils.basename;
    export const dirname = Utils.dirname;
    export const extname = Utils.extname;
    export const joinPath = Utils.joinPath;
    export const resolvePath = Utils.resolvePath;

    const isWindows = typeof process === 'object' && process?.platform === 'win32';

    export function equals(a?: URI | string, b?: URI | string): boolean {
        return a?.toString() === b?.toString();
    }

    export function relative(from: URI | string, to: URI | string): string {
        const fromPath = typeof from === 'string' ? URI.parse(from).path : from.path;
        const toPath   = typeof   to === 'string' ? URI.parse(to).path   : to.path;
        const fromParts = fromPath.split('/').filter(e => e.length > 0);
        const toParts   =   toPath.split('/').filter(e => e.length > 0);

        if (isWindows) {
            const upperCaseDriveLetter = /^[A-Z]:$/;
            if (fromParts[0] && upperCaseDriveLetter.test(fromParts[0])) {
                fromParts[0] = fromParts[0].toLowerCase();
            }
            if (toParts[0] && upperCaseDriveLetter.test(toParts[0])) {
                toParts[0] = toParts[0].toLowerCase();
            }
            if (fromParts[0] !== toParts[0]) {
                // in case of different drive letters, we cannot compute a relative path, so...
                return toPath.substring(1); // fall back to full 'to' path, drop the leading '/', keep everything else as is for good comparability
            }
        }

        let i = 0;
        for (; i < fromParts.length; i++) {
            if (fromParts[i] !== toParts[i]) {
                break;
            }
        }
        const backPart = '../'.repeat(fromParts.length - i);
        const toPart = toParts.slice(i).join('/');
        return backPart + toPart;
    }

    export function normalize(uri: URI | string): string {
        return URI.parse(uri.toString()).toString();
    }

    export function contains(parent: URI | string, child: URI | string): boolean {
        let parentPath = typeof parent === 'string' ? parent : parent.path;
        let childPath = typeof child === 'string' ? child : child.path;
        // Trim trailing slashes
        if (childPath.charAt(childPath.length - 1) === '/') {
            childPath = childPath.slice(0, -1);
        }
        if (parentPath.charAt(parentPath.length - 1) === '/') {
            parentPath = parentPath.slice(0, -1);
        }
        // If the paths are equal, simply return true
        if (childPath === parentPath) {
            return true;
        }
        // If the child path is shorter than the parent path, it can't be a child
        if (childPath.length < parentPath.length) {
            return false;
        }
        // If the path does not feature a slash after the parent path, it can't be a child
        if (childPath.charAt(parentPath.length) !== '/') {
            return false;
        }
        // Check if the child path starts with the parent path
        return childPath.startsWith(parentPath);
    }

}

interface InternalUriTrieNode<T> {
    name: string,
    children: Map<string, InternalUriTrieNode<T>>;
    parent?: InternalUriTrieNode<T>;
    // If this element is set, the node represents a leaf in the trie
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
export class UriTrie<T> {

    protected readonly root: InternalUriTrieNode<T> = { name: '', children: new Map() };

    protected normalizeUri(uri: URI | string): string {
        return UriUtils.normalize(uri);
    }

    clear(): void {
        this.root.children.clear();
    }

    insert(uri: URI | string, element: T): void {
        const node = this.getNode(this.normalizeUri(uri), true);
        node.element = element;
    }

    delete(uri: URI | string): void {
        const nodeToDelete = this.getNode(this.normalizeUri(uri), false);
        if (nodeToDelete?.parent) {
            nodeToDelete.parent.children.delete(nodeToDelete.name);
        }
    }

    has(uri: URI | string): boolean {
        return this.getNode(this.normalizeUri(uri), false)?.element !== undefined;
    }

    hasNode(uri: URI | string): boolean {
        return this.getNode(this.normalizeUri(uri), false) !== undefined;
    }

    find(uri: URI | string): T | undefined {
        return this.getNode(this.normalizeUri(uri), false)?.element;
    }

    findNode(uri: URI | string): UriTrieNode<T> | undefined {
        const uriString = this.normalizeUri(uri);
        const node = this.getNode(uriString, false);
        if (!node) {
            return undefined;
        }
        return {
            name: node.name,
            uri: UriUtils.joinPath(URI.parse(uriString), node.name).toString(),
            element: node.element
        };
    }

    findChildren(uri: URI | string): Array<UriTrieNode<T>> {
        const uriString = this.normalizeUri(uri);
        const node = this.getNode(uriString, false);
        if (!node) {
            return [];
        }
        return Array.from(node.children.values()).map(child => ({
            name: child.name,
            uri: UriUtils.joinPath(URI.parse(uriString), child.name).toString(),
            element: child.element
        }));
    }

    all(): T[] {
        return this.collectValues(this.root);
    }

    findAll(prefix: URI | string): T[] {
        const node = this.getNode(UriUtils.normalize(prefix), false);
        if (!node) {
            return [];
        }
        return this.collectValues(node);
    }

    protected getNode(uri: string, create: true): InternalUriTrieNode<T>;
    protected getNode(uri: string, create: false): InternalUriTrieNode<T> | undefined;
    protected getNode(uri: string, create: boolean): InternalUriTrieNode<T> | undefined {
        const parts = uri.split('/');
        if (uri.charAt(uri.length - 1) === '/') {
            // Remove the last part if the URI ends with a slash
            parts.pop();
        }
        let current = this.root;
        for (const part of parts) {
            let child = current.children.get(part);
            if (!child) {
                if (create) {
                    child = {
                        name: part,
                        children: new Map(),
                        parent: current
                    };
                    current.children.set(part, child);
                } else {
                    return undefined;
                }
            }
            current = child;
        }
        return current;
    }

    protected collectValues(node: InternalUriTrieNode<T>): T[] {
        const result: T[] = [];
        if (node.element) {
            result.push(node.element);
        }
        for (const child of node.children.values()) {
            result.push(...this.collectValues(child));
        }
        return result;
    }

}
