/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import { isInfixRule } from '../languages/generated/ast.js';
import type { AbstractElement, Action, Assignment, InfixRule, ParserRule } from '../languages/generated/ast.js';
import type { DSLMethodOpts, ILexingError, IOrAlt, IParserErrorMessageProvider, IRecognitionException, IToken, ParserMethod, SubruleMethodOpts, TokenType, TokenVocabulary, IRuleConfig } from 'chevrotain';
import type { Linker } from '../references/linker.js';
import type { LangiumCoreServices } from '../services.js';
import type { AstNode, AstReflection, CompositeCstNode, CstNode } from '../syntax-tree.js';
import type { Lexer, LexerResult } from './lexer.js';
import type { IParserConfig } from './parser-config.js';
import type { ValueConverter } from './value-converter.js';
import { defaultParserErrorProvider, EmbeddedActionsParser, LLkLookaheadStrategy } from 'chevrotain';
import { LLStarLookaheadStrategy } from 'chevrotain-allstar';
import { isAssignment, isCrossReference, isKeyword, isParserRule } from '../languages/generated/ast.js';
import { getTypeName, isDataTypeRule } from '../utils/grammar-utils.js';
import { assignMandatoryProperties, getContainerOfType, linkContentToContainer } from '../utils/ast-utils.js';
import { CstNodeBuilder } from './cst-node-builder.js';
import type { LexingReport } from './token-builder.js';
import type { ProfilingTask } from '../workspace/profiler.js';

export type ParseResult<T = AstNode> = {
    value: T,
    parserErrors: IRecognitionException[],
    lexerErrors: ILexingError[],
    lexerReport?: LexingReport
}

export const DatatypeSymbol = Symbol('Datatype');

interface DataTypeNode {
    $cstNode: CompositeCstNode
    /** Instead of a string, this node is uniquely identified by the `Datatype` symbol */
    $type: symbol
    /** Used as a storage for all parsed terminals, keywords and sub-datatype rules */
    value: string
}

interface InfixElement {
    $infixName: string;
    $type: string;
    $cstNode: CompositeCstNode;
    parts?: AstNode[];
    operators?: string[];
}

function isDataTypeNode(node: { $type: string | symbol | undefined }): node is DataTypeNode {
    return node.$type === DatatypeSymbol;
}

type RuleResult = (args: Args) => any;

type Args = Record<string, boolean>;

type RuleImpl = (args: Args) => any;

interface AssignmentElement {
    assignment?: Assignment
    crossRef?: 'single' | 'multi'
}

/**
 * Base interface for all parsers. Mainly used by the `parser-builder-base.ts` to perform work on different kinds of parsers.
 * The main use cases are:
 * * AST parser: Based on a string, create an AST for the current grammar
 * * Completion parser: Based on a partial string, identify the current position of the input within the grammar
 */
export interface BaseParser {
    /**
     * Adds a new parser rule to the parser
     */
    rule(rule: ParserRule | InfixRule, impl: RuleImpl): RuleResult;
    /**
     * Returns the executable rule function for the specified rule name
     */
    getRule(name: string): RuleResult | undefined;
    /**
     * Performs alternatives parsing (the `|` operation in EBNF/Langium)
     */
    alternatives(idx: number, choices: Array<IOrAlt<any>>): void;
    /**
     * Parses the callback as optional (the `?` operation in EBNF/Langium)
     */
    optional(idx: number, callback: DSLMethodOpts<unknown>): void;
    /**
     * Parses the callback 0 or more times (the `*` operation in EBNF/Langium)
     */
    many(idx: number, callback: DSLMethodOpts<unknown>): void;
    /**
     * Parses the callback 1 or more times (the `+` operation in EBNF/Langium)
     */
    atLeastOne(idx: number, callback: DSLMethodOpts<unknown>): void;
    /**
     * Consumes a specific token type from the token input stream.
     * Requires a unique index within the rule for a specific token type.
     */
    consume(idx: number, tokenType: TokenType, feature: AbstractElement): void;
    /**
     * Invokes the executable function for a given parser rule.
     * Requires a unique index within the rule for a specific sub rule.
     * Arguments can be supplied to the rule invocation for semantic predicates
     */
    subrule(idx: number, rule: RuleResult, fragment: boolean, feature: AbstractElement, args: Args): void;
    /**
     * Executes a grammar action that modifies the currently active AST node
     */
    action($type: string, action: Action): void;
    /**
     * Whether the parser is currently actually in use or in "recording mode".
     * Recording mode is activated once when the parser is analyzing itself.
     * During this phase, no input exists and therefore no AST should be constructed
     */
    isRecording(): boolean;
    /**
     * Current state of the unordered groups
     */
    get unorderedGroups(): Map<string, boolean[]>;
    /**
     * The rule stack indicates the indices of rules that are currently invoked,
     * in order of their invocation.
     */
    getRuleStack(): number[];
}

