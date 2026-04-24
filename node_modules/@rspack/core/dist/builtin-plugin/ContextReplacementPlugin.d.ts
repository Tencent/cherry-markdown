export declare const ContextReplacementPlugin: {
    new (resourceRegExp: RegExp, newContentResource?: any, newContentRecursive?: any, newContentRegExp?: any): {
        name: string;
        _args: [resourceRegExp: RegExp, newContentResource?: any, newContentRecursive?: any, newContentRegExp?: any];
        affectedHooks: keyof import("..").CompilerHooks | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
