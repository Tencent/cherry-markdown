/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import * as ast from '../../languages/generated/ast.js';
import { getCrossReferenceTerminal, getExplicitRuleType, getTypeName, isArrayCardinality, isOptionalCardinality, terminalRegex } from '../../utils/grammar-utils.js';
import { getContainerOfType } from '../../utils/ast-utils.js';
/**
 * Calculates any features that can follow the given feature stack.
 * This also includes features following optional features and features from previously called rules that could follow the last feature.
 * @param featureStack A stack of features starting at the entry rule and ending at the feature of the current cursor position.
 * @param unparsedTokens All tokens which haven't been parsed successfully yet. This is the case when we call this function inside an alternative or before parsing any tokens.
 * @returns Any `AbstractElement` that could be following the given feature stack.
 */
export function findNextFeatures(featureStack, unparsedTokens) {
    const context = {
        stacks: featureStack,
        tokens: unparsedTokens
    };
    interpretTokens(context);
    // Reset the container property
    context.stacks.flat().forEach(feature => { feature.property = undefined; });
    const nextStacks = findNextFeatureStacks(context.stacks);
    // We only need the last element of each stack
    return nextStacks.map(e => e[e.length - 1]);
}
function findNextFeaturesInternal(stack) {
    const features = [];
    if (stack.length === 0) {
        return features;
    }
    const top = stack[stack.length - 1];
    const { group, child } = findGroupAndChild(top.feature);
    if (isArrayCardinality(child.cardinality)) {
        // The feature can appear again, so we try to find its first features again
        const repeatingFeatures = findFirstFeaturesInternal({
            feature: child,
            type: top.type,
            property: top.property
        });
        features.push(...repeatingFeatures);
    }
    let groupIndex = -1;
    if (group) {
        groupIndex = group.elements.indexOf(child);
    }
    const parentStack = stack.slice(0, -1);
    if (!group) {
        const parent = getAbstractElementParent(child);
        if (parent) {
            // The feature is not part of a group
            // But the parent might be
            features.push(...findNextFeaturesInternal([
                ...parentStack,
                {
                    feature: parent,
                }
            ]));
        }
        else {
            // The feature is "standalone", meaning it is the top-level feature of a rule
            // The next elements are defined by the previous stack elements
            features.push(...findNextFeaturesInternal(parentStack));
        }
    }
    else {
        // The feature is somewhere within the group
        const nextIndex = groupIndex + 1;
        const { stacks, end } = findNextFeaturesInGroup({
            feature: group,
            type: top.type
        }, nextIndex);
        for (const newStack of stacks) {
            features.push([...parentStack, ...newStack]);
        }
        // If we reached the end of the group, continue searching for following features
        if (end) {
            // Set groupIndex to the last element index to indicate that we are at the end of the group
            // This will trigger the parent search below
            groupIndex = group.elements.length - 1;
        }
    }
    if (group && groupIndex === group.elements.length - 1) {
        // The feature is the last element of a group
        // The next elements are defined by the parent group
        features.push(...findNextFeaturesInternal([
            ...parentStack,
            {
                feature: group,
            }
        ]));
    }
    return features;
}
/**
 * Calculates the first child feature of any `AbstractElement`.
 * @param next The `AbstractElement` whose first child features should be calculated.
 */
export function findFirstFeatures(next) {
    return findFirstFeaturesInternal({ feature: next });
}
function findFirstFeaturesInternal(next) {
    const { feature, type } = next;
    if (ast.isGroup(feature)) {
        return findNextFeaturesInGroup(next, 0).stacks;
    }
    else if (ast.isAlternatives(feature) || ast.isUnorderedGroup(feature)) {
        return feature.elements.flatMap(e => findFirstFeaturesInternal({
            feature: e,
            type,
            property: next.property
        }));
    }
    else if (ast.isAssignment(feature)) {
        return findFirstFeaturesInternal({
            feature: feature.terminal,
            type,
            property: next.property ?? feature.feature
        });
    }
    else if (ast.isAction(feature)) {
        return findNextFeaturesInternal([{
                feature,
                type: getTypeName(feature),
                property: next.property ?? feature.feature
            }]);
    }
    else if (ast.isRuleCall(feature) && ast.isParserRule(feature.rule.ref)) {
        const rule = feature.rule.ref;
        const stacks = findFirstFeaturesInternal({
            feature: rule.definition,
            type: rule.fragment || rule.dataType ? undefined : (getExplicitRuleType(rule) ?? rule.name),
            property: next.property
        });
        for (const stack of stacks) {
            stack.unshift(next);
        }
        return stacks;
    }
    else if (ast.isRuleCall(feature) && ast.isInfixRule(feature.rule.ref)) {
        const rule = feature.rule.ref;
        const call = rule.call.rule.ref;
        if (!ast.isParserRule(call)) {
            console.error('Failed to resolve reference to ' + rule.call.rule.$refText);
            return [];
        }
        const stacks = findFirstFeaturesInternal({
            feature: call.definition,
            type: getExplicitRuleType(call) ?? call.name,
            property: 'parts'
        });
        for (const stack of stacks) {
            stack.unshift(next);
        }
        return stacks;
    }
    else {
        return [[next]];
    }
}
function findNextFeaturesInGroup(next, index) {
    const features = [];
    let firstFeature;
    while (index < next.feature.elements.length) {
        const feature = next.feature.elements[index];
        firstFeature = {
            feature,
            type: next.type
        };
        const stacks = findFirstFeaturesInternal(firstFeature);
        features.push(...stacks);
        if (isElementOptional(feature, new Map())) {
            // Continue with the next element
            index++;
        }
        else {
            break;
        }
    }
    return {
        stacks: features,
        end: index >= next.feature.elements.length
    };
}
/**
 * Determines recursively whether an element is optional. It is not sufficient to check only the cardinality of the element itself,
 * because it could a group or alternative that contains only optional elements.
 */
