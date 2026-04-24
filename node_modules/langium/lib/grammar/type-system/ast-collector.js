/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import {} from '../../languages/generated/ast.js';
import {} from '../../services.js';
import { collectTypeResources } from './type-collector/all-types.js';
import { plainToTypes } from './type-collector/plain-types.js';
import { isInterfaceType, isPrimitiveType, isPropertyUnion, isStringType, isUnionType, isValueType } from './type-collector/types.js';
import { findAstTypes, isAstType } from './types-util.js';
/**
 * Collects all types for the generated AST. The types collector entry point.
 *
 * @param grammars All grammars involved in the type generation process
 * @param config some optional configurations
 */
export function collectAst(grammars, config) {
    const { inferred, declared } = collectTypeResources(grammars, config?.services);
    const result = createAstTypes(inferred, declared);
    if (config?.filterNonAstTypeUnions) {
        result.unions = result.unions.filter(e => isAstType(e.type));
    }
    return result;
}
/**
 * Collects all types used during the validation process.
 * The validation process requires us to compare our inferred types with our declared types.
 *
 * @param grammars All grammars involved in the validation process
 * @param services Langium core services to resolve imports as needed, and to pass along JSDoc comments to the generated AST
 */
export function collectValidationAst(grammars, services) {
    const { inferred, declared, astResources } = collectTypeResources(grammars, services);
    return {
        astResources,
        inferred: createAstTypes(declared, inferred),
        declared: createAstTypes(inferred, declared)
    };
}
export function createAstTypes(first, second) {
    const astTypes = {
        interfaces: mergeAndRemoveDuplicates(...first.interfaces, ...second?.interfaces ?? []),
        unions: mergeAndRemoveDuplicates(...first.unions, ...second?.unions ?? []),
    };
    const finalTypes = plainToTypes(astTypes);
    specifyAstNodeProperties(finalTypes);
    return finalTypes;
}
/**
 * Merges the lists of given elements into a single list and removes duplicates. Elements later in the lists get precedence over earlier elements.
 *
 * The distinction is performed over the `name` property of the element. The result is a name-sorted list of elements.
 */
function mergeAndRemoveDuplicates(...elements) {
    return Array.from(elements
        .reduce((acc, type) => { acc.set(type.name, type); return acc; }, new Map())
        .values()).sort((a, b) => a.name.localeCompare(b.name));
}
export function specifyAstNodeProperties(astTypes) {
    const nameToType = filterInterfaceLikeTypes(astTypes);
    const array = Array.from(nameToType.values());
    addSubTypes(array);
    buildContainerTypes(astTypes.interfaces);
    buildTypeNames(array);
}
function buildTypeNames(types) {
    // Recursively collect all subtype names
    const visited = new Set();
    const collect = (type) => {
        if (visited.has(type))
            return;
        visited.add(type);
        type.typeNames.add(type.name);
        for (const subtype of type.subTypes) {
            collect(subtype);
            subtype.typeNames.forEach(n => type.typeNames.add(n));
        }
    };
    types.forEach(collect);
}
/**
 * Removes union types that reference only to primitive types or
 * types that reference only to primitive types.
 */
function filterInterfaceLikeTypes({ interfaces, unions }) {
    const nameToType = interfaces.concat(unions)
        .reduce((acc, e) => { acc.set(e.name, e); return acc; }, new Map());
    const cache = new Map();
    for (const union of unions) {
        cache.set(union, isDataType(union.type, new Set()));
    }
    for (const [union, isDataType] of cache) {
        if (isDataType) {
            nameToType.delete(union.name);
        }
    }
    return nameToType;
}
function isDataType(property, visited) {
    if (visited.has(property)) {
        return true;
    }
    visited.add(property);
    if (isPropertyUnion(property)) {
        return property.types.every(e => isDataType(e, visited));
    }
    else if (isValueType(property)) {
        const value = property.value;
        if (isUnionType(value)) {
            return isDataType(value.type, visited);
        }
        else {
            return false;
        }
    }
    else {
        return isPrimitiveType(property) || isStringType(property);
    }
}
function addSubTypes(types) {
    for (const interfaceType of types) {
        for (const superTypeName of interfaceType.superTypes) {
            superTypeName.subTypes.add(interfaceType);
        }
    }
}
/**
 * Builds types of `$container` property.
 * @param interfaces Interfaces for which container types are calculated.
 */
function buildContainerTypes(interfaces) {
    const nameToInterface = interfaces
        .reduce((acc, type) => { acc.set(type.name, type); return acc; }, new Map());
    // 1st stage: collect container types
    for (const containerType of interfaces) {
        const types = containerType.properties.flatMap(property => findAstTypes(property.type));
        for (const type of types) {
            nameToInterface.get(type)?.containerTypes.add(containerType);
        }
    }
    // 2nd stage: lift the container types of containers to parents
    // if one of the children has no container types, the parent also loses container types
    // contains type names that have children and at least one of them has no container types
    const emptyContainerTypes = new Set();
    const queue = interfaces.filter(interf => interf.subTypes.size === 0);
    const visited = new Set(queue);
    while (queue.length > 0) {
        const interf = queue.shift();
        if (interf) {
            for (const superType of interf.superTypes) {
                if (isInterfaceType(superType)) {
                    if (interf.containerTypes.size === 0) {
                        emptyContainerTypes.add(superType.name);
                        superType.containerTypes.clear();
                    }
                    else if (!emptyContainerTypes.has(superType.name)) {
                        interf.containerTypes.forEach(e => superType.containerTypes.add(e));
                    }
                    if (!visited.has(superType)) {
                        visited.add(superType);
                        queue.push(superType);
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=ast-collector.js.map