const ruleSuffix = '\u200B';
const withRuleSuffix = (name: string): string => name.endsWith(ruleSuffix) ? name : name + ruleSuffix;

export abstract class AbstractLangiumParser implements BaseParser {

    protected readonly lexer: Lexer;
    protected readonly wrapper: ChevrotainWrapper;
    protected _unorderedGroups: Map<string, boolean[]> = new Map<string, boolean[]>();

    protected allRules = new Map<string, RuleResult>();
    protected mainRule!: RuleResult;

    constructor(services: LangiumCoreServices) {
        this.lexer = services.parser.Lexer;
        const tokens = this.lexer.definition;
        const production = services.LanguageMetaData.mode === 'production';
        if (services.shared.profilers.LangiumProfiler?.isActive('parsing')) {
            this.wrapper = new ProfilerWrapper(tokens, {
                ...services.parser.ParserConfig,
                skipValidations: production,
                errorMessageProvider: services.parser.ParserErrorMessageProvider
            }, services.shared.profilers.LangiumProfiler.createTask('parsing', services.LanguageMetaData.languageId));
        } else {
            this.wrapper = new ChevrotainWrapper(tokens, {
                ...services.parser.ParserConfig,
                skipValidations: production,
                errorMessageProvider: services.parser.ParserErrorMessageProvider
            });
        }
    }

    alternatives(idx: number, choices: Array<IOrAlt<any>>): void {
        this.wrapper.wrapOr(idx, choices);
    }

    optional(idx: number, callback: DSLMethodOpts<unknown>): void {
        this.wrapper.wrapOption(idx, callback);
    }

    many(idx: number, callback: DSLMethodOpts<unknown>): void {
        this.wrapper.wrapMany(idx, callback);
    }

    atLeastOne(idx: number, callback: DSLMethodOpts<unknown>): void {
        this.wrapper.wrapAtLeastOne(idx, callback);
    }

    abstract rule(rule: ParserRule | InfixRule, impl: RuleImpl): RuleResult;
    abstract consume(idx: number, tokenType: TokenType, feature: AbstractElement): void;
    abstract subrule(idx: number, rule: RuleResult, fragment: boolean, feature: AbstractElement, args: Args): void;
    abstract action($type: string, action: Action): void;

    getRule(name: string): RuleResult | undefined {
        return this.allRules.get(name);
    }

    isRecording(): boolean {
        return this.wrapper.IS_RECORDING;
    }

    get unorderedGroups(): Map<string, boolean[]> {
        return this._unorderedGroups;
    }

    getRuleStack(): number[] {
        return (this.wrapper as any).RULE_STACK;
    }

    finalize(): void {
        this.wrapper.wrapSelfAnalysis();
    }
}

export interface ParserOptions {
    rule?: string
}

interface OperatorPrecedence {
    precedence: number
    rightAssoc: boolean
}

export class LangiumParser extends AbstractLangiumParser {
    private readonly linker: Linker;
    private readonly converter: ValueConverter;
    private readonly astReflection: AstReflection;
    private readonly nodeBuilder = new CstNodeBuilder();
    private lexerResult?: LexerResult;
    private stack: any[] = [];
    private assignmentMap = new Map<AbstractElement, AssignmentElement | undefined>();
    private operatorPrecedence = new Map<string, Map<string, OperatorPrecedence>>();

    private get current(): any {
        return this.stack[this.stack.length - 1];
    }

    constructor(services: LangiumCoreServices) {
        super(services);
        this.linker = services.references.Linker;
        this.converter = services.parser.ValueConverter;
        this.astReflection = services.shared.AstReflection;
    }

