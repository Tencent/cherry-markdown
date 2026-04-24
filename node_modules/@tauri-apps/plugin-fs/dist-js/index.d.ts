/**
 * Access the file system.
 *
 * ## Security
 *
 * This module prevents path traversal, not allowing parent directory accessors to be used
 * (i.e. "/usr/path/to/../file" or "../path/to/file" paths are not allowed).
 * Paths accessed with this API must be either relative to one of the {@link BaseDirectory | base directories}
 * or created with the {@link https://v2.tauri.app/reference/javascript/api/namespacepath | path API}.
 *
 * The API has a scope configuration that forces you to restrict the paths that can be accessed using glob patterns.
 *
 * The scope configuration is an array of glob patterns describing file/directory paths that are allowed.
 * For instance, this scope configuration allows **all** enabled `fs` APIs to (only) access files in the
 * *databases* directory of the {@link https://v2.tauri.app/reference/javascript/api/namespacepath/#appdatadir | `$APPDATA` directory}:
 * ```json
 * {
 *   "permissions": [
 *     {
 *       "identifier": "fs:scope",
 *       "allow": [{ "path": "$APPDATA/databases/*" }]
 *     }
 *   ]
 * }
 * ```
 *
 * Scopes can also be applied to specific `fs` APIs by using the API's identifier instead of `fs:scope`:
 * ```json
 * {
 *   "permissions": [
 *     {
 *       "identifier": "fs:allow-exists",
 *       "allow": [{ "path": "$APPDATA/databases/*" }]
 *     }
 *   ]
 * }
 * ```
 *
 * Notice the use of the `$APPDATA` variable. The value is injected at runtime, resolving to the {@link https://v2.tauri.app/reference/javascript/api/namespacepath/#appdatadir | app data directory}.
 *
 * The available variables are:
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#appconfigdir | $APPCONFIG},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#appdatadir | $APPDATA},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#applocaldatadir | $APPLOCALDATA},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#appcachedir | $APPCACHE},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#applogdir | $APPLOG},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#audiodir | $AUDIO},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#cachedir | $CACHE},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#configdir | $CONFIG},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#datadir | $DATA},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#localdatadir | $LOCALDATA},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#desktopdir | $DESKTOP},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#documentdir | $DOCUMENT},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#downloaddir | $DOWNLOAD},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#executabledir | $EXE},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#fontdir | $FONT},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#homedir | $HOME},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#picturedir | $PICTURE},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#publicdir | $PUBLIC},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#runtimedir | $RUNTIME},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#templatedir | $TEMPLATE},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#videodir | $VIDEO},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#resourcedir | $RESOURCE},
 * {@linkcode https://v2.tauri.app/reference/javascript/api/namespacepath/#tempdir | $TEMP}.
 *
 * Trying to execute any API with a URL not configured on the scope results in a promise rejection due to denied access.
 *
 * @module
 */
import { BaseDirectory } from '@tauri-apps/api/path';
import { Resource } from '@tauri-apps/api/core';
declare enum SeekMode {
    Start = 0,
    Current = 1,
    End = 2
}
/**
 * A FileInfo describes a file and is returned by `stat`, `lstat` or `fstat`.
 *
 * @since 2.0.0
 */
