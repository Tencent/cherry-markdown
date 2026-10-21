import { cherryInlineSyntax, inlineInputPattern } from './inline-syntax.js';
import { InputRule } from '@milkdown/kit/prose/inputrules';
import { $inputRule, $mark } from '@milkdown/kit/utils';

type MarkAttrs = Record<string, string>;
type MarkDom = [string, Record<string, string>, ...(number | string | MarkDom)[]];

interface MarkDefinition {
  name: string;
  mdastType: string;
  attrs?: Record<string, { default: string; validate: 'string' }>;
  parseAttrs?: (node: Record<string, unknown>) => MarkAttrs;
  dom: (attrs: MarkAttrs) => MarkDom;
}

const stringAttr = { default: '', validate: 'string' as const };

function attrDatasetName(name: string) {
  return `data-cherry-${name}`;
}

const definitions: MarkDefinition[] = [
  {
    name: 'cherry_background_color',
    mdastType: 'cherry_background_color',
    attrs: { color: stringAttr },
    parseAttrs: (node) => ({ color: String(node.color ?? '') }),
    dom: ({ color }) => ['span', { class: 'cherry-wysiwyg-bg', style: `background-color:${color}` }, 0],
  },
  {
    name: 'cherry_color',
    mdastType: 'cherry_color',
    attrs: { color: stringAttr },
    parseAttrs: (node) => ({ color: String(node.color ?? '') }),
    dom: ({ color }) => ['span', { class: 'cherry-wysiwyg-color', style: `color:${color}` }, 0],
  },
  {
    name: 'cherry_font_size',
    mdastType: 'cherry_font_size',
    attrs: { size: stringAttr },
    parseAttrs: (node) => ({ size: String(node.size ?? '') }),
    dom: ({ size }) => ['span', { class: 'cherry-wysiwyg-size', style: `font-size:${size}px` }, 0],
  },
  {
    name: 'cherry_subscript',
    mdastType: 'cherry_subscript',
    dom: () => ['sub', { class: 'cherry-wysiwyg-sub' }, 0],
  },
  {
    name: 'cherry_superscript',
    mdastType: 'cherry_superscript',
    dom: () => ['sup', { class: 'cherry-wysiwyg-sup' }, 0],
  },
  {
    name: 'cherry_ruby',
    mdastType: 'cherry_ruby',
    attrs: { annotation: stringAttr },
    parseAttrs: (node) => ({ annotation: String(node.annotation ?? '') }),
    // Use the browser's native ruby layout, which is also what Cherry's
    // renderer emits. Keeping the annotation in an <rt> child avoids a
    // parallel pseudo-element layout that can truncate or shift headings.
    dom: ({ annotation }) => ['ruby', { class: 'cherry-wysiwyg-ruby' }, ['span', {}, 0], ['rt', {}, annotation]],
  },
  {
    name: 'cherry_underline',
    mdastType: 'cherry_underline',
    dom: () => ['span', { class: 'cherry-wysiwyg-underline' }, 0],
  },
  {
    name: 'cherry_highlight',
    mdastType: 'cherry_highlight',
    dom: () => ['mark', { class: 'cherry-wysiwyg-highlight' }, 0],
  },
];

export const cherryWysiwygMarkSchemas = definitions.map((definition) =>
  $mark(definition.name, () => ({
    attrs: definition.attrs,
    parseDOM: [
      {
        tag: `[data-cherry-mark="${definition.name}"]`,
        getAttrs: (dom) =>
          Object.fromEntries(
            Object.keys(definition.attrs ?? {}).map((name) => [name, dom.getAttribute(attrDatasetName(name)) ?? '']),
          ),
      },
    ],
    toDOM: (mark) => {
      const [tag, attrs, ...children] = definition.dom(mark.attrs as MarkAttrs);
      const serializedAttrs = Object.fromEntries(
        Object.keys(definition.attrs ?? {}).map((name) => [attrDatasetName(name), String(mark.attrs[name] ?? '')]),
      );
      return [tag, { ...attrs, ...serializedAttrs, 'data-cherry-mark': definition.name }, ...children];
    },
    parseMarkdown: {
      match: (node) => node.type === definition.mdastType,
      runner: (state, node, markType) => {
        state.openMark(markType, definition.parseAttrs?.(node as Record<string, unknown>));
        state.next(node.children);
        state.closeMark(markType);
      },
    },
    toMarkdown: {
      match: (mark) => mark.type.name === definition.name,
      runner: (state, mark, node) => {
        state.addNode(definition.mdastType, undefined, node.textContent, { ...mark.attrs });
        return true;
      },
    },
  })),
);

export const cherryWysiwygMarkInputRules = definitions.flatMap((definition, index) => {
  const syntax = cherryInlineSyntax.find((item) => item.type === definition.mdastType);
  if (!syntax) return [];
  const inputPattern = inlineInputPattern(syntax);
  const schema = cherryWysiwygMarkSchemas[index];
  if (!schema) return [];
  return [
    $inputRule(
      (ctx) =>
        new InputRule(
          inputPattern,
          (state, match, start, end) => {
            // Milkdown's custom input-rule runner does not honor inCodeMark.
            // Protect both the caret and code fragments inside the full match.
            if ((state.storedMarks ?? state.selection.$from.marks()).some((mark) => mark.type.spec.code)) return null;
            let containsCode = false;
            state.doc.nodesBetween(start, end, (node) => {
              if (node.marks.some((mark) => mark.type.spec.code)) containsCode = true;
            });
            if (containsCode) return null;
            // Capture indices distinguish a payload from an identical attribute
            // (e.g. !!red red!!), without reparsing the shared Cherry grammar.
            const range = (match as RegExpMatchArray & { indices?: Array<[number, number]> }).indices?.[
              syntax.textGroup
            ];
            if (!range || range[1] <= range[0]) return null;
            const leading = match[1]?.length ?? 0;
            const trailing = syntax.trailingGroup ? (match[syntax.trailingGroup]?.length ?? 0) : 0;
            const transaction = state.tr;
            transaction.delete(start + range[1], end - trailing);
            transaction.delete(start + leading, start + range[0]);
            transaction.addMark(
              start + leading,
              start + leading + range[1] - range[0],
              schema.type(ctx).create(syntax.attrs?.(match) ?? {}),
            );
            transaction.setStoredMarks(state.storedMarks ?? []);
            return transaction;
          },
          { inCodeMark: false },
        ),
    ),
  ];
});