function isElementOptional(feature, visited) {
    const visitedResult = visited.get(feature);
    if (visitedResult !== undefined) {
        return visitedResult;
    }
    visited.set(feature, false);
    if (isOptionalCardinality(feature.cardinality, feature)) {
        visited.set(feature, true);
        return true;
    }
    if (ast.isGroup(feature)) {
        for (const element of feature.elements) {
            if (!isElementOptional(element, visited)) {
                visited.set(feature, false);
                return false;
            }
        }
        visited.set(feature, true);
        return true;
    }
    else if (ast.isAlternatives(feature) || ast.isUnorderedGroup(feature)) {
        for (const element of feature.elements) {
            if (isElementOptional(element, visited)) {
                visited.set(feature, true);
                return true;
            }
        }
        visited.set(feature, false);
        return false;
    }
    else if (ast.isRuleCall(feature) && ast.isParserRule(feature.rule.ref)) {
        const rule = feature.rule.ref;
        const result = isElementOptional(rule.definition, visited);
        visited.set(feature, result);
        return result;
    }
    return false;
}
function interpretTokens(context) {
    for (const token of context.tokens) {
        const nextFeatureStacks = findNextFeatureStacks(context.stacks, token);
        context.stacks = nextFeatureStacks;
    }
}
function findNextFeatureStacks(stacks, token) {
    const newStacks = [];
    for (const stack of stacks) {
        newStacks.push(...interpretStackToken(stack, token));
    }
    return newStacks;
}
function interpretStackToken(stack, token) {
    const allNextFeatures = findNextFeaturesInternal(stack);
    const matchingNextFeatures = allNextFeatures.filter(next => token ? featureMatches(next[next.length - 1].feature, token) : true);
    return matchingNextFeatures;
}
export function findGroupAndChild(feature) {
    let parent;
    let item = feature;
    while (item.$container) {
        if (ast.isGroup(item.$container)) {
            parent = item.$container;
            break;
        }
        else if (ast.isAbstractElement(item.$container)) {
            item = item.$container;
        }
        else {
            break;
        }
    }
    if (parent) {
        return { group: parent, child: item };
    }
    return {
        group: undefined,
        // Even if there is no group, return the feature parent if it is an assignment
        // We need this later to handle the cardinality of the feature correctly
        child: getContainerOfType(feature, ast.isAssignment) ?? feature
    };
}
function getAbstractElementParent(element) {
    const parent = element.$container;
    const assignment = getContainerOfType(parent, ast.isAssignment);
    if (assignment) {
        return getAbstractElementParent(assignment);
    }
    else {
        if (parent && ast.isAbstractElement(parent)) {
            return parent;
        }
    }
    return undefined;
}
function featureMatches(feature, token) {
    if (ast.isKeyword(feature)) {
        const content = feature.value;
        return content === token.tokenType.name;
    }
    else if (ast.isRuleCall(feature)) {
        return ruleMatches(feature.rule.ref, token);
    }
    else if (ast.isCrossReference(feature)) {
        const crossRefTerminal = getCrossReferenceTerminal(feature);
        if (crossRefTerminal) {
            return featureMatches(crossRefTerminal, token);
        }
    }
    return false;
}
function ruleMatches(rule, token) {
    if (ast.isParserRule(rule)) {
        const ruleFeatures = findFirstFeatures(rule.definition);
        return ruleFeatures.some(e => featureMatches(e[e.length - 1].feature, token));
    }
    else if (ast.isTerminalRule(rule)) {
        return terminalRegex(rule).test(token.image);
    }
    else {
        return false;
    }
}
//# sourceMappingURL=follow-element-computation.js.map