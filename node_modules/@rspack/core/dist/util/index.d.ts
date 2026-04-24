import type { LoaderObject } from "../loader-runner";
export declare function isNil(value: unknown): value is null | undefined;
export declare const toBuffer: (bufLike: string | Buffer | Uint8Array) => Buffer;
export declare const toObject: (input: string | Buffer | object) => object;
export declare function serializeObject(map: string | object | undefined | null): Buffer | undefined;
export declare function indent(str: string, prefix: string): string;
export declare function stringifyLoaderObject(o: LoaderObject): string;
export declare const unsupported: (name: string, issue?: string) => never;
