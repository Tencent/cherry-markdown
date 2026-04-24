/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { URI } from '../utils/uri-utils.js';
export interface FileSystemNode {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly uri: URI;
}
export type FileSystemFilter = (node: FileSystemNode) => boolean;
/**
 * Provides methods to interact with an abstract file system. The default implementation is based on the node.js `fs` API.
 */
export interface FileSystemProvider {
    /**
     * Gets the status of a file or directory.
     * The status includes meta data such as whether the node is a file or directory.
     * @param uri The URI of the file or directory.
     */
    stat(uri: URI): Promise<FileSystemNode>;
    /**
     * Gets the status of a file or directory synchronously.
     * The status includes meta data such as whether the node is a file or directory.
     * @param uri The URI of the file or directory.
     */
    statSync(uri: URI): FileSystemNode;
    /**
     * Checks if a file exists at the specified URI.
     * @returns `true` if a file exists at the specified URI, `false` otherwise.
     */
    exists(uri: URI): Promise<boolean>;
    /**
     * Checks if a file exists at the specified URI synchronously.
     * @returns `true` if a file exists at the specified URI, `false` otherwise.
     */
    existsSync(uri: URI): boolean;
    /**
     * Reads a binary file asynchronously from a given URI.
     * @returns The binary content of the file with the specified URI.
     */
    readBinary(uri: URI): Promise<Uint8Array>;
    /**
     * Reads a binary file synchronously from a given URI.
     * @returns The binary content of the file with the specified URI.
     */
    readBinarySync(uri: URI): Uint8Array;
    /**
     * Reads a document asynchronously from a given URI.
     * @returns The string content of the file with the specified URI.
     */
    readFile(uri: URI): Promise<string>;
    /**
     * Reads a document synchronously from a given URI.
     * @returns The string content of the file with the specified
     */
    readFileSync(uri: URI): string;
    /**
     * Reads the directory information for the given URI.
     * @returns The list of file system entries that are contained within the specified directory.
     */
    readDirectory(uri: URI): Promise<FileSystemNode[]>;
    /**
     * Reads the directory information for the given URI synchronously.
     * @returns The list of file system entries that are contained within the specified directory.
     */
    readDirectorySync(uri: URI): FileSystemNode[];
}
export declare class EmptyFileSystemProvider implements FileSystemProvider {
    stat(_uri: URI): Promise<FileSystemNode>;
    statSync(_uri: URI): FileSystemNode;
    exists(): Promise<boolean>;
    existsSync(): boolean;
    readBinary(): Promise<Uint8Array>;
    readBinarySync(): Uint8Array;
    readFile(): Promise<string>;
    readFileSync(): string;
    readDirectory(): Promise<FileSystemNode[]>;
    readDirectorySync(): FileSystemNode[];
}
export declare const EmptyFileSystem: {
    fileSystemProvider: () => EmptyFileSystemProvider;
};
//# sourceMappingURL=file-system-provider.d.ts.map