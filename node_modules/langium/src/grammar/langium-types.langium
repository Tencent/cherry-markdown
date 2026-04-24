// ******************************************************************************
// Copyright 2025 TypeFox GmbH
// This program and the accompanying materials are made available under the
// terms of the MIT License, which is available in the project root.
// *****************************************************************************

type AbstractRule = AbstractParserRule | TerminalRule;

type AbstractParserRule = InfixRule | ParserRule;

type AbstractType = Interface | Type | AbstractParserRule | InferredType;

type Associativity = "left" | "right";

type Condition = BooleanLiteral | Conjunction | Disjunction | Negation | ParameterReference;

type FeatureName = "assoc" | "current" | "entry" | "extends" | "false" | "fragment" | "grammar" | "hidden" | "import" | "infer" | "infers" | "infix" | "interface" | "left" | "on" | "returns" | "right" | "terminal" | "true" | "type" | "with" | PrimitiveType | string;

type PrimitiveType = "Date" | "bigint" | "boolean" | "number" | "string";

type TypeDefinition = ArrayType | ReferenceType | SimpleType | UnionType;

type ValueLiteral = ArrayLiteral | BooleanLiteral | NumberLiteral | StringLiteral;

interface AbstractElement {
    cardinality?: "*" | "+" | "?";
}

interface Action extends AbstractElement {
    feature?: FeatureName;
    inferredType?: InferredType;
    operator?: "+=" | "=";
    type?: @AbstractType;
}

interface Alternatives extends AbstractElement {
    elements: AbstractElement[];
}

interface ArrayLiteral {
    elements: ValueLiteral[];
}

interface ArrayType {
    elementType: TypeDefinition;
}

interface Assignment extends AbstractElement {
    feature: FeatureName;
    operator: "+=" | "=" | "?=";
    predicate?: "->" | "=>";
    terminal: AbstractElement;
}

interface BooleanLiteral {
    true: boolean;
}

interface CharacterRange extends TerminalElement {
    left: Keyword;
    right?: Keyword;
}

interface Conjunction {
    left: Condition;
    right: Condition;
}

interface CrossReference extends AbstractElement {
    deprecatedSyntax: boolean;
    isMulti: boolean;
    terminal?: AbstractElement;
    type: @AbstractType;
}

interface Disjunction {
    left: Condition;
    right: Condition;
}

interface EndOfFile extends AbstractElement {
}

interface Grammar {
    imports: GrammarImport[];
    interfaces: Interface[];
    isDeclared: boolean;
    name?: string;
    rules: AbstractRule[];
    types: Type[];
}

interface GrammarImport {
    path: string;
}

interface Group extends AbstractElement {
    elements: AbstractElement[];
    guardCondition?: Condition;
    predicate?: "->" | "=>";
}

interface InferredType {
    name: string;
}

interface InfixRule {
    call: RuleCall;
    dataType?: PrimitiveType;
    inferredType?: InferredType;
    name: string;
    operators: InfixRuleOperators;
    parameters: Parameter[];
    returnType?: @AbstractType;
}

interface InfixRuleOperatorList {
    associativity?: Associativity;
    operators: Keyword[];
}

interface InfixRuleOperators {
    precedences: InfixRuleOperatorList[];
}

interface Interface {
    attributes: TypeAttribute[];
    name: string;
    superTypes: @AbstractType[];
}

interface Keyword extends AbstractElement {
    predicate?: "->" | "=>";
    value: string;
}

interface NamedArgument {
    calledByName: boolean;
    parameter?: @Parameter;
    value: Condition;
}

interface NegatedToken extends TerminalElement {
    terminal: AbstractElement;
}

interface Negation {
    value: Condition;
}

interface NumberLiteral {
    value: number;
}

interface Parameter {
    name: string;
}

interface ParameterReference {
    parameter: @Parameter;
}

interface ParserRule {
    dataType?: PrimitiveType;
    definition: AbstractElement;
    entry: boolean;
    fragment: boolean;
    inferredType?: InferredType;
    name: string;
    parameters: Parameter[];
    returnType?: @AbstractType;
}

interface ReferenceType {
    isMulti: boolean;
    referenceType: TypeDefinition;
}

interface RegexToken extends TerminalElement {
    regex: string;
}

interface ReturnType {
    name: PrimitiveType | string;
}

interface RuleCall extends AbstractElement {
    arguments: NamedArgument[];
    predicate?: "->" | "=>";
    rule: @AbstractRule;
}

interface SimpleType {
    primitiveType?: PrimitiveType;
    stringType?: string;
    typeRef?: @AbstractType;
}

interface StringLiteral {
    value: string;
}

interface TerminalAlternatives extends TerminalElement {
    elements: AbstractElement[];
}

interface TerminalElement extends AbstractElement {
    lookahead?: "?!" | "?<!" | "?<=" | "?=";
    parenthesized?: boolean;
}

interface TerminalGroup extends TerminalElement {
    elements: AbstractElement[];
}

interface TerminalRule {
    definition: TerminalElement;
    fragment: boolean;
    hidden: boolean;
    name: string;
    type?: ReturnType;
}

interface TerminalRuleCall extends TerminalElement {
    rule: @TerminalRule;
}

interface Type {
    name: string;
    type: TypeDefinition;
}

interface TypeAttribute {
    defaultValue?: ValueLiteral;
    isOptional: boolean;
    name: FeatureName;
    type: TypeDefinition;
}

interface UnionType {
    types: TypeDefinition[];
}

interface UnorderedGroup extends AbstractElement {
    elements: AbstractElement[];
}

interface UntilToken extends TerminalElement {
    terminal: AbstractElement;
}

interface Wildcard extends TerminalElement {
}