    rule(rule: ParserRule | InfixRule, impl: RuleImpl): RuleResult {
        const type = this.computeRuleType(rule);
        let infixName: string | undefined = undefined;
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

    private registerPrecedenceMap(rule: InfixRule): void {
        const name = rule.name;
        const map = new Map<string, OperatorPrecedence>();
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

    private computeRuleType(rule: ParserRule | InfixRule): string | symbol | undefined {
        if (isInfixRule(rule)) {
            return getTypeName(rule);
        } else if (rule.fragment) {
            return undefined;
        } else if (isDataTypeRule(rule)) {
            return DatatypeSymbol;
        } else {
            return getTypeName(rule);
        }
    }

    parse<T extends AstNode = AstNode>(input: string, options: ParserOptions = {}): ParseResult<T> {
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

    private doParse(rule: RuleResult): any {
        let result = this.wrapper.rule(rule);
        if (this.stack.length > 0) {
            // In case the parser throws on the entry rule, `construct` is not called
            // We need to call it manually here
            result = this.construct();
        }
        // Perform some sanity checking
        if (result === undefined) {
            throw new Error('No result from parser');
        } else if (this.stack.length > 0) {
            throw new Error('Parser stack is not empty after parsing');
        }
        return result;
    }

    private startImplementation($type: string | symbol | undefined, infixName: string | undefined, implementation: RuleImpl): RuleImpl {
        return (args) => {
            // Only create a new AST node in case the calling rule is not a fragment rule
            const createNode = !this.isRecording() && $type !== undefined;
            if (createNode) {
                const node: any = { $type };
                this.stack.push(node);
                if ($type === DatatypeSymbol) {
                    node.value = '';
                } else if (infixName !== undefined) {
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

    private extractHiddenTokens(token: IToken): IToken[] {
        const hiddenTokens = this.lexerResult!.hidden;
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

    consume(idx: number, tokenType: TokenType, feature: AbstractElement): void {
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
            } else if (isDataTypeNode(current)) {
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
    private isValidToken(token: IToken): boolean {
        return !token.isInsertedInRecovery && !isNaN(token.startOffset) && typeof token.endOffset === 'number' && !isNaN(token.endOffset);
    }

    subrule(idx: number, rule: RuleResult, fragment: boolean, feature: AbstractElement, args: Args): void {
        let cstNode: CompositeCstNode | undefined;
        if (!this.isRecording() && !fragment) {
            // We only want to create a new CST node if the subrule actually creates a new AST node.
            // In other cases like calls of fragment rules the current CST/AST is populated further.
            // Note that skipping this initialization and leaving cstNode unassigned also skips the subrule assignment later on.
            // This is intended, as fragment rules only enrich the current AST node
            cstNode = this.nodeBuilder.buildCompositeNode(feature);
        }
        let result: any;
        try {
            result = this.wrapper.wrapSubrule(idx, rule, args);
        } finally {
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

    private performSubruleAssignment(result: any, feature: AbstractElement, cstNode: CompositeCstNode): void {
        const { assignment, crossRef } = this.getAssignment(feature);
        if (assignment) {
            this.assign(assignment.operator, assignment.feature, result, cstNode, crossRef);
        } else if (!assignment) {
            // If we call a subrule without an assignment we either:
            // 1. append the result of the subrule (data type rule)
            // 2. override the current object with the newly parsed object
            // If the current element is an AST node and the result of the subrule
            // is a data type rule, we can safely discard the results.
            const current = this.current;
            if (isDataTypeNode(current)) {
                current.value += result.toString();
            } else if (typeof result === 'object' && result) {
                const object = this.assignWithoutOverride(result, current);
                const newItem = object;
                this.stack.pop();
                this.stack.push(newItem);
            }
        }
    }

    action($type: string, action: Action): void {
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
            } else {
                last.$type = $type;
            }
        }
    }

    private construct(): unknown {
        if (this.isRecording()) {
            return undefined;
        }
        const obj = this.stack.pop();
        this.nodeBuilder.construct(obj);
        if ('$infixName' in obj) {
            return this.constructInfix(obj, this.operatorPrecedence.get(obj.$infixName)!);
        } else if (isDataTypeNode(obj)) {
            return this.converter.convert(obj.value, obj.$cstNode);
        } else {
            assignMandatoryProperties(this.astReflection, obj);
        }
        return obj;
    }

    private constructInfix(obj: InfixElement, precedence: Map<string, OperatorPrecedence>): any {
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
            } else if (opPrecedence.precedence === lowestPrecedenceValue) {
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
        const leftInfix: InfixElement = {
            $infixName: obj.$infixName,
            $type: obj.$type,
            $cstNode: obj.$cstNode,
            parts: leftParts,
            operators: leftOperators
        };
        const rightInfix: InfixElement = {
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

    private getAssignment(feature: AbstractElement): AssignmentElement {
        if (!this.assignmentMap.has(feature)) {
            const assignment = getContainerOfType(feature, isAssignment);
            this.assignmentMap.set(feature, {
                assignment: assignment,
                crossRef: assignment && isCrossReference(assignment.terminal) ? (assignment.terminal.isMulti ? 'multi' : 'single') : undefined
            });
        }
        return this.assignmentMap.get(feature)!;
    }

    private assign(operator: string, feature: string, value: unknown, cstNode: CstNode, crossRef?: 'multi' | 'single'): void {
        const obj = this.current;
        let item: unknown;
        if (crossRef === 'single' && typeof value === 'string') {
            item = this.linker.buildReference(obj, feature, cstNode, value);
        } else if (crossRef === 'multi' && typeof value === 'string') {
            item = this.linker.buildMultiReference(obj, feature, cstNode, value);
        } else {
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

    private assignWithoutOverride(target: any, source: any): any {
        for (const [name, existingValue] of Object.entries(source)) {
            const newValue = target[name];
            if (newValue === undefined) {
                target[name] = existingValue;
            } else if (Array.isArray(newValue) && Array.isArray(existingValue)) {
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

    get definitionErrors(): IParserDefinitionError[] {
        return this.wrapper.definitionErrors;
    }
}

export interface IParserDefinitionError {
    message: string
    type: number
    ruleName?: string
}

export abstract class AbstractParserErrorMessageProvider implements IParserErrorMessageProvider {

    buildMismatchTokenMessage(options: {
        expected: TokenType
        actual: IToken
        previous: IToken
        ruleName: string
    }): string {
        return defaultParserErrorProvider.buildMismatchTokenMessage(options);
    }

    buildNotAllInputParsedMessage(options: {
        firstRedundant: IToken
        ruleName: string
    }): string {
        return defaultParserErrorProvider.buildNotAllInputParsedMessage(options);
    }

    buildNoViableAltMessage(options: {
        expectedPathsPerAlt: TokenType[][][]
        actual: IToken[]
        previous: IToken
        customUserDescription: string
        ruleName: string
    }): string {
        return defaultParserErrorProvider.buildNoViableAltMessage(options);
    }

    buildEarlyExitMessage(options: {
        expectedIterationPaths: TokenType[][]
        actual: IToken[]
        previous: IToken
        customUserDescription: string
        ruleName: string
    }): string {
        return defaultParserErrorProvider.buildEarlyExitMessage(options);
    }

}

export class LangiumParserErrorMessageProvider extends AbstractParserErrorMessageProvider {

    override buildMismatchTokenMessage({ expected, actual }: {
        expected: TokenType
        actual: IToken
        previous: IToken
        ruleName: string
    }): string {
        const expectedMsg = expected.LABEL
            ? '`' + expected.LABEL + '`'
            : expected.name.endsWith(':KW')
                ? `keyword '${expected.name.substring(0, expected.name.length - 3)}'`
                : `token of type '${expected.name}'`;
        return `Expecting ${expectedMsg} but found \`${actual.image}\`.`;
    }

    override buildNotAllInputParsedMessage({ firstRedundant }: {
        firstRedundant: IToken
        ruleName: string
    }): string {
        return `Expecting end of file but found \`${firstRedundant.image}\`.`;
    }
}

export interface CompletionParserResult {
    tokens: IToken[]
    elementStack: AbstractElement[]
    tokenIndex: number
}

export class LangiumCompletionParser extends AbstractLangiumParser {
    private tokens: IToken[] = [];

    private elementStack: AbstractElement[] = [];
    private lastElementStack: AbstractElement[] = [];
    private nextTokenIndex = 0;
    private stackSize = 0;

    action(): void {
        // NOOP
    }

    construct(): unknown {
        // NOOP
        return undefined;
    }

    parse(input: string): CompletionParserResult {
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

    rule(rule: ParserRule, impl: RuleImpl): RuleResult {
        const ruleMethod = this.wrapper.DEFINE_RULE(withRuleSuffix(rule.name), this.startImplementation(impl).bind(this));
        this.allRules.set(rule.name, ruleMethod);
        if (rule.entry) {
            this.mainRule = ruleMethod;
        }
        return ruleMethod;
    }

    private resetState(): void {
        this.elementStack = [];
        this.lastElementStack = [];
        this.nextTokenIndex = 0;
        this.stackSize = 0;
    }

    private startImplementation(implementation: RuleImpl): RuleImpl {
        return (args) => {
            const size = this.keepStackSize();
            try {
                implementation(args);
            } finally {
                this.resetStackSize(size);
            }
        };
    }

    private removeUnexpectedElements(): void {
        this.elementStack.splice(this.stackSize);
    }

    keepStackSize(): number {
        const size = this.elementStack.length;
        this.stackSize = size;
        return size;
    }

    resetStackSize(size: number): void {
        this.removeUnexpectedElements();
        this.stackSize = size;
    }

    consume(idx: number, tokenType: TokenType, feature: AbstractElement): void {
        this.wrapper.wrapConsume(idx, tokenType);
        if (!this.isRecording()) {
            this.lastElementStack = [...this.elementStack, feature];
            this.nextTokenIndex = this.currIdx + 1;
        }
    }

    subrule(idx: number, rule: RuleResult, fragment: boolean, feature: AbstractElement, args: Args): void {
        this.before(feature);
        this.wrapper.wrapSubrule(idx, rule, args);
        this.after(feature);
    }

    before(element: AbstractElement): void {
        if (!this.isRecording()) {
            this.elementStack.push(element);
        }
    }

    after(element: AbstractElement): void {
        if (!this.isRecording()) {
            const index = this.elementStack.lastIndexOf(element);
            if (index >= 0) {
                this.elementStack.splice(index);
            }
        }
    }

    get currIdx(): number {
        return (this.wrapper as any).currIdx;
    }
}

const defaultConfig: IParserConfig = {
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

    // This array is set in the base implementation of Chevrotain.
    definitionErrors: IParserDefinitionError[];

    constructor(tokens: TokenVocabulary, config: IParserConfig) {
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

    get IS_RECORDING(): boolean {
        return this.RECORDING_PHASE;
    }

    DEFINE_RULE(name: string, impl: RuleImpl, config?: IRuleConfig<any>): RuleResult {
        return this.RULE(name, impl, config);
    }

    wrapSelfAnalysis(): void {
        this.performSelfAnalysis();
    }

    wrapConsume(idx: number, tokenType: TokenType): IToken {
        return this.consume(idx, tokenType, undefined);
    }

    wrapSubrule(idx: number, rule: RuleResult, args: Args): unknown {
        return this.subrule(idx, rule, {
            ARGS: [args]
        });
    }

    wrapOr(idx: number, choices: Array<IOrAlt<any>>): void {
        this.or(idx, choices);
    }

    wrapOption(idx: number, callback: DSLMethodOpts<unknown>): void {
        this.option(idx, callback);
    }

    wrapMany(idx: number, callback: DSLMethodOpts<unknown>): void {
        this.many(idx, callback);
    }

    wrapAtLeastOne(idx: number, callback: DSLMethodOpts<unknown>): void {
        this.atLeastOne(idx, callback);
    }
    rule(rule: RuleResult): any {
        return rule.call(this, {});
    }
}

class ProfilerWrapper extends ChevrotainWrapper {
    private readonly task: ProfilingTask;
    constructor(tokens: TokenVocabulary, config: IParserConfig, task: ProfilingTask) {
        super(tokens, config);
        this.task = task;
    }

    override rule(rule: RuleResult): any {
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

    private ruleName(rule: any): string {
        return rule.ruleName as string;
    }
    protected override subrule<ARGS extends unknown[], R>(idx: number, ruleToCall: ParserMethod<ARGS, R>, options?: SubruleMethodOpts<ARGS>): R {
        this.task.startSubTask(this.ruleName(ruleToCall));
        try {
            return super.subrule<ARGS, R>(idx, ruleToCall, options);
        }
        finally {
            this.task.stopSubTask(this.ruleName(ruleToCall));
        }
    }
}
