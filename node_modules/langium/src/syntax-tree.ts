/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { TokenType } from 'chevrotain';
import type { URI } from './utils/uri-utils.js';
import type { AbstractElement } from './languages/generated/ast.js';
import type { DocumentSegment, LangiumDocument } from './workspace/documents.js';

/**
 * A node in the Abstract Syntax Tree (AST).
 */
export interface AstNode {
    /** Every AST node has a type corresponding to what was specified in the grammar declaration. */
    readonly $type: string;
    /** The container node in the AST; every node except the root node has a container. */
    readonly $container?: AstNode;
    /** The property of the `$container` node that contains this node. This is either a direct reference or an array. */
    readonly $containerProperty?: string;
    /** In case `$containerProperty` is an array, the array index is stored here. */
    readonly $containerIndex?: number;
    /** The Concrete Syntax Tree (CST) node of the text range from which this node was parsed. */
    readonly $cstNode?: CstNode;
    /** The document containing the AST; only the root node has a direct reference to the document. */
    readonly $document?: LangiumDocument;
}

export function isAstNode(obj: unknown): obj is AstNode {
    return typeof obj === 'object' && obj !== null && typeof (obj as AstNode).$type === 'string';
}

export interface GenericAstNode extends AstNode {
    [key: string]: unknown
}

type SpecificNodeProperties<N extends AstNode> = keyof Omit<N, keyof AstNode | number | symbol>;

/**
 * The property names of a given AST node type.
 */
export type Properties<N extends AstNode> = SpecificNodeProperties<N> extends never ? string : SpecificNodeProperties<N>

/**
 * A cross-reference in the AST. Cross-references may or may not be successfully resolved.
 */
export interface Reference<T extends AstNode = AstNode> {
    /**
     * The target AST node of this reference. Accessing this property may trigger cross-reference
     * resolution by the `Linker` in case it has not been done yet. If the reference cannot be resolved,
     * the value is `undefined`.
     */
    readonly ref: T | undefined;

    /** If any problem occurred while resolving the reference, it is described by this property. */
    readonly error?: LinkingError;
    /** The CST node from which the reference was parsed */
    readonly $refNode?: CstNode;
    /** The actual text used to look up in the surrounding scope */
    readonly $refText: string;
    /** The node description for the AstNode returned by `ref`  */
    readonly $nodeDescription?: AstNodeDescription;
}

export interface MultiReference<T extends AstNode = AstNode> {
    /** The CST node from which the reference was parsed */
    readonly $refNode?: CstNode;
    /** The actual text used to look up in the surrounding scope */
    readonly $refText: string;
    /**
     * The resolved references. Accessing this property may trigger cross-reference
     * resolution by the `Linker` in case it has not been done yet.
     * If no references can be found, the array is empty (but not `undefined`)
     * and the `error` property is set.
     */
    readonly items: Array<MultiReferenceItem<T>>;
    /** If any problem occurred while resolving the reference, it is described by this property. */
    readonly error?: LinkingError;
}

/**
 * Represents a single resolved reference of a {@link MultiReference} instance.
 */
export interface MultiReferenceItem<T extends AstNode = AstNode> {
    /** The node description for the AstNode returned by `ref`  */
    readonly $nodeDescription?: AstNodeDescription;
    /**
     * The target AST node of this reference.
     */
    readonly ref: T;
}

export function isReference(obj: unknown): obj is Reference {
    return typeof obj === 'object' && obj !== null && typeof (obj as Reference).$refText === 'string' && 'ref' in obj;
}

export function isMultiReference(obj: unknown): obj is MultiReference {
    return typeof obj === 'object' && obj !== null && typeof (obj as Reference).$refText === 'string' && 'items' in obj;
}

export type ResolvedReference<T extends AstNode = AstNode> = Reference<T> & {
    readonly ref: T;
}

/**
 * A description of an AST node is used when constructing scopes and looking up cross-reference targets.
 */
export interface AstNodeDescription {
    /** The target node; should be present only for local references (linking to the same document). */
    node?: AstNode;
    /**
     * The document segment that represents the range of the name of the AST node.
     */
    nameSegment?: DocumentSegment;
    /**
     * The document segment that represents the full range of the AST node.
     */
    selectionSegment?: DocumentSegment;
    /** `$type` property value of the AST node */
    type: string;
    /** Name of the AST node; this is usually determined by the `NameProvider` service. */
    name: string;
    /** URI to the document containing the AST node */
    documentUri: URI;
    /** Navigation path inside the document */
    path: string;
}

