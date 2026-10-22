import { cherryInlineRules } from '../generated/cherry-syntax.js';

/** The same Cherry grammar feeds document import and live input rules. */
interface InlineSyntax {
  type: string;
  pattern: RegExp;
  text(match: RegExpMatchArray): string;
  textGroup: number;
  attrs?(match: RegExpMatchArray): Record<string, string>;
  trailingGroup?: number;
}

type Rule = { begin: string; content: string; end: string };
const pattern = (rule: Rule) => new RegExp(rule.begin + rule.content + rule.end);
const text = (group: number) => (match: RegExpMatchArray) => match[group] ?? '';
const attribute = (name: string) => (match: RegExpMatchArray) => ({ [name]: match[2] ?? '' });
const nested = (outer: Rule, inner: Rule) =>
  pattern({
    ...outer,
    content: outer.content.replace('([\\w\\W]+?)', `(${inner.begin}${inner.content}${inner.end})`),
  });
const rules = cherryInlineRules;

export const cherryInlineSyntax: readonly InlineSyntax[] = [
  {
    type: 'cherry_background_color',
    pattern: pattern(rules.BackgroundColor),
    text: text(3),
    textGroup: 3,
    attrs: attribute('color'),
  },
  { type: 'cherry_color', pattern: pattern(rules.Color), text: text(3), textGroup: 3, attrs: attribute('color') },
  { type: 'cherry_font_size', pattern: pattern(rules.Size), text: text(3), textGroup: 3, attrs: attribute('size') },
  { type: 'cherry_subscript', pattern: pattern(rules.Sub), text: text(2), textGroup: 2 },
  { type: 'cherry_superscript', pattern: pattern(rules.Sup), text: text(2), textGroup: 2 },
  {
    type: 'cherry_ruby',
    pattern: pattern(rules.Ruby),
    text: text(2),
    textGroup: 2,
    attrs: (m) => ({ annotation: m[3] ?? '' }),
    trailingGroup: 4,
  },
  { type: 'cherry_underline', pattern: pattern(rules.Underline), text: text(2), textGroup: 2, trailingGroup: 3 },
  { type: 'cherry_highlight', pattern: pattern(rules.HighLight), text: text(2), textGroup: 2, trailingGroup: 3 },
];

// Cherry applies color hooks in sequence. Capture a nested color expression
// intact before adapting its children, rather than ending at its inner marker.
export const cherryInlineMatchers: readonly InlineSyntax[] = [
  {
    type: 'cherry_color',
    pattern: nested(rules.Color, rules.BackgroundColor),
    text: text(3),
    textGroup: 3,
    attrs: attribute('color'),
  },
  {
    type: 'cherry_background_color',
    pattern: nested(rules.BackgroundColor, rules.Color),
    text: text(3),
    textGroup: 3,
    attrs: attribute('color'),
  },
  ...cherryInlineSyntax,
];

/** While typing, a shorter delimiter must not consume an unfinished longer one. */
export function inlineInputPattern(syntax: InlineSyntax) {
  let source = syntax.pattern.source;
  if (syntax.type === 'cherry_superscript') {
    source = `${rules.Sup.begin}(?!\\^)${rules.Sup.content}${rules.Sup.end}(?!\\^)`;
    source = `(?<!\\^)${source}`;
  } else if (syntax.type === 'cherry_color' || syntax.type === 'cherry_font_size') {
    source = `(?<!!)${source}`;
  }
  return new RegExp(`${source}$`, 'd');
}
