export declare function normalizeOptions<T>(enableDefault: boolean, defaultOptions: T, key: string): <U extends boolean | undefined | T>(options: U) => T | false;
