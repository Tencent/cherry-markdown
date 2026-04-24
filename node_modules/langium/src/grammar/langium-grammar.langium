// ******************************************************************************
// Copyright 2021 TypeFox GmbH
// This program and the accompanying materials are made available under the
// terms of the MIT License, which is available in the project root.
// *****************************************************************************

grammar LangiumGrammar

import './langium-types'

entry Grammar returns Grammar:
    (isDeclared?='grammar' name=ID)?
    imports+=GrammarImport*
    (rules+=AbstractRule | interfaces+=Interface | types+=Type)*;

Interface returns Interface:
    'interface' name=ID
    ('extends' superTypes+=[AbstractType:ID] (',' superTypes+=[AbstractType:ID])*)?
    '{'
        attributes+=TypeAttribute*
    '}'
';'?;

TypeAttribute returns TypeAttribute:
    name=FeatureName (isOptional?='?')? ':' type=TypeDefinition ('=' defaultValue=ValueLiteral)? ';'?;

ValueLiteral returns ValueLiteral:
    StringLiteral | NumberLiteral | BooleanLiteral | ArrayLiteral;

StringLiteral returns StringLiteral:
    value=STRING;
NumberLiteral returns NumberLiteral:
    value=NUMBER;
BooleanLiteral returns BooleanLiteral:
    true?='true' | 'false';
ArrayLiteral returns ArrayLiteral:
    '[' (elements+=ValueLiteral (',' elements+=ValueLiteral)*)? ']';

TypeDefinition returns TypeDefinition:
    UnionType;

UnionType returns TypeDefinition:
    ArrayType ({UnionType.types+=current} ('|' types+=ArrayType)+)?;

ArrayType returns TypeDefinition:
    ReferenceType ({ArrayType.elementType=current} '[' ']')? ;

ReferenceType returns TypeDefinition:
    SimpleType |
    {ReferenceType} '@' referenceType=SimpleType (isMulti?='+')?;

SimpleType returns TypeDefinition:
    '(' TypeDefinition ')' |
    {SimpleType} (typeRef=[AbstractType:ID] | primitiveType=PrimitiveType | stringType=STRING);

PrimitiveType returns string:
    'string' | 'number' | 'boolean' | 'Date' | 'bigint';

Type returns Type:
    'type' name=ID '=' type=TypeDefinition ';'?;

AbstractRule returns AbstractRule:
    ParserRule | TerminalRule | InfixRule;

GrammarImport returns GrammarImport:
    'import' path=STRING ';'?;

ParserRule returns ParserRule:
    (entry?='entry' | fragment?='fragment')?
    RuleNameAndParams
    ('returns' (returnType=[AbstractType:ID] | dataType=PrimitiveType) | inferredType=InferredType<false>)? ':'
    definition=Alternatives ';';

InfixRule returns InfixRule: 'infix' RuleNameAndParams
    'on' call=RuleCall
    ('returns' (returnType=[AbstractType:ID] | dataType=PrimitiveType) | inferredType=InferredType<false>)? ':'
    operators=InfixRuleOperators ';';

InfixRuleOperators returns InfixRuleOperators: precedences+=InfixRuleOperatorList ('>' precedences+=InfixRuleOperatorList)*;

InfixRuleOperatorList returns InfixRuleOperatorList:
    (associativity=Associativity 'assoc')?
    operators+=Keyword ('|' operators+=Keyword)*;

Associativity returns string: 'left' | 'right';

InferredType<imperative> returns InferredType:
    (<imperative> 'infer' | <!imperative> 'infers') name=ID;

fragment RuleNameAndParams:
    name=ID ('<' (parameters+=Parameter (',' parameters+=Parameter)*)? '>')?;

Parameter returns Parameter:
    name=ID;

Alternatives returns AbstractElement:
    ConditionalBranch ({Alternatives.elements+=current} ('|' elements+=ConditionalBranch)+)?;

ConditionalBranch returns AbstractElement:
    UnorderedGroup
    | {Group} '<' guardCondition=Disjunction '>' (elements+=AbstractToken)+;

UnorderedGroup returns AbstractElement:
    Group ({UnorderedGroup.elements+=current} ('&' elements+=Group)+)?;

Group returns AbstractElement:
    AbstractToken ({Group.elements+=current} elements+=AbstractToken+)?;

AbstractToken returns AbstractElement:
    AbstractTokenWithCardinality |
    Action;

AbstractTokenWithCardinality returns AbstractElement:
    (Assignment | AbstractTerminal) cardinality=('?'|'*'|'+')?;

Action returns AbstractElement:
    {Action} '{' (type=[AbstractType:ID] | inferredType=InferredType<true>) ('.' feature=FeatureName operator=('='|'+=') 'current')? '}';

