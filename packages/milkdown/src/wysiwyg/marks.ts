import { markRule } from '@milkdown/kit/prose';
import { $inputRule, $mark } from '@milkdown/kit/utils';

type MarkAttrs = Record<string, string>;
type MarkDom = [string, Record<string, string>, ...(number | string | MarkDom)[]];

interface MarkDefinition {
  name: string;
  mdastType: string;
  attrs?: Record<string, { default: string; validate: 'string' }>;
  parseAttrs?: (node: Record<string, unknown>) => MarkAttrs;
  dom: (attrs: MarkAttrs) => MarkDom;
  serialize: (text: string, attrs: MarkAttrs) => string;
  input?: {
    pattern: RegExp;
    attrs?: (match: RegExpMatchArray) => MarkAttrs;
    content?: (match: RegExpMatchArray) => string;
  };
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
    serialize: (text, { color }) => `!!!${color} ${text}!!!`,
    input: { pattern: /!!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,10})\s([\s\S]+?)!!!$/, attrs: (m) => ({ color: m[1] ?? '' }) },
  },
  {
    name: 'cherry_color',
    mdastType: 'cherry_color',
    attrs: { color: stringAttr },
    parseAttrs: (node) => ({ color: String(node.color ?? '') }),
    dom: ({ color }) => ['span', { class: 'cherry-wysiwyg-color', style: `color:${color}` }, 0],
    serialize: (text, { color }) => `!!${color} ${text}!!`,
    input: { pattern: /!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,20})\s([\s\S]+?)!!$/, attrs: (m) => ({ color: m[1] ?? '' }) },
  },
  {
    name: 'cherry_font_size',
    mdastType: 'cherry_font_size',
    attrs: { size: stringAttr },
    parseAttrs: (node) => ({ size: String(node.size ?? '') }),
    dom: ({ size }) => ['span', { class: 'cherry-wysiwyg-size', style: `font-size:${size}px` }, 0],
    serialize: (text, { size }) => `!${size} ${text}!`,
    input: { pattern: /!([0-9]{1,2})\s([\s\S]+?)!$/, attrs: (m) => ({ size: m[1] ?? '' }) },
  },
  {
    name: 'cherry_subscript',
    mdastType: 'cherry_subscript',
    dom: () => ['sub', { class: 'cherry-wysiwyg-sub' }, 0],
    serialize: (text) => `^^${text}^^`,
    input: { pattern: /\^\^([^\n]+?)\^\^$/ },
  },
  {
    name: 'cherry_superscript',
    mdastType: 'cherry_superscript',
    dom: () => ['sup', { class: 'cherry-wysiwyg-sup' }, 0],
    serialize: (text) => `^${text}^`,
    input: { pattern: /(?<!\^)\^([^\n^]+?)\^$/ },
  },
  {
    name: 'cherry_ruby',
    mdastType: 'cherry_ruby',
    attrs: { annotation: stringAttr },
    parseAttrs: (node) => ({ annotation: String(node.annotation ?? '') }),
    // Use the browser's native ruby layout, which is also what Cherry's
    // renderer emits. Keeping the annotation in an <rt> child avoids a
    // parallel pseudo-element layout that can truncate or shift headings.
    dom: ({ annotation }) => [
      'ruby',
      { class: 'cherry-wysiwyg-ruby' },
      ['span', {}, 0],
      ['rt', {}, annotation],
    ],
    serialize: (text, { annotation }) => `{${text}|${annotation}}`,
    input: {
      pattern: /(?:^|\s)\{([^|\n]+?)\|([^}\n]+?)\}$/,
      attrs: (m) => ({ annotation: m[2] ?? '' }),
      content: (m) => m[1] ?? '',
    },
  },
  {
    name: 'cherry_underline',
    mdastType: 'cherry_underline',
    dom: () => ['span', { class: 'cherry-wysiwyg-underline' }, 0],
    serialize: (text) => `/${text}/`,
    input: { pattern: /(?:^|\s)\/([^/\n]+?)\/$/ },
  },
  {
    name: 'cherry_highlight',
    mdastType: 'cherry_highlight',
    dom: () => ['mark', { class: 'cherry-wysiwyg-highlight' }, 0],
    serialize: (text) => `==${text}==`,
    input: { pattern: /(?:^|\s)==([^=\n]+?)==$/ },
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
  if (!definition.input) return [];
  const schema = cherryWysiwygMarkSchemas[index];
  if (!schema) return [];
  return [
    $inputRule((ctx) =>
      markRule(definition.input!.pattern, schema.type(ctx), {
        getAttr: (match) => definition.input?.attrs?.(match) ?? {},
        updateCaptured: (captured) => {
          const match = definition.input?.pattern.exec(captured.fullMatch ?? '');
          return match && definition.input?.content ? { group: definition.input.content(match) } : {};
        },
      }),
    ),
  ];
});
