import type { CreateScriptHookDom } from './types';
export declare function safeWrapper<T extends (...args: Array<any>) => any>(callback: T, disableWarn?: boolean): Promise<ReturnType<T> | undefined>;
export declare function isStaticResourcesEqual(url1: string, url2: string): boolean;
export declare function createScript(info: {
    url: string;
    cb?: (value: void | PromiseLike<void>) => void;
    onErrorCallback?: (error: Error) => void;
    attrs?: Record<string, any>;
    needDeleteScript?: boolean;
    createScriptHook?: CreateScriptHookDom;
}): {
    script: HTMLScriptElement;
    needAttach: boolean;
};
export declare function createLink(info: {
    url: string;
    cb?: (value: void | PromiseLike<void>) => void;
    onErrorCallback?: (error: Error) => void;
    attrs: Record<string, string>;
    needDeleteLink?: boolean;
    createLinkHook?: (url: string, attrs?: Record<string, any>) => HTMLLinkElement | void;
}): {
    link: HTMLLinkElement;
    needAttach: boolean;
};
export declare function loadScript(url: string, info: {
    attrs?: Record<string, any>;
    createScriptHook?: CreateScriptHookDom;
}): Promise<void>;