export function isAstNodeDescription(obj: unknown): obj is AstNodeDescription {
    return typeof obj === 'object' && obj !== null
        && typeof (obj as AstNodeDescription).name === 'string'
        && typeof (obj as AstNodeDescription).type === 'string'
        && typeof (obj as AstNodeDescription).path === 'string';
}

/**
 * Information about a cross-reference. This is used when traversing references in an AST or to describe
 * unresolved references.
 */
export interface ReferenceInfo {
    reference: Reference | MultiReference
    container: AstNode
    property: string
    index?: number
}

/**
 * Used to collect information when the `Linker` service fails to resolve a cross-reference.
 */
export interface LinkingError {
    message: string;
    info: ReferenceInfo;
    targetDescription?: AstNodeDescription;
}

export function isLinkingError(obj: unknown): obj is LinkingError {
    return typeof obj === 'object' && obj !== null
        && typeof (obj as LinkingError).info === 'object'
        && typeof (obj as LinkingError).message === 'string';
}

/**
 * Service used for generic access to the structure of the AST. This service is shared between
 * all involved languages, so it operates on the superset of types of these languages.
 */
export interface AstReflection {
    readonly types: AstMetaData
    getAllTypes(): string[]
    getReferenceType(refInfo: ReferenceInfo): string
    getTypeMetaData(type: string): TypeMetaData
    isInstance(node: unknown, type: string): boolean
    isSubtype(subtype: string, supertype: string): boolean
    getAllSubTypes(type: string): string[]
}

/**
 * An abstract implementation of the {@link AstReflection} interface.
 * Serves to cache subtype computation results to improve performance throughout different parts of Langium.
 */
export abstract class AbstractAstReflection implements AstReflection {

    readonly types: AstMetaData;
    protected subtypes: Record<string, Record<string, boolean | undefined>> = {};
    protected allSubtypes: Record<string, string[] | undefined> = {};

    getAllTypes(): string[] {
        return Object.keys(this.types);
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const metaData = this.types[refInfo.container.$type];
        if (!metaData) {
            throw new Error(`Type ${refInfo.container.$type || 'undefined'} not found.`);
        }
        const referenceType = metaData.properties[refInfo.property]?.referenceType;
        if (!referenceType) {
            throw new Error(`Property ${refInfo.property || 'undefined'} of type ${refInfo.container.$type} is not a reference.`);
        }
        return referenceType;
    }

    getTypeMetaData(type: string): TypeMetaData {
        const result = this.types[type];
        if (!result) {
            return {
                name: type,
                properties: {},
                superTypes: []
            };
        }
        return result;
    }

    isInstance(node: unknown, type: string): boolean {
        return isAstNode(node) && this.isSubtype(node.$type, type);
    }

    isSubtype(subtype: string, supertype: string): boolean {
        if (subtype === supertype) {
            return true;
        }
        let nested = this.subtypes[subtype];
        if (!nested) {
            nested = this.subtypes[subtype] = {};
        }
        const existing = nested[supertype];
        if (existing !== undefined) {
            return existing;
        } else {
            const metaData = this.types[subtype];
            const result = metaData ? metaData.superTypes.some(s => this.isSubtype(s, supertype)) : false;
            nested[supertype] = result;
            return result;
        }
    }

    getAllSubTypes(type: string): string[] {
        const existing = this.allSubtypes[type];
        if (existing) {
            return existing;
        } else {
            const allTypes = this.getAllTypes();
            const types: string[] = [];
            for (const possibleSubType of allTypes) {
                if (this.isSubtype(possibleSubType, type)) {
                    types.push(possibleSubType);
                }
            }
            this.allSubtypes[type] = types;
            return types;
        }
    }
}

/**
 * A map of all AST node types and their meta data.
 */
export interface AstMetaData {
    [type: string]: TypeMetaData
}

/**
 * Represents runtime meta data about an AST node type.
 */
export interface TypeMetaData {
    /** The name of this AST node type. Corresponds to the `AstNode.$type` value. */
    name: string
    /** A list of properties with their relevant meta data. */
    properties: {
        [name: string]: PropertyMetaData
    }
    /** The super types of this AST node type. */
    superTypes: string[]
}

