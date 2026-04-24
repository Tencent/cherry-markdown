import binding from "@rspack/binding";
import type { Compiler, RspackPluginInstance } from "..";
type AffectedHooks = keyof Compiler["hooks"];
export declare function canInherentFromParent(affectedHooks?: AffectedHooks): boolean;
export declare abstract class RspackBuiltinPlugin implements RspackPluginInstance {
    abstract raw(compiler: Compiler): binding.BuiltinPlugin | undefined;
    abstract name: binding.BuiltinPluginName | CustomPluginName;
    affectedHooks?: AffectedHooks;
    apply(compiler: Compiler): void;
}
export declare function createBuiltinPlugin<R>(name: binding.BuiltinPluginName | CustomPluginName, options: R): binding.BuiltinPlugin;
type CustomPluginName = string;
export declare function create<T extends any[], R>(name: binding.BuiltinPluginName | CustomPluginName, resolve: (this: Compiler, ...args: T) => R, affectedHooks?: AffectedHooks): {
    new (...args: T): {
        name: string;
        _args: T;
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: Compiler): binding.BuiltinPlugin;
        apply(compiler: Compiler): void;
    };
};
/**
 * Create a wrapper class for builtin plugin.
 *
 * @example
 * ```js
 * const MyPlugin = createNativePlugin("MyPlugin", (options) => {
 * 	return options;
 * });
 *
 * new MyPlugin({
 * 	foo: "bar"
 * }).apply(compiler);
 * ```
 */
export declare function createNativePlugin<T extends any[], R>(name: CustomPluginName, resolve: (this: Compiler, ...args: T) => R, affectedHooks?: AffectedHooks): {
    new (...args: T): {
        name: string;
        _args: T;
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: Compiler): binding.BuiltinPlugin;
        apply(compiler: Compiler): void;
    };
};
export {};
