/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
export function isAstNode(obj) {
    return typeof obj === 'object' && obj !== null && typeof obj.$type === 'string';
}
export function isReference(obj) {
    return typeof obj === 'object' && obj !== null && typeof obj.$refText === 'string' && 'ref' in obj;
}
export function isMultiReference(obj) {
    return typeof obj === 'object' && obj !== null && typeof obj.$refText === 'string' && 'items' in obj;
}
export function isAstNodeDescription(obj) {
    return typeof obj === 'object' && obj !== null
        && typeof obj.name === 'string'
        && typeof obj.type === 'string'
        && typeof obj.path === 'string';
}
export function isLinkingError(obj) {
    return typeof obj === 'object' && obj !== null
        && typeof obj.info === 'object'
        && typeof obj.message === 'string';
}
/**
 * An abstract implementation of the {@link AstReflection} interface.
 * Serves to cache subtype computation results to improve performance throughout different parts of Langium.
 */
export class AbstractAstReflection {
    constructor() {
        this.subtypes = {};
        this.allSubtypes = {};
    }
    getAllTypes() {
        return Object.keys(this.types);
    }
    getReferenceType(refInfo) {
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
    getTypeMetaData(type) {
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
    isInstance(node, type) {
        return isAstNode(node) && this.isSubtype(node.$type, type);
    }
    isSubtype(subtype, supertype) {
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
        }
        else {
            const metaData = this.types[subtype];
            const result = metaData ? metaData.superTypes.some(s => this.isSubtype(s, supertype)) : false;
            nested[supertype] = result;
            return result;
        }
    }
    getAllSubTypes(type) {
        const existing = this.allSubtypes[type];
        if (existing) {
            return existing;
        }
        else {
            const allTypes = this.getAllTypes();
            const types = [];
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
export function isCompositeCstNode(node) {
    return typeof node === 'object' && node !== null && Array.isArray(node.content);
}
export function isLeafCstNode(node) {
    return typeof node === 'object' && node !== null && typeof node.tokenType === 'object';
}
export function isRootCstNode(node) {
    return isCompositeCstNode(node) && typeof node.fullText === 'string';
}
//# sourceMappingURL=syntax-tree.js.map