/**
 * Describes the meta data of a property of an AST node.
 */
export interface PropertyMetaData {
    /** The name of this property. */
    name: string
    /**
     * Indicates that the property is mandatory in the AST node.
     * For example, if an AST node contains an array, but no elements of this array have been parsed,
     * we still expect an empty array instead of `undefined`.
     */
    defaultValue?: PropertyType
    /**
     * If the property is a reference, this is the type of the reference target.
     */
    referenceType?: string
}

/**
 * Represents a default value for an AST property.
 */
export type PropertyType = number | string | boolean | PropertyType[];

/**
 * A node in the Concrete Syntax Tree (CST).
 */
export interface CstNode extends DocumentSegment {
    /** The container node in the CST */
    readonly container?: CompositeCstNode;
    /** The actual text */
    readonly text: string;
    /** The root CST node */
    readonly root: RootCstNode;
    /** The grammar element from which this node was parsed */
    readonly grammarSource?: AbstractElement;
    /** The AST node created from this CST node */
    readonly astNode: AstNode;
    /** Whether the token is hidden, i.e. not explicitly part of the containing grammar rule */
    readonly hidden: boolean;
}

/**
 * A composite CST node contains other nodes, but no directly associated token.
 */
export interface CompositeCstNode extends CstNode {
    readonly content: CstNode[];
}

export function isCompositeCstNode(node: unknown): node is CompositeCstNode {
    return typeof node === 'object' && node !== null && Array.isArray((node as CompositeCstNode).content);
}

/**
 * A leaf CST node corresponds to a token in the input token stream.
 */
export interface LeafCstNode extends CstNode {
    readonly tokenType: TokenType;
}

export function isLeafCstNode(node: unknown): node is LeafCstNode {
    return typeof node === 'object' && node !== null && typeof (node as LeafCstNode).tokenType === 'object';
}

export interface RootCstNode extends CompositeCstNode {
    readonly fullText: string
}

export function isRootCstNode(node: unknown): node is RootCstNode {
    return isCompositeCstNode(node) && typeof (node as RootCstNode).fullText === 'string';
}

/**
 * Describes a union type including only names(!) of properties of type T whose property value is of a certain type K,
 *  or 'never' in case of no such properties.
 * It evaluates the value type regardless of the property being optional or not by converting T to Required<T>.
 * Note the '-?' in '[I in keyof T]-?:' that is required to map all optional but un-intended properties to 'never'.
 * Without that, optional props like those inherited from 'AstNode' would be mapped to 'never|undefined',
 *  and the subsequent value mapping ('...[keyof T]') would yield 'undefined' instead of 'never' for AstNode types
 *  not having any property matching type K, which in turn yields follow-up errors.
 */
type ExtractKeysOfValueType<T, K> = { [I in keyof T]-?: Required<T>[I] extends K ? I : never }[keyof T];

export type SingleCrossReferencesOfAstNodeType<N extends AstNode> = ExtractKeysOfValueType<N, Reference | Reference[]>;
export type MultiCrossReferencesOfAstNodeType<N extends AstNode> = ExtractKeysOfValueType<N, MultiReference | MultiReference[]>;
/**
 * Describes a union type including only names(!) of the cross-reference properties of the given AstNode type.
 * Enhances compile-time validation of cross-reference distinctions, e.g. in scope providers
 *  in combination with `assertUnreachable(context.property)`.
 */
export type CrossReferencesOfAstNodeType<N extends AstNode> = SingleCrossReferencesOfAstNodeType<N> | MultiCrossReferencesOfAstNodeType<N>;

/**
 * Represents the enumeration-like type, that lists all AstNode types of your grammar.
 */
export type AstTypeList<T> = Record<keyof T, AstNode>;

/**
 * Describes a union type including of all AstNode types containing cross-references.
 *  A is meant to be the interface `XXXAstType` fromm your generated `ast.ts` file.
 * Enhances compile-time validation of cross-reference distinctions, e.g. in scope providers
 *  in combination with `assertUnreachable(context.container)`.
 */
export type AstNodeTypesWithCrossReferences<A extends AstTypeList<A>> = {
    [T in keyof A]-?: CrossReferencesOfAstNodeType<A[T]> extends never ? never : A[T]
}[keyof A];

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
};
