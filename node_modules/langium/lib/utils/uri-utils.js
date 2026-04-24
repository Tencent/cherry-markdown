/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { URI, Utils } from 'vscode-uri';
export { URI };
export var UriUtils;
(function (UriUtils) {
    UriUtils.basename = Utils.basename;
    UriUtils.dirname = Utils.dirname;
    UriUtils.extname = Utils.extname;
    UriUtils.joinPath = Utils.joinPath;
    UriUtils.resolvePath = Utils.resolvePath;
    const isWindows = typeof process === 'object' && process?.platform === 'win32';
    function equals(a, b) {
        return a?.toString() === b?.toString();
    }
    UriUtils.equals = equals;
    function relative(from, to) {
        const fromPath = typeof from === 'string' ? URI.parse(from).path : from.path;
        const toPath = typeof to === 'string' ? URI.parse(to).path : to.path;
        const fromParts = fromPath.split('/').filter(e => e.length > 0);
        const toParts = toPath.split('/').filter(e => e.length > 0);
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
    UriUtils.relative = relative;
    function normalize(uri) {
        return URI.parse(uri.toString()).toString();
    }
    UriUtils.normalize = normalize;
    function contains(parent, child) {
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
    UriUtils.contains = contains;
})(UriUtils || (UriUtils = {}));
/**
 * A trie structure for URIs. It allows to insert, delete and find elements by their URI.
 * More specifically, it allows to efficiently find all elements that are children of a given URI.
 *
 * Unlike a regular trie, this implementation uses the name of the URI segments as keys.
 *
 * @see {@link https://en.wikipedia.org/wiki/Trie}
 */
export class UriTrie {
    constructor() {
        this.root = { name: '', children: new Map() };
    }
    normalizeUri(uri) {
        return UriUtils.normalize(uri);
    }
    clear() {
        this.root.children.clear();
    }
    insert(uri, element) {
        const node = this.getNode(this.normalizeUri(uri), true);
        node.element = element;
    }
    delete(uri) {
        const nodeToDelete = this.getNode(this.normalizeUri(uri), false);
        if (nodeToDelete?.parent) {
            nodeToDelete.parent.children.delete(nodeToDelete.name);
        }
    }
    has(uri) {
        return this.getNode(this.normalizeUri(uri), false)?.element !== undefined;
    }
    hasNode(uri) {
        return this.getNode(this.normalizeUri(uri), false) !== undefined;
    }
    find(uri) {
        return this.getNode(this.normalizeUri(uri), false)?.element;
    }
    findNode(uri) {
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
    findChildren(uri) {
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
    all() {
        return this.collectValues(this.root);
    }
    findAll(prefix) {
        const node = this.getNode(UriUtils.normalize(prefix), false);
        if (!node) {
            return [];
        }
        return this.collectValues(node);
    }
    getNode(uri, create) {
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
                }
                else {
                    return undefined;
                }
            }
            current = child;
        }
        return current;
    }
    collectValues(node) {
        const result = [];
        if (node.element) {
            result.push(node.element);
        }
        for (const child of node.children.values()) {
            result.push(...this.collectValues(child));
        }
        return result;
    }
}
//# sourceMappingURL=uri-utils.js.map