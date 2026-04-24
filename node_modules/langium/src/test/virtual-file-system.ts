/******************************************************************************
 * Copyright 2025 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { URI } from 'vscode-uri';
import type { FileSystemNode, FileSystemProvider } from '../workspace/file-system-provider.js';
import { UriTrie } from '../utils/uri-utils.js';

export class VirtualFileSystemProvider implements FileSystemProvider {

    private readonly trie = new UriTrie<string>();

    insert(uri: URI | string, content: string): void {
        this.trie.insert(uri, content);
    }

    delete(uri: URI | string): void {
        this.trie.delete(uri);
    }

    stat(uri: URI): Promise<FileSystemNode> {
        return Promise.resolve(this.statSync(uri));
    }

    statSync(uri: URI): FileSystemNode {
        const node = this.trie.findNode(uri);
        if (node) {
            return {
                isDirectory: node.element === undefined,
                isFile: node.element !== undefined,
                uri
            };
        } else {
            throw new Error('File not found');
        }
    }

    exists(uri: URI): Promise<boolean> {
        return Promise.resolve(this.existsSync(uri));
    }

    existsSync(uri: URI): boolean {
        return this.trie.findNode(uri) !== undefined;
    }
    readBinary(uri: URI): Promise<Uint8Array> {
        return Promise.resolve(this.readBinarySync(uri));
    }

    readBinarySync(uri: URI): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(this.readFileSync(uri));
    }

    readFile(uri: URI): Promise<string> {
        return Promise.resolve(this.readFileSync(uri));
    }

    readFileSync(uri: URI): string {
        const data = this.trie.find(uri);
        if (typeof data === 'string') {
            return data;
        } else {
            throw new Error('File not found');
        }
    }

    readDirectory(uri: URI): Promise<FileSystemNode[]> {
        return Promise.resolve(this.readDirectorySync(uri));
    }

    readDirectorySync(uri: URI): FileSystemNode[] {
        const node = this.trie.findNode(uri);
        if (!node) {
            throw new Error('Directory not found');
        }
        const children = this.trie.findChildren(uri);
        return children.map(child => ({
            isDirectory: child.element === undefined,
            isFile: child.element !== undefined,
            uri: URI.parse(child.uri)
        }));
    }

}
