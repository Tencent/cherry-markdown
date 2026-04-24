interface ParsedResource {
    resource: string;
    path: string;
    query: string;
    fragment: string;
}
type ParsedResourceWithoutFragment = Omit<ParsedResource, "fragment">;
export declare const makePathsRelative: {
    (context: string, identifier: string, associatedObjectForCache: object | undefined): string;
    bindCache(associatedObjectForCache: object | undefined): ((arg0: string, arg1: string) => string);
    bindContextCache(context: string, associatedObjectForCache: object | undefined): ((arg0: string) => string);
};
export declare const contextify: {
    (context: string, identifier: string, associatedObjectForCache: object | undefined): string;
    bindCache(associatedObjectForCache: object | undefined): ((arg0: string, arg1: string) => string);
    bindContextCache(context: string, associatedObjectForCache: object | undefined): ((arg0: string) => string);
};
export declare const absolutify: {
    (context: string, identifier: string, associatedObjectForCache: object | undefined): string;
    bindCache(associatedObjectForCache: object | undefined): ((arg0: string, arg1: string) => string);
    bindContextCache(context: string, associatedObjectForCache: object | undefined): ((arg0: string) => string);
};
export declare const parseResource: {
    (str: string, associatedObjectForCache?: object): ParsedResource;
    bindCache(associatedObjectForCache: object): (str: string) => ParsedResource;
};
export declare const parseResourceWithoutFragment: {
    (str: string, associatedObjectForCache?: object): ParsedResourceWithoutFragment;
    bindCache(associatedObjectForCache: object): (str: string) => ParsedResourceWithoutFragment;
};
export {};
