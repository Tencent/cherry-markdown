import { ICache } from "./icache";
/**
 * Saves data in new cache folder or reads it from old one.
 * Avoids perpetually growing cache and situations when things need to consider changed and then reverted data to be changed.
 */
export declare class RollingCache<DataType> implements ICache<DataType> {
    private cacheRoot;
    private oldCacheRoot;
    private newCacheRoot;
    private rolled;
    /** @param cacheRoot: root folder for the cache */
    constructor(cacheRoot: string);
    /** @returns true if name exists in either old cache or new cache */
    exists(name: string): boolean;
    path(name: string): string;
    /** @returns true if old cache contains all names and nothing more */
    match(names: string[]): boolean;
    /** @returns data for name, must exist in either old cache or new cache */
    read(name: string): DataType | null | undefined;
    write(name: string, data: DataType): void;
    touch(name: string): void;
    /** clears old cache and moves new in its place */
    roll(): void;
}
//# sourceMappingURL=rollingcache.d.ts.map