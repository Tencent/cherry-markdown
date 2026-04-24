/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { AbstractAstReflection } from '../syntax-tree.js';
import { MultiMap } from '../utils/collections.js';
import { isGrammar } from '../languages/generated/ast.js';
import { collectAst } from './type-system/ast-collector.js';
import { collectTypeHierarchy, findReferenceTypes, isAstType, mergeTypesAndInterfaces } from './type-system/types-util.js';
export function interpretAstReflection(grammarOrTypes, services) {
    let collectedTypes;
    if (isGrammar(grammarOrTypes)) {
        collectedTypes = collectAst(grammarOrTypes, { services });
    }
    else {
        collectedTypes = grammarOrTypes;
    }
    const allTypes = collectedTypes.interfaces.map(e => e.name).concat(collectedTypes.unions.filter(e => isAstType(e.type)).map(e => e.name));
    const references = buildReferenceTypes(collectedTypes);
    const metaData = buildTypeMetaData(collectedTypes);
    const superTypes = collectTypeHierarchy(mergeTypesAndInterfaces(collectedTypes)).superTypes;
    return new InterpretedAstReflection({
        allTypes,
        references,
        metaData,
        superTypes
    });
}
class InterpretedAstReflection extends AbstractAstReflection {
    constructor(options) {
        // Build the types object required by AbstractAstReflection
        const types = {};
        for (const typeName of options.allTypes) {
            const typeMetaData = options.metaData.get(typeName);
            if (typeMetaData) {
                const properties = {};
                // Convert properties array to object and add reference types
                if (Array.isArray(typeMetaData.properties)) {
                    for (const prop of typeMetaData.properties) {
                        const referenceKey = `${typeName}:${prop.name}`;
                        const referenceType = options.references.get(referenceKey);
                        properties[prop.name] = {
                            name: prop.name,
                            defaultValue: prop.defaultValue,
                            ...(referenceType && { referenceType })
                        };
                    }
                }
                else {
                    // If properties is already an object, copy it and add reference types
                    for (const [propName, prop] of Object.entries(typeMetaData.properties)) {
                        const referenceKey = `${typeName}:${propName}`;
                        const referenceType = options.references.get(referenceKey);
                        properties[propName] = {
                            ...prop,
                            ...(referenceType && { referenceType })
                        };
                    }
                }
                types[typeName] = {
                    name: typeName,
                    properties,
                    superTypes: Array.from(options.superTypes.get(typeName))
                };
            }
        }
        super();
        // Initialize the readonly types field
        Object.defineProperty(this, 'types', { value: types });
    }
    computeIsSubtype(subtype, originalSuperType) {
        const typeMetaData = this.types[subtype];
        if (!typeMetaData) {
            return false;
        }
        for (const superType of typeMetaData.superTypes) {
            if (this.isSubtype(superType, originalSuperType)) {
                return true;
            }
        }
        return false;
    }
}
function buildReferenceTypes(astTypes) {
    const references = new MultiMap();
    for (const interfaceType of astTypes.interfaces) {
        for (const property of interfaceType.properties) {
            for (const referenceType of findReferenceTypes(property.type)) {
                references.add(interfaceType.name, [property.name, referenceType]);
            }
        }
        for (const superType of interfaceType.interfaceSuperTypes) {
            const superTypeReferences = references.get(superType.name);
            references.addAll(interfaceType.name, superTypeReferences);
        }
    }
    const map = new Map();
    for (const [type, [property, target]] of references) {
        map.set(`${type}:${property}`, target);
    }
    return map;
}
function buildTypeMetaData(astTypes) {
    const map = new Map();
    for (const interfaceType of astTypes.interfaces) {
        const props = interfaceType.superProperties;
        map.set(interfaceType.name, {
            name: interfaceType.name,
            properties: buildPropertyMetaData(props),
            superTypes: [] // Will be populated later from superTypes data
        });
    }
    return map;
}
function buildPropertyMetaData(props) {
    const properties = {};
    const all = props.sort((a, b) => a.name.localeCompare(b.name));
    for (const property of all) {
        properties[property.name] = {
            name: property.name,
            defaultValue: property.defaultValue
        };
    }
    return properties;
}
//# sourceMappingURL=ast-reflection-interpreter.js.map