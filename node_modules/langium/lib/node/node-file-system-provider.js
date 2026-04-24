/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { UriUtils } from '../utils/uri-utils.js';
import * as fs from 'node:fs';
export class NodeFileSystemProvider {
    constructor() {
        this.encoding = 'utf-8';
    }
    async stat(uri) {
        const stat = await fs.promises.stat(uri.fsPath);
        return {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            uri
        };
    }
    statSync(uri) {
        const stat = fs.statSync(uri.fsPath);
        return {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            uri
        };
    }
    exists(uri) {
        return new Promise(resolve => {
            fs.stat(uri.fsPath, err => {
                resolve(!err);
            });
        });
    }
    existsSync(uri) {
        return fs.existsSync(uri.fsPath);
    }
    readBinary(uri) {
        return fs.promises.readFile(uri.fsPath);
    }
    readBinarySync(uri) {
        return fs.readFileSync(uri.fsPath);
    }
    readFile(uri) {
        return fs.promises.readFile(uri.fsPath, this.encoding);
    }
    readFileSync(uri) {
        return fs.readFileSync(uri.fsPath, this.encoding);
    }
    async readDirectory(uri) {
        const dirents = await fs.promises.readdir(uri.fsPath, { withFileTypes: true });
        return dirents.map(dirent => ({
            dirent, // Include the raw entry, it may be useful...
            isFile: dirent.isFile(),
            isDirectory: dirent.isDirectory(),
            uri: UriUtils.joinPath(uri, dirent.name)
        }));
    }
    readDirectorySync(uri) {
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
//# sourceMappingURL=node-file-system-provider.js.map