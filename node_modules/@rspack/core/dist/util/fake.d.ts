export type FakeHook<T> = T & {
    _fakeHook: true;
};
export declare function createFakeCompilationDependencies(getDeps: () => string[], addDeps: (deps: string[]) => void): {
    [Symbol.iterator](): Generator<string, void, unknown>;
    has(dep: string): boolean;
    add: (dep: string) => void;
    addAll: (deps: Iterable<string>) => void;
};
