/******************************************************************************
 * Copyright 2025 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { URI } from 'vscode-uri';
import type { FileSystemNode, FileSystemProvider } from '../workspace/file-system-provider.js';
export declare class VirtualFileSystemProvider implements FileSystemProvider {
    private readonly trie;
    insert(uri: URI | string, content: string): void;
    delete(uri: URI | string): void;
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
//# sourceMappingURL=virtual-file-system.d.ts.map