AbstractTerminal returns AbstractElement:
    Keyword |
    RuleCall |
    ParenthesizedElement |
    PredicatedKeyword |
    PredicatedRuleCall |
    PredicatedGroup |
    EndOfFile;

EndOfFile returns EndOfFile:
    {EndOfFile} 'EOF';

Keyword returns Keyword:
    value=STRING;

RuleCall returns RuleCall:
    rule=[AbstractRule:ID] ('<' arguments+=NamedArgument (',' arguments+=NamedArgument)* '>')?;

NamedArgument returns NamedArgument:
    (parameter=[Parameter:ID] calledByName?='=')? value=Disjunction;

Disjunction returns Condition:
    Conjunction ({Disjunction.left=current} '|' right=Conjunction)*;

Conjunction returns Condition:
    Negation ({Conjunction.left=current} '&' right=Negation)*;

Negation returns Condition:
    Atom | {Negation} '!' value=Negation;

Atom returns Condition:
    ParameterReference | ParenthesizedCondition | BooleanLiteral;

ParenthesizedCondition returns Condition:
    '(' Disjunction ')';

ParameterReference returns ParameterReference:
    parameter=[Parameter:ID];

PredicatedKeyword returns Keyword:
    (predicate=('=>'|'->')) value=STRING;

PredicatedRuleCall returns RuleCall:
    (predicate=('=>'|'->')) rule=[AbstractRule:ID] ('<' arguments+=NamedArgument (',' arguments+=NamedArgument)* '>')?;

Assignment returns AbstractElement:
    {Assignment} (predicate=('=>'|'->'))? feature=FeatureName operator=('+='|'='|'?=') terminal=AssignableTerminal;

AssignableTerminal returns AbstractElement:
    Keyword | RuleCall | ParenthesizedAssignableElement | CrossReference;

ParenthesizedAssignableElement returns AbstractElement:
    '(' AssignableAlternatives ')';

AssignableAlternatives returns AbstractElement:
    AssignableTerminal ({Alternatives.elements+=current} ('|' elements+=AssignableTerminal)+)?;

CrossReference returns AbstractElement:
    {CrossReference} '[' isMulti?='+'? type=[AbstractType:ID] ((deprecatedSyntax?='|' | ':') terminal=CrossReferenceableTerminal )? ']';

CrossReferenceableTerminal returns AbstractElement:
    Keyword | RuleCall;

ParenthesizedElement returns AbstractElement:
    '(' Alternatives ')';

PredicatedGroup returns Group:
    (predicate=('=>'|'->')) '(' elements+=Alternatives ')';

ReturnType returns ReturnType:
    name=(PrimitiveType | ID);

TerminalRule returns TerminalRule:
    hidden?='hidden'? 'terminal' (fragment?='fragment' name=ID | name=ID ('returns' type=ReturnType)?) ':'
        definition=TerminalAlternatives
    ';';

TerminalAlternatives returns TerminalElement:
    TerminalGroup ({TerminalAlternatives.elements+=current} '|' elements+=TerminalGroup)*;

TerminalGroup returns TerminalElement:
    TerminalToken ({TerminalGroup.elements+=current} elements+=TerminalToken+)?;

TerminalToken returns TerminalElement:
    TerminalTokenElement cardinality=('?'|'*'|'+')?;

TerminalTokenElement returns TerminalElement:
    CharacterRange | TerminalRuleCall | ParenthesizedTerminalElement | NegatedToken | UntilToken | RegexToken | Wildcard;

ParenthesizedTerminalElement returns TerminalElement:
    '(' (lookahead=('?='|'?!'|'?<='|'?<!'))? TerminalAlternatives parenthesized?=')';

TerminalRuleCall returns TerminalElement:
    {TerminalRuleCall} rule=[TerminalRule:ID];

NegatedToken returns TerminalElement:
    {NegatedToken} '!' terminal=TerminalTokenElement;

UntilToken returns TerminalElement:
    {UntilToken} '->' terminal=TerminalTokenElement;

RegexToken returns TerminalElement:
    {RegexToken} regex=RegexLiteral;

Wildcard returns TerminalElement:
    {Wildcard} '.';

CharacterRange returns TerminalElement:
    {CharacterRange} left=Keyword ('..' right=Keyword)?;

FeatureName returns string:
    'infix' | 'on' | 'right' | 'left' | 'assoc' | 'current' | 'entry' | 'extends' | 'false' | 'fragment' | 'grammar' | 'hidden' | 'import' | 'interface' | 'returns' | 'terminal' | 'true' | 'type' | 'infer' | 'infers' | 'with' | PrimitiveType | ID;

terminal ID: /\^?[_a-zA-Z][\w_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal NUMBER returns number: /NaN|-?((\d*\.\d+|\d+)([Ee][+-]?\d+)?|Infinity)/;
terminal RegexLiteral returns string: /\/(?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+\/[a-z]*/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
