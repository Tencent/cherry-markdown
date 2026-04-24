/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
export class EmptyFileSystemProvider {
    stat(_uri) {
        throw new Error('No file system is available.');
    }
    statSync(_uri) {
        throw new Error('No file system is available.');
    }
    async exists() {
        return false;
    }
    existsSync() {
        return false;
    }
    readBinary() {
        throw new Error('No file system is available.');
    }
    readBinarySync() {
        throw new Error('No file system is available.');
    }
    readFile() {
        throw new Error('No file system is available.');
    }
    readFileSync() {
        throw new Error('No file system is available.');
    }
    async readDirectory() {
        return [];
    }
    readDirectorySync() {
        return [];
    }
}
export const EmptyFileSystem = {
    fileSystemProvider: () => new EmptyFileSystemProvider()
};
//# sourceMappingURL=file-system-provider.js.map