declare global {
    var FEDERATION_DEBUG: string | undefined;
}
declare function isBrowserEnv(): boolean;
declare function isReactNativeEnv(): boolean;
declare function isDebugMode(): boolean;
declare const getProcessEnv: () => Record<string, string | undefined>;
export { isBrowserEnv, isReactNativeEnv, isDebugMode, getProcessEnv };
