export type CreateScriptHookReturnNode = {
    url: string;
} | void;
export type CreateScriptHookReturnDom = HTMLScriptElement | {
    script?: HTMLScriptElement;
    timeout?: number;
} | void;
export type CreateScriptHookReturn = CreateScriptHookReturnNode | CreateScriptHookReturnDom;
export type CreateScriptHookNode = (url: string, attrs?: Record<string, any> | undefined) => CreateScriptHookReturnNode;
export type CreateScriptHookDom = (url: string, attrs?: Record<string, any> | undefined) => CreateScriptHookReturnDom;
export type CreateScriptHook = (url: string, attrs?: Record<string, any> | undefined) => CreateScriptHookReturn;
export type FetchHook = (args: [string, RequestInit]) => Promise<Response> | void | false;
