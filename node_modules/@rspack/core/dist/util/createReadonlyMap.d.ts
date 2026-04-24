export declare function createReadonlyMap<T>(obj: Pick<ReadonlyMap<string, T>, "get" | "keys">): ReadonlyMap<string, Readonly<T>>;
