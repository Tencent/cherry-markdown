import { CreateScriptHookNode, FetchHook } from './types';
export declare const createScriptNode: (url: string, cb: (error?: Error, scriptContext?: any) => void, attrs?: Record<string, any>, loaderHook?: {
    createScriptHook?: CreateScriptHookNode;
    fetch?: FetchHook;
}) => void;
export declare const loadScriptNode: (url: string, info: {
    attrs?: Record<string, any>;
    loaderHook?: {
        createScriptHook?: CreateScriptHookNode;
    };
}) => Promise<void>;
