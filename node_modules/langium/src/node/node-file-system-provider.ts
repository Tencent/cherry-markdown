/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { URI } from '../utils/uri-utils.js';
import { UriUtils } from '../utils/uri-utils.js';
import type { FileSystemNode, FileSystemProvider } from '../workspace/file-system-provider.js';
import * as fs from 'node:fs';

export type NodeTextEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'latin1';

export class NodeFileSystemProvider implements FileSystemProvider {

    encoding: NodeTextEncoding = 'utf-8';

    async stat(uri: URI): Promise<FileSystemNode> {
        const stat = await fs.promises.stat(uri.fsPath);
        return {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            uri
        };
    }

    statSync(uri: URI): FileSystemNode {
        const stat = fs.statSync(uri.fsPath);
        return {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            uri
        };
    }

    exists(uri: URI): Promise<boolean> {
        return new Promise(resolve => {
            fs.stat(uri.fsPath, err => {
                resolve(!err);
            });
        });
    }

    existsSync(uri: URI): boolean {
        return fs.existsSync(uri.fsPath);
    }

    readBinary(uri: URI): Promise<Uint8Array> {
        return fs.promises.readFile(uri.fsPath);
    }

    readBinarySync(uri: URI): Uint8Array {
        return fs.readFileSync(uri.fsPath);
    }

    readFile(uri: URI): Promise<string> {
        return fs.promises.readFile(uri.fsPath, this.encoding);
    }

    readFileSync(uri: URI): string {
        return fs.readFileSync(uri.fsPath, this.encoding);
    }

    async readDirectory(uri: URI): Promise<FileSystemNode[]> {
        const dirents = await fs.promises.readdir(uri.fsPath, { withFileTypes: true });
        return dirents.map(dirent => ({
            dirent, // Include the raw entry, it may be useful...
            isFile: dirent.isFile(),
            isDirectory: dirent.isDirectory(),
            uri: UriUtils.joinPath(uri, dirent.name)
        }));
    }

    readDirectorySync(uri: URI): FileSystemNode[] {
        const dirents = fs.readdirSync(uri.fsPath, { withFileTypes: true });
        return dirents.map(dirent => ({
            dirent, // Include the raw entry, it may be useful...
            isFile: dirent.isFile(),
            isDirectory: dirent.isDirectory(),
            uri: UriUtils.joinPath(uri, dirent.name)
        }));
    }
}

export const NodeFileSystem = {
    fileSystemProvider: () => new NodeFileSystemProvider()
};
