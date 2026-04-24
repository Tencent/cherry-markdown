type ContainerOptionsFormat<T> = (string | Record<string, string | string[] | T>)[] | Record<string, string | string[] | T>;
export declare const parseOptions: <T, R>(options: ContainerOptionsFormat<T>, normalizeSimple: (a: string | string[], b: string) => R, normalizeOptions: (a: T, b: string) => R) => [string, R][];
export {};
