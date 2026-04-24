import SuperJSON from './index.js';
export type PrimitiveTypeAnnotation = 'number' | 'undefined' | 'bigint';
type LeafTypeAnnotation = PrimitiveTypeAnnotation | 'regexp' | 'Date' | 'URL';
type TypedArrayAnnotation = ['typed-array', string];
type ClassTypeAnnotation = ['class', string];
type SymbolTypeAnnotation = ['symbol', string];
type CustomTypeAnnotation = ['custom', string];
type SimpleTypeAnnotation = LeafTypeAnnotation | 'map' | 'set' | 'Error';
type CompositeTypeAnnotation = TypedArrayAnnotation | ClassTypeAnnotation | SymbolTypeAnnotation | CustomTypeAnnotation;
export type TypeAnnotation = SimpleTypeAnnotation | CompositeTypeAnnotation;
export declare function isInstanceOfRegisteredClass(potentialClass: any, superJson: SuperJSON): potentialClass is any;
export declare const transformValue: (value: any, superJson: SuperJSON) => {
    value: any;
    type: TypeAnnotation;
} | undefined;
export declare const untransformValue: (json: any, type: TypeAnnotation, superJson: SuperJSON) => any;
export {};
