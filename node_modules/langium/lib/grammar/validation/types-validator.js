/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import * as ast from '../../languages/generated/ast.js';
import { MultiMap } from '../../utils/collections.js';
import { extractAssignments } from '../internal-grammar-util.js';
import { getExplicitRuleType } from '../../utils/grammar-utils.js';
import { flattenPropertyUnion, InterfaceType, isArrayType, isInterfaceType, isMandatoryPropertyType, isPrimitiveType, isPropertyUnion, isReferenceType, isStringType, isTypeAssignable, isUnionType, isValueType, propertyTypeToString } from '../type-system/type-collector/types.js';
import { getTypeOption, isDeclared, isInferred, isInferredAndDeclared } from '../workspace/documents.js';
import { getDocument } from '../../utils/ast-utils.js';
export function registerTypeValidationChecks(services) {
    const registry = services.validation.ValidationRegistry;
    const typesValidator = services.validation.LangiumGrammarTypesValidator;
    const checks = {
        Action: [
            typesValidator.checkActionIsNotUnionType,
        ],
        Grammar: [
            typesValidator.checkDeclaredTypesConsistency,
            typesValidator.checkDeclaredAndInferredTypesConsistency
        ],
        InfixRule: [
            typesValidator.checkInfixRuleExplicitReturnType,
        ],
        Interface: [
            typesValidator.checkAttributeDefaultValue,
            typesValidator.checkCyclicInterface
        ],
        Type: [
            typesValidator.checkCyclicType
        ]
    };
    registry.register(checks, typesValidator);
}
export class LangiumGrammarTypesValidator {
    checkAttributeDefaultValue(grammarInterface, accept) {
        const validationResources = getDocument(grammarInterface)?.validationResources;
        if (!validationResources) {
            return;
        }
        const matchedProperties = matchInterfaceAttributes(validationResources, grammarInterface);
        for (const [grammarProperty, property] of matchedProperties) {
            const defaultType = getDefaultValueType(grammarProperty.defaultValue);
            if (defaultType && !isTypeAssignable(defaultType, property.type)) {
                accept('error', `Cannot assign default value of type '${propertyTypeToString(defaultType, 'DeclaredType')}' to type '${propertyTypeToString(property.type, 'DeclaredType')}'.`, {
                    node: grammarProperty,
                    property: 'defaultValue'
                });
            }
        }
    }
    checkCyclicType(type, accept) {
        if (isCyclicType(type, new Set())) {
            accept('error', `Type alias '${type.name}' circularly references itself.`, { node: type, property: 'name' });
        }
    }
    checkCyclicInterface(type, accept) {
        if (isCyclicType(type, new Set())) {
            accept('error', `Type '${type.name}' recursively references itself as a base type.`, { node: type, property: 'name' });
        }
    }
    checkDeclaredTypesConsistency(grammar, accept) {
        const validationResources = grammar.$document?.validationResources;
        if (validationResources) {
            for (const typeInfo of validationResources.typeToValidationInfo.values()) {
                if (isDeclared(typeInfo) && isInterfaceType(typeInfo.declared) && ast.isInterface(typeInfo.declaredNode)) {
                    const declInterface = typeInfo;
                    validateInterfaceSuperTypes(declInterface, accept);
                    validateSuperTypesConsistency(declInterface, accept);
                }
            }
        }
    }
    checkDeclaredAndInferredTypesConsistency(grammar, accept) {
        const validationResources = grammar.$document?.validationResources;
        if (validationResources) {
            for (const typeInfo of validationResources.typeToValidationInfo.values()) {
                if (isInferred(typeInfo) && typeInfo.inferred instanceof InterfaceType) {
                    validateInferredInterface(typeInfo.inferred, accept);
                }
                if (isInferredAndDeclared(typeInfo)) {
                    validateDeclaredAndInferredConsistency(typeInfo, validationResources, accept);
                }
            }
        }
    }
    checkActionIsNotUnionType(action, accept) {
        if (ast.isType(action.type)) {
            accept('error', 'Actions cannot create union types.', { node: action, property: 'type' });
        }
    }
    checkInfixRuleExplicitReturnType(infixRule, accept) {
        if (!infixRule.returnType?.ref) {
            return;
        }
        const validationResources = getDocument(infixRule)?.validationResources;
        if (!validationResources) {
            return;
        }
        const returnTypeName = infixRule.returnType.ref.name;
        const returnTypeProperties = validationResources.typeToSuperProperties.get(returnTypeName);
        if (!returnTypeProperties) {
            return;
        }
        const propertyMap = new Map(returnTypeProperties.map(prop => [prop.name, prop]));
        // Check for 'operator' property
        const operatorProp = propertyMap.get('operator');
        if (!operatorProp) {
            accept('error', `Infix rule '${infixRule.name}' with explicit return type '${returnTypeName}' must have an 'operator' property.`, {
                node: infixRule,
                property: 'returnType'
            });
        }
        else {
            // Validate operator property type
            const operatorKeywords = infixRule.operators.precedences.flatMap(prec => prec.operators.map(op => op.value));
            const isValidOperatorType = this.isValidOperatorPropertyType(operatorProp.type, operatorKeywords);
            if (!isValidOperatorType) {
                const expectedType = operatorKeywords.length > 1
                    ? `one of: ${operatorKeywords.map(op => `'${op}'`).join(', ')}`
                    : `'${operatorKeywords[0]}'`;
                accept('error', `Property 'operator' must be of type 'string' or ${expectedType}.`, {
                    node: infixRule,
                    property: 'returnType'
                });
            }
        }
        // Check for 'left' and 'right' properties
        const callRule = infixRule.call.rule.ref;
        if (!callRule) {
            return;
        }
        const callRuleType = getExplicitRuleType(callRule) ?? callRule.name;
        for (const propName of ['left', 'right']) {
            const prop = propertyMap.get(propName);
            if (!prop) {
                accept('error', `Infix rule '${infixRule.name}' with explicit return type '${returnTypeName}' must have a '${propName}' property.`, {
                    node: infixRule,
                    property: 'returnType'
                });
            }
            else {
                // Validate that the property type matches or is a supertype of the called rule
                const isValidType = this.isValidLeftRightPropertyType(prop.type, callRuleType, validationResources);
                if (!isValidType) {
                    accept('error', `Property '${propName}' must be of type '${callRuleType}' or a supertype of it.`, {
                        node: infixRule,
                        property: 'returnType'
                    });
                }
            }
        }
    }
    isValidOperatorPropertyType(propertyType, operatorKeywords) {
        const union = {
            types: operatorKeywords.map(keyword => ({ string: keyword }))
        };
        return isTypeAssignable(union, propertyType);
    }
    isValidLeftRightPropertyType(propertyType, callRuleTypeName, validationResources) {
        const callRuleTypeInfo = validationResources.typeToValidationInfo.get(callRuleTypeName);
        if (callRuleTypeInfo) {
            const callRuleType = getTypeOption(callRuleTypeInfo);
            return isTypeAssignable({ value: callRuleType }, propertyType);
        }
        return false;
    }
}
function matchInterfaceAttributes(resources, grammarInterface) {
    const elements = [];
    const interfaceType = resources.typeToValidationInfo.get(grammarInterface.name);
    if (interfaceType && isDeclared(interfaceType) && isInterfaceType(interfaceType.declared)) {
        for (const grammarProperty of grammarInterface.attributes.filter(prop => prop.defaultValue)) {
            const property = interfaceType.declared.properties.find(e => e.name === grammarProperty.name);
            if (property) {
                elements.push([grammarProperty, property]);
            }
        }
    }
    return elements;
}
function getDefaultValueType(defaultValue) {
    if (ast.isBooleanLiteral(defaultValue)) {
        return { primitive: 'boolean' };
    }
    else if (ast.isNumberLiteral(defaultValue)) {
        return { primitive: 'number' };
    }
    else if (ast.isStringLiteral(defaultValue)) {
        return { string: defaultValue.value };
    }
    else if (ast.isArrayLiteral(defaultValue)) {
        return { elementType: generateElementType(defaultValue) };
    }
    else {
        return undefined;
    }
}
function generateElementType(arrayLiteral) {
    if (arrayLiteral.elements.length === 0) {
        return undefined;
    }
    const foundTypes = [];
    for (const element of arrayLiteral.elements) {
        const elementType = getDefaultValueType(element);
        if (!elementType) {
            continue;
        }
        if (isPrimitiveType(elementType)) {
            if (!(foundTypes.some(e => isPrimitiveType(e) && e.primitive === elementType.primitive))) {
                foundTypes.push(elementType);
            }
        }
        else if (isStringType(elementType)) {
            if (!(foundTypes.some(e => isStringType(e) && e.string === elementType.string))) {
                foundTypes.push(elementType);
            }
        }
        else {
            foundTypes.push(elementType);
        }
    }
    if (foundTypes.length === 0) {
        return undefined;
    }
    else if (foundTypes.length === 1) {
        return foundTypes[0];
    }
    else {
        return {
            types: foundTypes
        };
    }
}
function isCyclicType(type, visited) {
    if (visited.has(type)) {
        return true;
    }
    visited.add(type);
    if (ast.isType(type)) {
        return isCyclicType(type.type, visited);
    }
    else if (ast.isInterface(type)) {
        return type.superTypes.some(t => t.ref && isCyclicType(t.ref, new Set(visited)));
    }
    else if (ast.isSimpleType(type)) {
        if (type.typeRef?.ref) {
            return isCyclicType(type.typeRef.ref, visited);
        }
    }
    else if (ast.isReferenceType(type)) {
        return isCyclicType(type.referenceType, visited);
    }
    else if (ast.isArrayType(type)) {
        return isCyclicType(type.elementType, visited);
    }
    else if (ast.isUnionType(type)) {
        return type.types.some(t => isCyclicType(t, new Set(visited)));
    }
    return false;
}
function validateInferredInterface(inferredInterface, accept) {
    inferredInterface.properties.forEach(prop => {
        const flattened = flattenPropertyUnion(prop.type);
        if (flattened.length > 1) {
            const typeKind = (type) => isReferenceType(type) ? (type.isMulti ? 'multi-ref' : 'ref') : 'other';
            const firstKind = typeKind(flattened[0]);
            if (flattened.slice(1).some(type => typeKind(type) !== firstKind)) {
                const targetNode = prop.astNodes.values().next()?.value;
                if (targetNode) {
                    accept('error', `Mixing a cross-reference with other types is not supported. Consider splitting property "${prop.name}" into two or more different properties.`, { node: targetNode });
                }
            }
        }
        const referenceTypes = collectReferenceTypes(prop.type);
        for (const refType of referenceTypes) {
            if (refType.isMulti && refType.isSingle) {
                const targetNode = prop.astNodes.values().next()?.value;
                if (targetNode) {
                    accept('error', `Multi references and normal references cannot be mixed. Consider splitting property "${prop.name}" into two or more different properties.`, { node: targetNode });
                }
            }
        }
    });
}
function collectReferenceTypes(type) {
    const result = new Set();
    if (isReferenceType(type)) {
        result.add(type);
    }
    else if (isArrayType(type) && type.elementType) {
        const elementTypes = collectReferenceTypes(type.elementType);
        elementTypes.forEach(e => result.add(e));
    }
    else if (isPropertyUnion(type)) {
        type.types.forEach(t => {
            const subTypes = collectReferenceTypes(t);
            subTypes.forEach(e => result.add(e));
        });
    }
    return result;
}
function validateInterfaceSuperTypes({ declared, declaredNode }, accept) {
    Array.from(declared.superTypes).forEach((superType, i) => {
        if (superType) {
            if (isUnionType(superType)) {
                accept('error', 'Interfaces cannot extend union types.', { node: declaredNode, property: 'superTypes', index: i });
            }
            if (!superType.declared) {
                accept('error', 'Extending an inferred type is discouraged.', { node: declaredNode, property: 'superTypes', index: i });
            }
        }
    });
}
function validateSuperTypesConsistency({ declared, declaredNode }, accept) {
    const nameToProp = declared.properties.reduce((acc, e) => acc.add(e.name, e), new MultiMap());
    for (const [name, props] of nameToProp.entriesGroupedByKey()) {
        if (props.length > 1) {
            for (const prop of props) {
                accept('error', `Cannot have two properties with the same name '${name}'.`, {
                    node: Array.from(prop.astNodes)[0],
                    property: 'name'
                });
            }
        }
    }
    const allSuperTypes = Array.from(declared.superTypes);
    for (let i = 0; i < allSuperTypes.length; i++) {
        for (let j = i + 1; j < allSuperTypes.length; j++) {
            const outerType = allSuperTypes[i];
            const innerType = allSuperTypes[j];
            const outerProps = isInterfaceType(outerType) ? outerType.superProperties : [];
            const innerProps = isInterfaceType(innerType) ? innerType.superProperties : [];
            const nonIdentical = getNonIdenticalProps(outerProps, innerProps);
            if (nonIdentical.length > 0) {
                accept('error', `Cannot simultaneously inherit from '${outerType}' and '${innerType}'. Their ${nonIdentical.map(e => "'" + e + "'").join(', ')} properties are not identical.`, {
                    node: declaredNode,
                    property: 'name'
                });
            }
        }
    }
    const allSuperProps = new Set();
    for (const superType of allSuperTypes) {
        const props = isInterfaceType(superType) ? superType.superProperties : [];
        for (const prop of props) {
            allSuperProps.add(prop.name);
        }
    }
    for (const ownProp of declared.properties) {
        if (allSuperProps.has(ownProp.name)) {
            const propNode = declaredNode.attributes.find(e => e.name === ownProp.name);
            if (propNode) {
                accept('error', `Cannot redeclare property '${ownProp.name}'. It is already inherited from another interface.`, {
                    node: propNode,
                    property: 'name'
                });
            }
        }
    }
}
function getNonIdenticalProps(a, b) {
    const nonIdentical = [];
    for (const outerProp of a) {
        const innerProp = b.find(e => e.name === outerProp.name);
        if (innerProp && !arePropTypesIdentical(outerProp, innerProp)) {
            nonIdentical.push(outerProp.name);
        }
    }
    return nonIdentical;
}
function arePropTypesIdentical(a, b) {
    return isTypeAssignable(a.type, b.type) && isTypeAssignable(b.type, a.type);
}
///////////////////////////////////////////////////////////////////////////////
function validateDeclaredAndInferredConsistency(typeInfo, resources, accept) {
    const { inferred, declared, declaredNode, inferredNodes } = typeInfo;
    const typeName = declared.name;
    const applyErrorToRulesAndActions = (msgPostfix) => (errorMsg) => inferredNodes.forEach(node => accept('error', `${errorMsg}${msgPostfix ? ` ${msgPostfix}` : ''}.`, (node?.inferredType) ?
        { node: node?.inferredType, property: 'name' } :
        { node, property: ast.isAction(node) ? 'type' : 'name' }));
    const applyErrorToProperties = (nodes, errorMessage) => nodes.forEach(node => accept('error', errorMessage, { node, property: ast.isAssignment(node) || ast.isAction(node) ? 'feature' : 'name' }));
    // todo add actions
    // currently we don't track which assignments belong to which actions and can't apply this error
    const applyMissingPropErrorToRules = (missingProp) => {
        inferredNodes.forEach(node => {
            if (ast.isParserRule(node)) {
                const assignments = extractAssignments(node.definition);
                if (assignments.find(e => e.feature === missingProp) === undefined) {
                    accept('error', `Property '${missingProp}' is missing in a rule '${node.name}', but is required in type '${typeName}'.`, {
                        node,
                        property: 'parameters'
                    });
                }
            }
        });
    };
    if (isUnionType(inferred) && isUnionType(declared)) {
        validateAlternativesConsistency(inferred.type, declared.type, applyErrorToRulesAndActions(`in a rule that returns type '${typeName}'`));
    }
    else if (isInterfaceType(inferred) && isInterfaceType(declared)) {
        validatePropertiesConsistency(inferred, declared, resources, applyErrorToRulesAndActions(`in a rule that returns type '${typeName}'`), applyErrorToProperties, applyMissingPropErrorToRules);
    }
    else {
        const errorMessage = `Inferred and declared versions of type '${typeName}' both have to be interfaces or unions.`;
        applyErrorToRulesAndActions()(errorMessage);
        accept('error', errorMessage, { node: declaredNode, property: 'name' });
    }
}
function validateAlternativesConsistency(inferred, declared, applyErrorToInferredTypes) {
    if (!isTypeAssignable(inferred, declared)) {
        applyErrorToInferredTypes(`Cannot assign type '${propertyTypeToString(inferred, 'DeclaredType')}' to '${propertyTypeToString(declared, 'DeclaredType')}'`);
    }
}
function isOptionalProperty(prop) {
    // mandatory properties will always be created so there are no issues if they are missing
    return prop.optional || isMandatoryPropertyType(prop.type);
}
function validatePropertiesConsistency(inferred, declared, resources, applyErrorToType, applyErrorToProperties, applyMissingPropErrorToRules) {
    const ownInferredProps = new Set(inferred.properties.map(e => e.name));
    // This field also contains properties of sub types
    const allInferredProps = new Map(inferred.allProperties.map(e => [e.name, e]));
    // This field only contains properties of itself or super types
    const declaredProps = new Map(declared.superProperties.map(e => [e.name, e]));
    // The inferred props may not have full hierarchy information so try finding
    // a corresponding declared type
    const matchingProp = (type) => {
        if (isPropertyUnion(type))
            return {
                types: type.types.map(t => matchingProp(t))
            };
        if (isReferenceType(type))
            return {
                referenceType: matchingProp(type.referenceType),
                isMulti: type.isMulti,
                isSingle: type.isSingle
            };
        if (isArrayType(type))
            return {
                elementType: type.elementType && matchingProp(type.elementType)
            };
        if (isValueType(type)) {
            const resource = resources.typeToValidationInfo.get(type.value.name);
            if (!resource)
                return type;
            return { value: 'declared' in resource ? resource.declared : resource.inferred };
        }
        return type;
    };
    // detects extra properties & validates matched ones on consistency by the 'optional' property
    for (const [name, foundProp] of allInferredProps.entries()) {
        const expectedProp = declaredProps.get(name);
        if (expectedProp) {
            const foundTypeAsStr = propertyTypeToString(foundProp.type, 'DeclaredType');
            const expectedTypeAsStr = propertyTypeToString(expectedProp.type, 'DeclaredType');
            const typeAlternativesErrors = isTypeAssignable(matchingProp(foundProp.type), expectedProp.type);
            if (!typeAlternativesErrors && expectedTypeAsStr !== 'unknown') {
                const errorMsgPrefix = `The assigned type '${foundTypeAsStr}' is not compatible with the declared property '${name}' of type '${expectedTypeAsStr}'.`;
                applyErrorToProperties(foundProp.astNodes, errorMsgPrefix);
            }
            if (foundProp.optional && !isOptionalProperty(expectedProp)) {
                applyMissingPropErrorToRules(name);
            }
        }
        else if (ownInferredProps.has(name)) {
            // Only apply the superfluous property error on properties which are actually declared on the current type
            applyErrorToProperties(foundProp.astNodes, `A property '${name}' is not expected.`);
        }
    }
    // Detect any missing properties
    const missingProps = new Set();
    for (const [name, expectedProperties] of declaredProps.entries()) {
        const foundProperty = allInferredProps.get(name);
        if (!foundProperty && !isOptionalProperty(expectedProperties) && expectedProperties.defaultValue === undefined) {
            missingProps.add(name);
        }
    }
    if (missingProps.size > 0) {
        const prefix = missingProps.size > 1 ? 'Properties' : 'A property';
        const postfix = missingProps.size > 1 ? 'are expected' : 'is expected';
        const props = Array.from(missingProps).map(e => `'${e}'`).sort().join(', ');
        applyErrorToType(`${prefix} ${props} ${postfix}.`);
    }
}
//# sourceMappingURL=types-validator.js.map