interface FileInfo {
    /**
     * True if this is info for a regular file. Mutually exclusive to
     * `FileInfo.isDirectory` and `FileInfo.isSymlink`.
     */
    isFile: boolean;
    /**
     * True if this is info for a regular directory. Mutually exclusive to
     * `FileInfo.isFile` and `FileInfo.isSymlink`.
     */
    isDirectory: boolean;
    /**
     * True if this is info for a symlink. Mutually exclusive to
     * `FileInfo.isFile` and `FileInfo.isDirectory`.
     */
    isSymlink: boolean;
    /**
     * The size of the file, in bytes.
     */
    size: number;
    /**
     * The last modification time of the file. This corresponds to the `mtime`
     * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
     * may not be available on all platforms.
     */
    mtime: Date | null;
    /**
     * The last access time of the file. This corresponds to the `atime`
     * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
     * be available on all platforms.
     */
    atime: Date | null;
    /**
     * The creation time of the file. This corresponds to the `birthtime`
     * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
     * not be available on all platforms.
     */
    birthtime: Date | null;
    /** Whether this is a readonly (unwritable) file. */
    readonly: boolean;
    /**
     * This field contains the file system attribute information for a file
     * or directory. For possible values and their descriptions, see
     * {@link https://docs.microsoft.com/en-us/windows/win32/fileio/file-attribute-constants | File Attribute Constants} in the Windows Dev Center
     *
     * #### Platform-specific
     *
     * - **macOS / Linux / Android / iOS:** Unsupported.
     */
    fileAttributes: number | null;
    /**
     * ID of the device containing the file.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    dev: number | null;
    /**
     * Inode number.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    ino: number | null;
    /**
     * The underlying raw `st_mode` bits that contain the standard Unix
     * permissions for this file/directory.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    mode: number | null;
    /**
     * Number of hard links pointing to this file.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    nlink: number | null;
    /**
     * User ID of the owner of this file.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    uid: number | null;
    /**
     * Group ID of the owner of this file.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    gid: number | null;
    /**
     * Device ID of this file.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    rdev: number | null;
    /**
     * Blocksize for filesystem I/O.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    blksize: number | null;
    /**
     * Number of blocks allocated to the file, in 512-byte units.
     *
     * #### Platform-specific
     *
     * - **Windows:** Unsupported.
     */
    blocks: number | null;
}
/**
 *  The Tauri abstraction for reading and writing files.
 *
 * @since 2.0.0
 */
