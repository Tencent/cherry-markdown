/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isInfixRule } from '../languages/generated/ast.js';
import { defaultParserErrorProvider, EmbeddedActionsParser, LLkLookaheadStrategy } from 'chevrotain';
import { LLStarLookaheadStrategy } from 'chevrotain-allstar';
import { isAssignment, isCrossReference, isKeyword, isParserRule } from '../languages/generated/ast.js';
import { getTypeName, isDataTypeRule } from '../utils/grammar-utils.js';
import { assignMandatoryProperties, getContainerOfType, linkContentToContainer } from '../utils/ast-utils.js';
import { CstNodeBuilder } from './cst-node-builder.js';
export const DatatypeSymbol = Symbol('Datatype');
function isDataTypeNode(node) {
    return node.$type === DatatypeSymbol;
}
const ruleSuffix = '\u200B';
const withRuleSuffix = (name) => name.endsWith(ruleSuffix) ? name : name + ruleSuffix;
export class AbstractLangiumParser {
    constructor(services) {
        this._unorderedGroups = new Map();
        this.allRules = new Map();
        this.lexer = services.parser.Lexer;
        const tokens = this.lexer.definition;
        const production = services.LanguageMetaData.mode === 'production';
        if (services.shared.profilers.LangiumProfiler?.isActive('parsing')) {
            this.wrapper = new ProfilerWrapper(tokens, {
                ...services.parser.ParserConfig,
                skipValidations: production,
                errorMessageProvider: services.parser.ParserErrorMessageProvider
            }, services.shared.profilers.LangiumProfiler.createTask('parsing', services.LanguageMetaData.languageId));
        }
        else {
            this.wrapper = new ChevrotainWrapper(tokens, {
                ...services.parser.ParserConfig,
                skipValidations: production,
                errorMessageProvider: services.parser.ParserErrorMessageProvider
            });
        }
    }
    alternatives(idx, choices) {
        this.wrapper.wrapOr(idx, choices);
    }
    optional(idx, callback) {
        this.wrapper.wrapOption(idx, callback);
    }
    many(idx, callback) {
        this.wrapper.wrapMany(idx, callback);
    }
    atLeastOne(idx, callback) {
        this.wrapper.wrapAtLeastOne(idx, callback);
    }
    getRule(name) {
        return this.allRules.get(name);
    }
    isRecording() {
        return this.wrapper.IS_RECORDING;
    }
    get unorderedGroups() {
        return this._unorderedGroups;
    }
    getRuleStack() {
        return this.wrapper.RULE_STACK;
    }
    finalize() {
        this.wrapper.wrapSelfAnalysis();
    }
}
export class LangiumParser extends AbstractLangiumParser {
    get current() {
        return this.stack[this.stack.length - 1];
    }
    constructor(services) {
        super(services);
        this.nodeBuilder = new CstNodeBuilder();
        this.stack = [];
        this.assignmentMap = new Map();
        this.operatorPrecedence = new Map();
        this.linker = services.references.Linker;
        this.converter = services.parser.ValueConverter;
        this.astReflection = services.shared.AstReflection;
    }
    rule(rule, impl) {
        const type = this.computeRuleType(rule);
        let infixName = undefined;
        if (isInfixRule(rule)) {
            infixName = rule.name;
            this.registerPrecedenceMap(rule);
        }
        const ruleMethod = this.wrapper.DEFINE_RULE(withRuleSuffix(rule.name), this.startImplementation(type, infixName, impl).bind(this));
        this.allRules.set(rule.name, ruleMethod);
        if (isParserRule(rule) && rule.entry) {
            this.mainRule = ruleMethod;
        }
        return ruleMethod;
    }
    registerPrecedenceMap(rule) {
        const name = rule.name;
        const map = new Map();
        for (let i = 0; i < rule.operators.precedences.length; i++) {
            const precedence = rule.operators.precedences[i];
            for (const keyword of precedence.operators) {
                map.set(keyword.value, {
                    precedence: i,
                    rightAssoc: precedence.associativity === 'right'
                });
            }
        }
        this.operatorPrecedence.set(name, map);
    }
    computeRuleType(rule) {
        if (isInfixRule(rule)) {
            return getTypeName(rule);
        }
        else if (rule.fragment) {
            return undefined;
        }
        else if (isDataTypeRule(rule)) {
            return DatatypeSymbol;
        }
        else {
            return getTypeName(rule);
        }
    }
    parse(input, options = {}) {
        this.nodeBuilder.buildRootNode(input);
        const lexerResult = this.lexerResult = this.lexer.tokenize(input);
        this.wrapper.input = lexerResult.tokens;
        const ruleMethod = options.rule ? this.allRules.get(options.rule) : this.mainRule;
        if (!ruleMethod) {
            throw new Error(options.rule ? `No rule found with name '${options.rule}'` : 'No main rule available.');
        }
        const result = this.doParse(ruleMethod);
        this.nodeBuilder.addHiddenNodes(lexerResult.hidden);
        this.unorderedGroups.clear();
        this.lexerResult = undefined;
        linkContentToContainer(result, { deep: true });
        return {
            value: result,
            lexerErrors: lexerResult.errors,
            lexerReport: lexerResult.report,
            parserErrors: this.wrapper.errors
        };
    }
    doParse(rule) {
        let result = this.wrapper.rule(rule);
        if (this.stack.length > 0) {
            // In case the parser throws on the entry rule, `construct` is not called
            // We need to call it manually here
            result = this.construct();
        }
        // Perform some sanity checking
        if (result === undefined) {
            throw new Error('No result from parser');
        }
        else if (this.stack.length > 0) {
            throw new Error('Parser stack is not empty after parsing');
        }
        return result;
    }
    startImplementation($type, infixName, implementation) {
        return (args) => {
            // Only create a new AST node in case the calling rule is not a fragment rule
            const createNode = !this.isRecording() && $type !== undefined;
            if (createNode) {
                const node = { $type };
                this.stack.push(node);
                if ($type === DatatypeSymbol) {
                    node.value = '';
                }
                else if (infixName !== undefined) {
                    node.$infixName = infixName;
                }
            }
            // Execute the actual rule implementation
            // The `implementation` never returns anything and only manipulates the parser state.
            implementation(args);
            // Once the rule implementation is done, we need to construct the AST node
            // If the implementation throws (likely a recognition error), we relay the construction to the `subrule` method
            return createNode ? this.construct() : undefined;
        };
    }
    extractHiddenTokens(token) {
        const hiddenTokens = this.lexerResult.hidden;
        if (!hiddenTokens.length) {
            return [];
        }
        const offset = token.startOffset;
        for (let i = 0; i < hiddenTokens.length; i++) {
            const token = hiddenTokens[i];
            if (token.startOffset > offset) {
                return hiddenTokens.splice(0, i);
            }
        }
        return hiddenTokens.splice(0, hiddenTokens.length);
    }
    consume(idx, tokenType, feature) {
        const token = this.wrapper.wrapConsume(idx, tokenType);
        if (!this.isRecording() && this.isValidToken(token)) {
            // Before inserting the current token into the CST, we want add the hidden tokens (i.e. comments)
            // These are located directly before the current token, but are not part of the token stream.
            // Adding the hidden tokens to the CST requires searching through the CST and finding the correct position.
            // Performing this work here is more efficient than doing it later on.
            const hiddenTokens = this.extractHiddenTokens(token);
            this.nodeBuilder.addHiddenNodes(hiddenTokens);
            const leafNode = this.nodeBuilder.buildLeafNode(token, feature);
            const { assignment, crossRef } = this.getAssignment(feature);
            const current = this.current;
            if (assignment) {
                const convertedValue = isKeyword(feature) ? token.image : this.converter.convert(token.image, leafNode);
                this.assign(assignment.operator, assignment.feature, convertedValue, leafNode, crossRef);
            }
            else if (isDataTypeNode(current)) {
                let text = token.image;
                if (!isKeyword(feature)) {
                    text = this.converter.convert(text, leafNode).toString();
                }
                current.value += text;
            }
        }
    }
    /**
     * Most consumed parser tokens are valid. However there are two cases in which they are not valid:
     *
     * 1. They were inserted during error recovery by the parser. These tokens don't really exist and should not be further processed
     * 2. They contain invalid token ranges. This might include the special EOF token, or other tokens produced by invalid token builders.
     */
    isValidToken(token) {
        return !token.isInsertedInRecovery && !isNaN(token.startOffset) && typeof token.endOffset === 'number' && !isNaN(token.endOffset);
    }
    subrule(idx, rule, fragment, feature, args) {
        let cstNode;
        if (!this.isRecording() && !fragment) {
            // We only want to create a new CST node if the subrule actually creates a new AST node.
            // In other cases like calls of fragment rules the current CST/AST is populated further.
            // Note that skipping this initialization and leaving cstNode unassigned also skips the subrule assignment later on.
            // This is intended, as fragment rules only enrich the current AST node
            cstNode = this.nodeBuilder.buildCompositeNode(feature);
        }
        let result;
        try {
            result = this.wrapper.wrapSubrule(idx, rule, args);
        }
        finally {
            if (!this.isRecording()) {
                // Calling `subrule` on chevrotain parsers can result in a recognition error
                // This likely means that we encounter a syntax error in the input.
                // In this case, the result of the subrule is `undefined` and we need to call `construct` manually.
                if (result === undefined && !fragment) {
                    result = this.construct();
                }
                // We want to perform the subrule assignment regardless of the recognition error
                // But only if the subrule call actually consumed any tokens
                if (result !== undefined && cstNode && cstNode.length > 0) {
                    this.performSubruleAssignment(result, feature, cstNode);
                }
            }
            // We don't have a catch block in here because we want to propagate the recognition error to the caller
            // This results in much better error recovery and error messages from chevrotain
        }
    }
    performSubruleAssignment(result, feature, cstNode) {
        const { assignment, crossRef } = this.getAssignment(feature);
        if (assignment) {
            this.assign(assignment.operator, assignment.feature, result, cstNode, crossRef);
        }
        else if (!assignment) {
            // If we call a subrule without an assignment we either:
            // 1. append the result of the subrule (data type rule)
            // 2. override the current object with the newly parsed object
            // If the current element is an AST node and the result of the subrule
            // is a data type rule, we can safely discard the results.
            const current = this.current;
            if (isDataTypeNode(current)) {
                current.value += result.toString();
            }
            else if (typeof result === 'object' && result) {
                const object = this.assignWithoutOverride(result, current);
                const newItem = object;
                this.stack.pop();
                this.stack.push(newItem);
            }
        }
    }
    action($type, action) {
        if (!this.isRecording()) {
            let last = this.current;
            if (action.feature && action.operator) {
                last = this.construct();
                this.nodeBuilder.removeNode(last.$cstNode);
                const node = this.nodeBuilder.buildCompositeNode(action);
                node.content.push(last.$cstNode);
                const newItem = { $type };
                this.stack.push(newItem);
                this.assign(action.operator, action.feature, last, last.$cstNode);
            }
            else {
                last.$type = $type;
            }
        }
    }
    construct() {
        if (this.isRecording()) {
            return undefined;
        }
        const obj = this.stack.pop();
        this.nodeBuilder.construct(obj);
        if ('$infixName' in obj) {
            return this.constructInfix(obj, this.operatorPrecedence.get(obj.$infixName));
        }
        else if (isDataTypeNode(obj)) {
            return this.converter.convert(obj.value, obj.$cstNode);
        }
        else {
            assignMandatoryProperties(this.astReflection, obj);
        }
        return obj;
    }
    constructInfix(obj, precedence) {
        const parts = obj.parts;
        if (!Array.isArray(parts) || parts.length === 0) {
            // Likely the result of a syntax error, simply return undefined
            return undefined;
        }
        const operators = obj.operators;
        if (!Array.isArray(operators) || parts.length < 2) {
            // Captured just a single, non-binary expression
            // Simply return the expression as is.
            return parts[0];
        }
        // Find the operator with the lowest precedence (highest value in precedence map)
        let lowestPrecedenceIdx = 0;
        let lowestPrecedenceValue = -1;
        for (let i = 0; i < operators.length; i++) {
            const operator = operators[i];
            const opPrecedence = precedence.get(operator) ?? {
                precedence: Infinity,
                rightAssoc: false
            };
            // For equal precedence, use associativity to determine which operator to pick
            if (opPrecedence.precedence > lowestPrecedenceValue) {
                // Always pick operators with lower precedence (higher precedence value)
                lowestPrecedenceValue = opPrecedence.precedence;
                lowestPrecedenceIdx = i;
            }
            else if (opPrecedence.precedence === lowestPrecedenceValue) {
                // Check associativity when precedence is equal
                if (!opPrecedence.rightAssoc) {
                    // For left associative operators (default), pick the leftmost one
                    // This means choosing the rightmost equal-precedence operator when working backwards
                    lowestPrecedenceIdx = i;
                }
                // For right associative operators with equal precedence,
                // we keep the previous (rightmost) index
            }
        }
        // Split the expression at the lowest precedence operator
        const leftOperators = operators.slice(0, lowestPrecedenceIdx);
        const rightOperators = operators.slice(lowestPrecedenceIdx + 1);
        const leftParts = parts.slice(0, lowestPrecedenceIdx + 1);
        const rightParts = parts.slice(lowestPrecedenceIdx + 1);
        // Create sub-expressions
        const leftInfix = {
            $infixName: obj.$infixName,
            $type: obj.$type,
            $cstNode: obj.$cstNode,
            parts: leftParts,
            operators: leftOperators
        };
        const rightInfix = {
            $infixName: obj.$infixName,
            $type: obj.$type,
            $cstNode: obj.$cstNode,
            parts: rightParts,
            operators: rightOperators
        };
        // Recursively build the left and right subtrees
        const leftTree = this.constructInfix(leftInfix, precedence);
        const rightTree = this.constructInfix(rightInfix, precedence);
        // Create the final binary expression
        return {
            $type: obj.$type,
            $cstNode: obj.$cstNode,
            left: leftTree,
            operator: operators[lowestPrecedenceIdx],
            right: rightTree
        };
    }
    getAssignment(feature) {
        if (!this.assignmentMap.has(feature)) {
            const assignment = getContainerOfType(feature, isAssignment);
            this.assignmentMap.set(feature, {
                assignment: assignment,
                crossRef: assignment && isCrossReference(assignment.terminal) ? (assignment.terminal.isMulti ? 'multi' : 'single') : undefined
            });
        }
        return this.assignmentMap.get(feature);
    }
    assign(operator, feature, value, cstNode, crossRef) {
        const obj = this.current;
        let item;
        if (crossRef === 'single' && typeof value === 'string') {
            item = this.linker.buildReference(obj, feature, cstNode, value);
        }
        else if (crossRef === 'multi' && typeof value === 'string') {
            item = this.linker.buildMultiReference(obj, feature, cstNode, value);
        }
        else {
            item = value;
        }
        switch (operator) {
            case '=': {
                obj[feature] = item;
                break;
            }
            case '?=': {
                obj[feature] = true;
                break;
            }
            case '+=': {
                if (!Array.isArray(obj[feature])) {
                    obj[feature] = [];
                }
                obj[feature].push(item);
            }
        }
    }
    assignWithoutOverride(target, source) {
        for (const [name, existingValue] of Object.entries(source)) {
            const newValue = target[name];
            if (newValue === undefined) {
                target[name] = existingValue;
            }
            else if (Array.isArray(newValue) && Array.isArray(existingValue)) {
                existingValue.push(...newValue);
                target[name] = existingValue;
            }
        }
        // The target was parsed from a unassigned subrule
        // After the subrule construction, it received a cst node
        // This CST node will later be overriden by the cst node builder
        // To prevent references to stale AST nodes in the CST,
        // we need to remove the reference here
        const targetCstNode = target.$cstNode;
        if (targetCstNode) {
            targetCstNode.astNode = undefined;
            target.$cstNode = undefined;
        }
        return target;
    }
    get definitionErrors() {
        return this.wrapper.definitionErrors;
    }
}
export class AbstractParserErrorMessageProvider {
    buildMismatchTokenMessage(options) {
        return defaultParserErrorProvider.buildMismatchTokenMessage(options);
    }
    buildNotAllInputParsedMessage(options) {
        return defaultParserErrorProvider.buildNotAllInputParsedMessage(options);
    }
    buildNoViableAltMessage(options) {
        return defaultParserErrorProvider.buildNoViableAltMessage(options);
    }
    buildEarlyExitMessage(options) {
        return defaultParserErrorProvider.buildEarlyExitMessage(options);
    }
}
export class LangiumParserErrorMessageProvider extends AbstractParserErrorMessageProvider {
    buildMismatchTokenMessage({ expected, actual }) {
        const expectedMsg = expected.LABEL
            ? '`' + expected.LABEL + '`'
            : expected.name.endsWith(':KW')
                ? `keyword '${expected.name.substring(0, expected.name.length - 3)}'`
                : `token of type '${expected.name}'`;
        return `Expecting ${expectedMsg} but found \`${actual.image}\`.`;
    }
    buildNotAllInputParsedMessage({ firstRedundant }) {
        return `Expecting end of file but found \`${firstRedundant.image}\`.`;
    }
}
export class LangiumCompletionParser extends AbstractLangiumParser {
    constructor() {
        super(...arguments);
        this.tokens = [];
        this.elementStack = [];
        this.lastElementStack = [];
        this.nextTokenIndex = 0;
        this.stackSize = 0;
    }
    action() {
        // NOOP
    }
    construct() {
        // NOOP
        return undefined;
    }
    parse(input) {
        this.resetState();
        const tokens = this.lexer.tokenize(input, { mode: 'partial' });
        this.tokens = tokens.tokens;
        this.wrapper.input = [...this.tokens];
        this.mainRule.call(this.wrapper, {});
        this.unorderedGroups.clear();
        return {
            tokens: this.tokens,
            elementStack: [...this.lastElementStack],
            tokenIndex: this.nextTokenIndex
        };
    }
    rule(rule, impl) {
        const ruleMethod = this.wrapper.DEFINE_RULE(withRuleSuffix(rule.name), this.startImplementation(impl).bind(this));
        this.allRules.set(rule.name, ruleMethod);
        if (rule.entry) {
            this.mainRule = ruleMethod;
        }
        return ruleMethod;
    }
    resetState() {
        this.elementStack = [];
        this.lastElementStack = [];
        this.nextTokenIndex = 0;
        this.stackSize = 0;
    }
    startImplementation(implementation) {
        return (args) => {
            const size = this.keepStackSize();
            try {
                implementation(args);
            }
            finally {
                this.resetStackSize(size);
            }
        };
    }
    removeUnexpectedElements() {
        this.elementStack.splice(this.stackSize);
    }
    keepStackSize() {
        const size = this.elementStack.length;
        this.stackSize = size;
        return size;
    }
    resetStackSize(size) {
        this.removeUnexpectedElements();
        this.stackSize = size;
    }
    consume(idx, tokenType, feature) {
        this.wrapper.wrapConsume(idx, tokenType);
        if (!this.isRecording()) {
            this.lastElementStack = [...this.elementStack, feature];
            this.nextTokenIndex = this.currIdx + 1;
        }
    }
    subrule(idx, rule, fragment, feature, args) {
        this.before(feature);
        this.wrapper.wrapSubrule(idx, rule, args);
        this.after(feature);
    }
    before(element) {
        if (!this.isRecording()) {
            this.elementStack.push(element);
        }
    }
    after(element) {
        if (!this.isRecording()) {
            const index = this.elementStack.lastIndexOf(element);
            if (index >= 0) {
                this.elementStack.splice(index);
            }
        }
    }
    get currIdx() {
        return this.wrapper.currIdx;
    }
}
const defaultConfig = {
    recoveryEnabled: true,
    nodeLocationTracking: 'full',
    skipValidations: true,
    errorMessageProvider: new LangiumParserErrorMessageProvider()
};
/**
 * This class wraps the embedded actions parser of chevrotain and exposes protected methods.
 * This way, we can build the `LangiumParser` as a composition.
 */
