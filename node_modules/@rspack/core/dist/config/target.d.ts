/**
 * @param context the context directory
 * @returns default target
 */
export declare const getDefaultTarget: (context: string) => "browserslist" | "web";
export type PlatformTargetProperties = {
    /** web platform, importing of http(s) and std: is available */
    web: boolean | null;
    /** browser platform, running in a normal web browser */
    browser: boolean | null;
    /** (Web)Worker platform, running in a web/shared/service worker */
    webworker: boolean | null;
    /** node platform, require of node built-in modules is available */
    node: boolean | null;
    /** nwjs platform, require of legacy nw.gui is available */
    nwjs: boolean | null;
    /** electron platform, require of some electron built-in modules is available */
    electron: boolean | null;
};
export type ElectronContextTargetProperties = {
    /**  in main context */
    electronMain: boolean | null;
    /**  in preload context */
    electronPreload: boolean | null;
    /**  in renderer context with node integration */
    electronRenderer: boolean | null;
};
export type ApiTargetProperties = {
    /**  has require function available */
    require: boolean | null;
    /**  has node.js built-in modules available */
    nodeBuiltins: boolean | null;
    /**  node.js allows to use `node:` prefix for core modules */
    nodePrefixForCoreModules: boolean | null;
    /**  has document available (allows script tags) */
    document: boolean | null;
    /**  has importScripts available */
    importScripts: boolean | null;
    /**  has importScripts available when creating a worker */
    importScriptsInWorker: boolean | null;
    /**  has fetch function available for WebAssembly */
    fetchWasm: boolean | null;
    /**  has global variable available */
    global: boolean | null;
};
export type EcmaTargetProperties = {
    /**  has globalThis variable available */
    globalThis: boolean | null;
    /**  big int literal syntax is available */
    bigIntLiteral: boolean | null;
    /**  const and let variable declarations are available */
    const: boolean | null;
    /**  method shorthand in object is available  */
    methodShorthand: boolean | null;
    /**  arrow functions are available */
    arrowFunction: boolean | null;
    /**  for of iteration is available */
    forOf: boolean | null;
    /**  destructuring is available */
    destructuring: boolean | null;
    /**  async import() is available */
    dynamicImport: boolean | null;
    /**  async import() is available when creating a worker */
    dynamicImportInWorker: boolean | null;
    /**  ESM syntax is available (when in module) */
    module: boolean | null;
    /**  optional chaining is available */
    optionalChaining: boolean | null;
    /**  template literal is available */
    templateLiteral: boolean | null;
    /**  async functions and await are available */
    asyncFunction: boolean | null;
};
type Never<T> = {
    [P in keyof T]?: never;
};
type Mix<A, B> = (A & Never<B>) | (Never<A> & B) | (A & B);
type TargetProperties = Mix<Mix<PlatformTargetProperties, ElectronContextTargetProperties>, Mix<ApiTargetProperties, EcmaTargetProperties>>;
/**
 * @param target the target
 * @param context the context directory
 * @returns target properties
 */
export declare const getTargetProperties: (target: string, context: string) => TargetProperties;
/**
 * @param targets the targets
 * @param context the context directory
 * @returns target properties
 */
export declare const getTargetsProperties: (targets: string[], context: string) => TargetProperties;
export {};