declare class FileHandle extends Resource {
    /**
     * Reads up to `p.byteLength` bytes into `p`. It resolves to the number of
     * bytes read (`0` < `n` <= `p.byteLength`) and rejects if any error
     * encountered. Even if `read()` resolves to `n` < `p.byteLength`, it may
     * use all of `p` as scratch space during the call. If some data is
     * available but not `p.byteLength` bytes, `read()` conventionally resolves
     * to what is available instead of waiting for more.
     *
     * When `read()` encounters end-of-file condition, it resolves to EOF
     * (`null`).
     *
     * When `read()` encounters an error, it rejects with an error.
     *
     * Callers should always process the `n` > `0` bytes returned before
     * considering the EOF (`null`). Doing so correctly handles I/O errors that
     * happen after reading some bytes and also both of the allowed EOF
     * behaviors.
     *
     * @example
     * ```typescript
     * import { open, BaseDirectory } from "@tauri-apps/plugin-fs"
     * // if "$APPCONFIG/foo/bar.txt" contains the text "hello world":
     * const file = await open("foo/bar.txt", { baseDir: BaseDirectory.AppConfig });
     * const buf = new Uint8Array(100);
     * const numberOfBytesRead = await file.read(buf); // 11 bytes
     * const text = new TextDecoder().decode(buf);  // "hello world"
     * await file.close();
     * ```
     *
     * @since 2.0.0
     */
    read(buffer: Uint8Array): Promise<number | null>;
    /**
     * Seek sets the offset for the next `read()` or `write()` to offset,
     * interpreted according to `whence`: `Start` means relative to the
     * start of the file, `Current` means relative to the current offset,
     * and `End` means relative to the end. Seek resolves to the new offset
     * relative to the start of the file.
     *
     * Seeking to an offset before the start of the file is an error. Seeking to
     * any positive offset is legal, but the behavior of subsequent I/O
     * operations on the underlying object is implementation-dependent.
     * It returns the number of cursor position.
     *
     * @example
     * ```typescript
     * import { open, SeekMode, BaseDirectory } from '@tauri-apps/plugin-fs';
     *
     * // Given hello.txt pointing to file with "Hello world", which is 11 bytes long:
     * const file = await open('hello.txt', { read: true, write: true, truncate: true, create: true, baseDir: BaseDirectory.AppLocalData });
     * await file.write(new TextEncoder().encode("Hello world"));
     *
     * // Seek 6 bytes from the start of the file
     * console.log(await file.seek(6, SeekMode.Start)); // "6"
     * // Seek 2 more bytes from the current position
     * console.log(await file.seek(2, SeekMode.Current)); // "8"
     * // Seek backwards 2 bytes from the end of the file
     * console.log(await file.seek(-2, SeekMode.End)); // "9" (e.g. 11-2)
     *
     * await file.close();
     * ```
     *
     * @since 2.0.0
     */
    seek(offset: number, whence: SeekMode): Promise<number>;
    /**
     * Returns a {@linkcode FileInfo } for this file.
     *
     * @example
     * ```typescript
     * import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
     * const file = await open("file.txt", { read: true, baseDir: BaseDirectory.AppLocalData });
     * const fileInfo = await file.stat();
     * console.log(fileInfo.isFile); // true
     * await file.close();
     * ```
     *
     * @since 2.0.0
     */
    stat(): Promise<FileInfo>;
    /**
     * Truncates or extends this file, to reach the specified `len`.
     * If `len` is not specified then the entire file contents are truncated.
     *
     * @example
     * ```typescript
     * import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
     *
     * // truncate the entire file
     * const file = await open("my_file.txt", { read: true, write: true, create: true, baseDir: BaseDirectory.AppLocalData });
     * await file.truncate();
     *
     * // truncate part of the file
     * const file = await open("my_file.txt", { read: true, write: true, create: true, baseDir: BaseDirectory.AppLocalData });
     * await file.write(new TextEncoder().encode("Hello World"));
     * await file.truncate(7);
     * const data = new Uint8Array(32);
     * await file.read(data);
     * console.log(new TextDecoder().decode(data)); // Hello W
     * await file.close();
     * ```
     *
     * @since 2.0.0
     */
    truncate(len?: number): Promise<void>;
    /**
     * Writes `data.byteLength` bytes from `data` to the underlying data stream. It
     * resolves to the number of bytes written from `data` (`0` <= `n` <=
     * `data.byteLength`) or reject with the error encountered that caused the
     * write to stop early. `write()` must reject with a non-null error if
     * would resolve to `n` < `data.byteLength`. `write()` must not modify the
     * slice data, even temporarily.
     *
     * @example
     * ```typescript
     * import { open, write, BaseDirectory } from '@tauri-apps/plugin-fs';
     * const encoder = new TextEncoder();
     * const data = encoder.encode("Hello world");
     * const file = await open("bar.txt", { write: true, baseDir: BaseDirectory.AppLocalData });
     * const bytesWritten = await file.write(data); // 11
     * await file.close();
     * ```
     *
     * @since 2.0.0
     */
    write(data: Uint8Array): Promise<number>;
}
/**
 * @since 2.0.0
 */