class ChevrotainWrapper extends EmbeddedActionsParser {
    constructor(tokens, config) {
        const useDefaultLookahead = config && 'maxLookahead' in config;
        super(tokens, {
            ...defaultConfig,
            lookaheadStrategy: useDefaultLookahead
                ? new LLkLookaheadStrategy({ maxLookahead: config.maxLookahead })
                : new LLStarLookaheadStrategy({
                    // If validations are skipped, don't log the lookahead warnings
                    logging: config.skipValidations ? () => { } : undefined
                }),
            ...config,
        });
    }
    get IS_RECORDING() {
        return this.RECORDING_PHASE;
    }
    DEFINE_RULE(name, impl, config) {
        return this.RULE(name, impl, config);
    }
    wrapSelfAnalysis() {
        this.performSelfAnalysis();
    }
    wrapConsume(idx, tokenType) {
        return this.consume(idx, tokenType, undefined);
    }
    wrapSubrule(idx, rule, args) {
        return this.subrule(idx, rule, {
            ARGS: [args]
        });
    }
    wrapOr(idx, choices) {
        this.or(idx, choices);
    }
    wrapOption(idx, callback) {
        this.option(idx, callback);
    }
    wrapMany(idx, callback) {
        this.many(idx, callback);
    }
    wrapAtLeastOne(idx, callback) {
        this.atLeastOne(idx, callback);
    }
    rule(rule) {
        return rule.call(this, {});
    }
}
class ProfilerWrapper extends ChevrotainWrapper {
    constructor(tokens, config, task) {
        super(tokens, config);
        this.task = task;
    }
    rule(rule) {
        this.task.start();
        this.task.startSubTask(this.ruleName(rule));
        try {
            return super.rule(rule);
        }
        finally {
            this.task.stopSubTask(this.ruleName(rule));
            this.task.stop();
        }
    }
    ruleName(rule) {
        return rule.ruleName;
    }
    subrule(idx, ruleToCall, options) {
        this.task.startSubTask(this.ruleName(ruleToCall));
        try {
            return super.subrule(idx, ruleToCall, options);
        }
        finally {
            this.task.stopSubTask(this.ruleName(ruleToCall));
        }
    }
}
//# sourceMappingURL=langium-parser.js.map