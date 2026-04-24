export declare function reactiveArray<I, O>(getArr: () => I[], getGetter: (item: () => I, index: number) => () => O): readonly Readonly<O>[];
export declare function computedSet<T>(source: () => Set<T>): () => Set<T>;
export declare function computedArray<T>(source: () => T[], compareFn?: (oldItem: T, newItem: T) => boolean): () => T[];
