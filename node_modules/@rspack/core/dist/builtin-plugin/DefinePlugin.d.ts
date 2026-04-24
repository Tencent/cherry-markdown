export type DefinePluginOptions = Record<string, CodeValue>;
export declare const DefinePlugin: {
    new (define: DefinePluginOptions): {
        name: string;
        _args: [define: DefinePluginOptions];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
type CodeValue = RecursiveArrayOrRecord<CodeValuePrimitive>;
type CodeValuePrimitive = null | undefined | RegExp | Function | string | number | boolean | bigint;
type RecursiveArrayOrRecord<T> = {
    [index: string]: RecursiveArrayOrRecord<T>;
} | RecursiveArrayOrRecord<T>[] | T;
export {};
