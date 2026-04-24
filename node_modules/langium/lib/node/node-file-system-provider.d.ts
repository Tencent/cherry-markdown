/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { URI } from '../utils/uri-utils.js';
import type { FileSystemNode, FileSystemProvider } from '../workspace/file-system-provider.js';
export type NodeTextEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'latin1';
export declare class NodeFileSystemProvider implements FileSystemProvider {
    encoding: NodeTextEncoding;
    stat(uri: URI): Promise<FileSystemNode>;
    statSync(uri: URI): FileSystemNode;
    exists(uri: URI): Promise<boolean>;
    existsSync(uri: URI): boolean;
    readBinary(uri: URI): Promise<Uint8Array>;
    readBinarySync(uri: URI): Uint8Array;
    readFile(uri: URI): Promise<string>;
    readFileSync(uri: URI): string;
    readDirectory(uri: URI): Promise<FileSystemNode[]>;
    readDirectorySync(uri: URI): FileSystemNode[];
}
export declare const NodeFileSystem: {
    fileSystemProvider: () => NodeFileSystemProvider;
};
//# sourceMappingURL=node-file-system-provider.d.ts.map