interface CreateOptions {
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * Creates a file if none exists or truncates an existing file and resolves to
 *  an instance of {@linkcode FileHandle }.
 *
 * @example
 * ```typescript
 * import { create, BaseDirectory } from "@tauri-apps/plugin-fs"
 * const file = await create("foo/bar.txt", { baseDir: BaseDirectory.AppConfig });
 * await file.write(new TextEncoder().encode("Hello world"));
 * await file.close();
 * ```
 *
 * @since 2.0.0
 */
declare function create(path: string | URL, options?: CreateOptions): Promise<FileHandle>;
/**
 * @since 2.0.0
 */
interface OpenOptions {
    /**
     * Sets the option for read access. This option, when `true`, means that the
     * file should be read-able if opened.
     */
    read?: boolean;
    /**
     * Sets the option for write access. This option, when `true`, means that
     * the file should be write-able if opened. If the file already exists,
     * any write calls on it will overwrite its contents, by default without
     * truncating it.
     */
    write?: boolean;
    /**
     * Sets the option for the append mode. This option, when `true`, means that
     * writes will append to a file instead of overwriting previous contents.
     * Note that setting `{ write: true, append: true }` has the same effect as
     * setting only `{ append: true }`.
     */
    append?: boolean;
    /**
     * Sets the option for truncating a previous file. If a file is
     * successfully opened with this option set it will truncate the file to `0`
     * size if it already exists. The file must be opened with write access
     * for truncate to work.
     */
    truncate?: boolean;
    /**
     * Sets the option to allow creating a new file, if one doesn't already
     * exist at the specified path. Requires write or append access to be
     * used.
     */
    create?: boolean;
    /**
     * Defaults to `false`. If set to `true`, no file, directory, or symlink is
     * allowed to exist at the target location. Requires write or append
     * access to be used. When createNew is set to `true`, create and truncate
     * are ignored.
     */
    createNew?: boolean;
    /**
     * Permissions to use if creating the file (defaults to `0o666`, before
     * the process's umask).
     * Ignored on Windows.
     */
    mode?: number;
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * Open a file and resolve to an instance of {@linkcode FileHandle}. The
 * file does not need to previously exist if using the `create` or `createNew`
 * open options. It is the callers responsibility to close the file when finished
 * with it.
 *
 * @example
 * ```typescript
 * import { open, BaseDirectory } from "@tauri-apps/plugin-fs"
 * const file = await open("foo/bar.txt", { read: true, write: true, baseDir: BaseDirectory.AppLocalData });
 * // Do work with file
 * await file.close();
 * ```
 *
 * @since 2.0.0
 */
declare function open(path: string | URL, options?: OpenOptions): Promise<FileHandle>;
/**
 * @since 2.0.0
 */
interface CopyFileOptions {
    /** Base directory for `fromPath`. */
    fromPathBaseDir?: BaseDirectory;
    /** Base directory for `toPath`. */
    toPathBaseDir?: BaseDirectory;
}
/**
 * Copies the contents and permissions of one file to another specified path, by default creating a new file if needed, else overwriting.
 * @example
 * ```typescript
 * import { copyFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * await copyFile('app.conf', 'app.conf.bk', { fromPathBaseDir: BaseDirectory.AppConfig, toPathBaseDir: BaseDirectory.AppConfig });
 * ```
 *
 * @since 2.0.0
 */
declare function copyFile(fromPath: string | URL, toPath: string | URL, options?: CopyFileOptions): Promise<void>;
/**
 * @since 2.0.0
 */
interface MkdirOptions {
    /** Permissions to use when creating the directory (defaults to `0o777`, before the process's umask). Ignored on Windows. */
    mode?: number;
    /**
     * Defaults to `false`. If set to `true`, means that any intermediate directories will also be created (as with the shell command `mkdir -p`).
     * */
    recursive?: boolean;
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * Creates a new directory with the specified path.
 * @example
 * ```typescript
 * import { mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
 * await mkdir('users', { baseDir: BaseDirectory.AppLocalData });
 * ```
 *
 * @since 2.0.0
 */
declare function mkdir(path: string | URL, options?: MkdirOptions): Promise<void>;
/**
 * @since 2.0.0
 */
interface ReadDirOptions {
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * A disk entry which is either a file, a directory or a symlink.
 *
 * This is the result of the {@linkcode readDir}.
 *
 * @since 2.0.0
 */
interface DirEntry {
    /** The name of the entry (file name with extension or directory name). */
    name: string;
    /** Specifies whether this entry is a directory or not. */
    isDirectory: boolean;
    /** Specifies whether this entry is a file or not. */
    isFile: boolean;
    /** Specifies whether this entry is a symlink or not. */
    isSymlink: boolean;
}
/**
 * Reads the directory given by path and returns an array of `DirEntry`.
 * @example
 * ```typescript
 * import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs';
 * import { join } from '@tauri-apps/api/path';
 * const dir = "users"
 * const entries = await readDir('users', { baseDir: BaseDirectory.AppLocalData });
 * processEntriesRecursively(dir, entries);
 * async function processEntriesRecursively(parent, entries) {
 *   for (const entry of entries) {
 *     console.log(`Entry: ${entry.name}`);
 *     if (entry.isDirectory) {
 *        const dir = await join(parent, entry.name);
 *       processEntriesRecursively(dir, await readDir(dir, { baseDir: BaseDirectory.AppLocalData }))
 *     }
 *   }
 * }
 * ```
 *
 * @since 2.0.0
 */
declare function readDir(path: string | URL, options?: ReadDirOptions): Promise<DirEntry[]>;
/**
 * @since 2.0.0
 */
interface ReadFileOptions {
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * Reads and resolves to the entire contents of a file as an array of bytes.
 * TextDecoder can be used to transform the bytes to string if required.
 * @example
 * ```typescript
 * import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * const contents = await readFile('avatar.png', { baseDir: BaseDirectory.Resource });
 * ```
 *
 * @since 2.0.0
 */
declare function readFile(path: string | URL, options?: ReadFileOptions): Promise<Uint8Array>;
/**
 * Reads and returns the entire contents of a file as UTF-8 string.
 * @example
 * ```typescript
 * import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * const contents = await readTextFile('app.conf', { baseDir: BaseDirectory.AppConfig });
 * ```
 *
 * @since 2.0.0
 */
declare function readTextFile(path: string | URL, options?: ReadFileOptions): Promise<string>;
/**
 * Returns an async {@linkcode AsyncIterableIterator} over the lines of a file as UTF-8 string.
 * @example
 * ```typescript
 * import { readTextFileLines, BaseDirectory } from '@tauri-apps/plugin-fs';
 * const lines = await readTextFileLines('app.conf', { baseDir: BaseDirectory.AppConfig });
 * for await (const line of lines) {
 *   console.log(line);
 * }
 * ```
 * You could also call {@linkcode AsyncIterableIterator.next} to advance the
 * iterator so you can lazily read the next line whenever you want.
 *
 * @since 2.0.0
 */
declare function readTextFileLines(path: string | URL, options?: ReadFileOptions): Promise<AsyncIterableIterator<string>>;
/**
 * @since 2.0.0
 */
interface RemoveOptions {
    /** Defaults to `false`. If set to `true`, path will be removed even if it's a non-empty directory. */
    recursive?: boolean;
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * Removes the named file or directory.
 * If the directory is not empty and the `recursive` option isn't set to true, the promise will be rejected.
 * @example
 * ```typescript
 * import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
 * await remove('users/file.txt', { baseDir: BaseDirectory.AppLocalData });
 * await remove('users', { baseDir: BaseDirectory.AppLocalData });
 * ```
 *
 * @since 2.0.0
 */
declare function remove(path: string | URL, options?: RemoveOptions): Promise<void>;
/**
 * @since 2.0.0
 */
interface RenameOptions {
    /** Base directory for `oldPath`. */
    oldPathBaseDir?: BaseDirectory;
    /** Base directory for `newPath`. */
    newPathBaseDir?: BaseDirectory;
}
/**
 * Renames (moves) oldpath to newpath. Paths may be files or directories.
 * If newpath already exists and is not a directory, rename() replaces it.
 * OS-specific restrictions may apply when oldpath and newpath are in different directories.
 *
 * On Unix, this operation does not follow symlinks at either path.
 *
 * @example
 * ```typescript
 * import { rename, BaseDirectory } from '@tauri-apps/plugin-fs';
 * await rename('avatar.png', 'deleted.png', { oldPathBaseDir: BaseDirectory.App, newPathBaseDir: BaseDirectory.AppLocalData });
 * ```
 *
 * @since 2.0.0
 */
declare function rename(oldPath: string | URL, newPath: string | URL, options?: RenameOptions): Promise<void>;
/**
 * @since 2.0.0
 */
interface StatOptions {
    /** Base directory for `path`. */
    baseDir?: BaseDirectory;
}
/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. Will always
 * follow symlinks but will reject if the symlink points to a path outside of the scope.
 *
 * @example
 * ```typescript
 * import { stat, BaseDirectory } from '@tauri-apps/plugin-fs';
 * const fileInfo = await stat("hello.txt", { baseDir: BaseDirectory.AppLocalData });
 * console.log(fileInfo.isFile); // true
 * ```
 *
 * @since 2.0.0
 */
declare function stat(path: string | URL, options?: StatOptions): Promise<FileInfo>;
/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. If `path` is a
 * symlink, information for the symlink will be returned instead of what it
 * points to.
 *
 * @example
 * ```typescript
 * import { lstat, BaseDirectory } from '@tauri-apps/plugin-fs';
 * const fileInfo = await lstat("hello.txt", { baseDir: BaseDirectory.AppLocalData });
 * console.log(fileInfo.isFile); // true
 * ```
 *
 * @since 2.0.0
 */
declare function lstat(path: string | URL, options?: StatOptions): Promise<FileInfo>;
/**
 * @since 2.0.0
 */
interface TruncateOptions {
    /** Base directory for `path`. */
    baseDir?: BaseDirectory;
}
/**
 * Truncates or extends the specified file, to reach the specified `len`.
 * If `len` is `0` or not specified, then the entire file contents are truncated.
 *
 * @example
 * ```typescript
 * import { truncate, readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // truncate the entire file
 * await truncate("my_file.txt", 0, { baseDir: BaseDirectory.AppLocalData });
 *
 * // truncate part of the file
 * const filePath = "file.txt";
 * await writeTextFile(filePath, "Hello World", { baseDir: BaseDirectory.AppLocalData });
 * await truncate(filePath, 7, { baseDir: BaseDirectory.AppLocalData });
 * const data = await readTextFile(filePath, { baseDir: BaseDirectory.AppLocalData });
 * console.log(data);  // "Hello W"
 * ```
 *
 * @since 2.0.0
 */
declare function truncate(path: string | URL, len?: number, options?: TruncateOptions): Promise<void>;
/**
 * @since 2.0.0
 */
interface WriteFileOptions {
    /** Defaults to `false`. If set to `true`, will append to a file instead of overwriting previous contents. */
    append?: boolean;
    /** Sets the option to allow creating a new file, if one doesn't already exist at the specified path (defaults to `true`). */
    create?: boolean;
    /** Sets the option to create a new file, failing if it already exists. */
    createNew?: boolean;
    /** File permissions. Ignored on Windows. */
    mode?: number;
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * Write `data` to the given `path`, by default creating a new file if needed, else overwriting.
 * @example
 * ```typescript
 * import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
 *
 * let encoder = new TextEncoder();
 * let data = encoder.encode("Hello World");
 * await writeFile('file.txt', data, { baseDir: BaseDirectory.AppLocalData });
 * ```
 *
 * @since 2.0.0
 */
declare function writeFile(path: string | URL, data: Uint8Array | ReadableStream<Uint8Array>, options?: WriteFileOptions): Promise<void>;
/**
  * Writes UTF-8 string `data` to the given `path`, by default creating a new file if needed, else overwriting.
    @example
  * ```typescript
  * import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
  *
  * await writeTextFile('file.txt', "Hello world", { baseDir: BaseDirectory.AppLocalData });
  * ```
  *
  * @since 2.0.0
  */
declare function writeTextFile(path: string | URL, data: string, options?: WriteFileOptions): Promise<void>;
/**
 * @since 2.0.0
 */
interface ExistsOptions {
    /** Base directory for `path`. */
    baseDir?: BaseDirectory;
}
/**
 * Check if a path exists.
 * @example
 * ```typescript
 * import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Check if the `$APPDATA/avatar.png` file exists
 * await exists('avatar.png', { baseDir: BaseDirectory.AppData });
 * ```
 *
 * @since 2.0.0
 */
declare function exists(path: string | URL, options?: ExistsOptions): Promise<boolean>;
/**
 * @since 2.0.0
 */
interface WatchOptions {
    /** Watch a directory recursively */
    recursive?: boolean;
    /** Base directory for `path` */
    baseDir?: BaseDirectory;
}
/**
 * @since 2.0.0
 */
interface DebouncedWatchOptions extends WatchOptions {
    /** Debounce delay */
    delayMs?: number;
}
/**
 * @since 2.0.0
 */
interface WatchEvent {
    type: WatchEventKind;
    paths: string[];
    attrs: unknown;
}
/**
 * @since 2.0.0
 */
type WatchEventKind = 'any' | {
    access: WatchEventKindAccess;
} | {
    create: WatchEventKindCreate;
} | {
    modify: WatchEventKindModify;
} | {
    remove: WatchEventKindRemove;
} | 'other';
/**
 * @since 2.0.0
 */
type WatchEventKindAccess = {
    kind: 'any';
} | {
    kind: 'close';
    mode: 'any' | 'execute' | 'read' | 'write' | 'other';
} | {
    kind: 'open';
    mode: 'any' | 'execute' | 'read' | 'write' | 'other';
} | {
    kind: 'other';
};
/**
 * @since 2.0.0
 */
type WatchEventKindCreate = {
    kind: 'any';
} | {
    kind: 'file';
} | {
    kind: 'folder';
} | {
    kind: 'other';
};
/**
 * @since 2.0.0
 */
type WatchEventKindModify = {
    kind: 'any';
} | {
    kind: 'data';
    mode: 'any' | 'size' | 'content' | 'other';
} | {
    kind: 'metadata';
    mode: 'any' | 'access-time' | 'write-time' | 'permissions' | 'ownership' | 'extended' | 'other';
} | {
    kind: 'rename';
    mode: 'any' | 'to' | 'from' | 'both' | 'other';
} | {
    kind: 'other';
};
/**
 * @since 2.0.0
 */
type WatchEventKindRemove = {
    kind: 'any';
} | {
    kind: 'file';
} | {
    kind: 'folder';
} | {
    kind: 'other';
};
/**
 * @since 2.0.0
 */
type UnwatchFn = () => void;
/**
 * Watch changes (after a delay) on files or directories.
 *
 * @since 2.0.0
 */
declare function watch(paths: string | string[] | URL | URL[], cb: (event: WatchEvent) => void, options?: DebouncedWatchOptions): Promise<UnwatchFn>;
/**
 * Watch changes on files or directories.
 *
 * @since 2.0.0
 */
declare function watchImmediate(paths: string | string[] | URL | URL[], cb: (event: WatchEvent) => void, options?: WatchOptions): Promise<UnwatchFn>;
/**
 * Get the size of a file or directory. For files, the `stat` functions can be used as well.
 *
 * If `path` is a directory, this function will recursively iterate over every file and every directory inside of `path` and therefore will be very time consuming if used on larger directories.
 *
 * @example
 * ```typescript
 * import { size, BaseDirectory } from '@tauri-apps/plugin-fs';
 * // Get the size of the `$APPDATA/tauri` directory.
 * const dirSize = await size('tauri', { baseDir: BaseDirectory.AppData });
 * console.log(dirSize); // 1024
 * ```
 *
 * @since 2.1.0
 */
declare function size(path: string | URL): Promise<number>;
export type { CreateOptions, OpenOptions, CopyFileOptions, MkdirOptions, DirEntry, ReadDirOptions, ReadFileOptions, RemoveOptions, RenameOptions, StatOptions, TruncateOptions, WriteFileOptions, ExistsOptions, FileInfo, WatchOptions, DebouncedWatchOptions, WatchEvent, WatchEventKind, WatchEventKindAccess, WatchEventKindCreate, WatchEventKindModify, WatchEventKindRemove, UnwatchFn };
export { BaseDirectory, FileHandle, create, open, copyFile, mkdir, readDir, readFile, readTextFile, readTextFileLines, remove, rename, SeekMode, stat, lstat, truncate, writeFile, writeTextFile, exists, watch, watchImmediate, size };
