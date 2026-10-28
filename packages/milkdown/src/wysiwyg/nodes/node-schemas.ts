import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import type { SerializerState } from '@milkdown/kit/transformer';
import { $nodeSchema } from '@milkdown/kit/utils';

function sourceAttr() {
  return { default: '', validate: 'string' as const };
}

function addCustomMarkdownNode(state: SerializerState, type: string, node: ProseNode) {
  state
    .openNode(type, undefined, { ...node.attrs })
    .next(node.content)
    .closeNode();
}

export const cherryCompoundItemSchema = $nodeSchema('cherry_compound_item', () => ({
  content: 'block+',
  defining: true,
  selectable: true,
  attrs: {
    role: sourceAttr(),
    label: sourceAttr(),
    open: { default: false, validate: 'boolean' as const },
  },
  parseDOM: [
    {
      tag: '[data-cherry-compound-item]',
      contentElement: '[data-cherry-compound-content]',
      getAttrs: (dom: HTMLElement) => ({
        role: dom.dataset.role ?? '',
        label: dom.dataset.label ?? '',
        open: dom.dataset.open === 'true',
      }),
    },
  ],
  toDOM: (node) => [
    'section',
    {
      'data-cherry-compound-item': '',
      'data-role': String(node.attrs.role),
      'data-label': String(node.attrs.label),
      'data-open': String(node.attrs.open),
    },
    ['header', String(node.attrs.label)],
    ['div', { 'data-cherry-compound-content': '' }, 0],
  ],
  parseMarkdown: {
    match: (node) => node.type === 'cherryCompoundItem',
    runner: (state, node, type) => {
      state
        .openNode(type, { role: String(node.role ?? ''), label: String(node.label ?? ''), open: Boolean(node.open) })
        .next(node.children)
        .closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cherry_compound_item',
    runner: (state, node) => addCustomMarkdownNode(state, 'cherryCompoundItem', node),
  },
}));

function compoundSchema(name: 'cherry_panel' | 'cherry_detail', markdownType: 'cherryPanel' | 'cherryDetail') {
  return $nodeSchema(name, () => ({
    content: name === 'cherry_detail' ? 'cherry_compound_item+' : '(block | cherry_compound_item)+',
    group: 'block',
    defining: true,
    isolating: true,
    selectable: true,
    attrs: {
      kind: { default: name === 'cherry_detail' ? 'detail' : 'panel', validate: 'string' as const },
      rawType: sourceAttr(),
      title: sourceAttr(),
      source: sourceAttr(),
      originalBody: sourceAttr(),
    },
    parseDOM: [
      {
        tag: `[data-cherry-compound="${name}"]`,
        contentElement: '[data-cherry-compound-body]',
        getAttrs: (dom: HTMLElement) => ({
          kind: dom.dataset.kind ?? '',
          rawType: dom.dataset.rawType ?? '',
          title: dom.dataset.title ?? '',
          source: dom.dataset.source ?? '',
          originalBody: dom.dataset.originalBody ?? '',
        }),
      },
    ],
    toDOM: (node) => [
      'section',
      {
        'data-cherry-compound': name,
        'data-kind': String(node.attrs.kind),
        'data-raw-type': String(node.attrs.rawType),
        'data-title': String(node.attrs.title),
        'data-source': String(node.attrs.source),
        'data-original-body': String(node.attrs.originalBody),
      },
      ['div', { 'data-cherry-compound-body': '' }, 0],
    ],
    parseMarkdown: {
      match: (node) => node.type === markdownType,
      runner: (state, node, type) => {
        state
          .openNode(type, {
            kind: String(node.kind ?? (name === 'cherry_detail' ? 'detail' : 'panel')),
            rawType: String(node.rawType ?? ''),
            title: String(node.title ?? ''),
            source: String(node.source ?? ''),
            originalBody: String(node.originalBody ?? ''),
          })
          .next(node.children)
          .closeNode();
      },
    },
    toMarkdown: {
      match: (node) => node.type.name === name,
      runner: (state, node) => addCustomMarkdownNode(state, markdownType, node),
    },
  }));
}

export const cherryPanelSchema = compoundSchema('cherry_panel', 'cherryPanel');
export const cherryDetailSchema = compoundSchema('cherry_detail', 'cherryDetail');

function leafSchema(
  name: string,
  markdownType: string,
  inline = false,
  extraAttrs: Record<string, { default: string; validate: 'string' }> = {},
) {
  const dataAttribute = (key: string) => `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  return $nodeSchema(name, () => ({
    atom: true,
    defining: !inline,
    // Rendered Cherry blocks contain selectable preview text and controls.
    // Making the atom itself draggable lets the browser turn a text-selection
    // gesture inside Tabs/Columns/Timeline into a drag of the entire node.
    // Block movement must be opt-in through an explicit handle instead.
    draggable: false,
    group: inline ? 'inline' : 'block',
    inline,
    isolating: !inline,
    selectable: true,
    attrs: { source: sourceAttr(), ...extraAttrs },
    parseDOM: [
      {
        tag: `[data-cherry-node="${name}"]`,
        getAttrs: (dom: HTMLElement) => ({
          source: dom.dataset.source ?? '',
          ...Object.fromEntries(
            Object.keys(extraAttrs).map((key) => [key, dom.getAttribute(dataAttribute(key)) ?? '']),
          ),
        }),
      },
    ],
    toDOM: (node) => [
      inline ? 'span' : 'div',
      {
        'data-cherry-node': name,
        'data-source': String(node.attrs.source),
        ...Object.fromEntries(
          Object.keys(extraAttrs).map((key) => [dataAttribute(key), String(node.attrs[key] ?? '')]),
        ),
      },
    ],
    parseMarkdown: {
      match: (node) => node.type === markdownType,
      runner: (state, node, type) =>
        state.addNode(type, {
          source: String(node.source ?? node.value ?? ''),
          ...Object.fromEntries(Object.keys(extraAttrs).map((key) => [key, String(node[key] ?? '')])),
        }),
    },
    toMarkdown: {
      match: (node) => node.type.name === name,
      runner: (state, node) => state.addNode(markdownType, undefined, String(node.attrs.source), { ...node.attrs }),
    },
  }));
}

export const cherryTocSchema = leafSchema('cherry_toc', 'cherryToc');
export const cherryFrontmatterSchema = leafSchema('cherry_frontmatter', 'cherryFrontmatter');
export const cherryCommentDefinitionSchema = leafSchema('cherry_comment_definition', 'cherryCommentDefinition', false, {
  label: sourceAttr(),
  url: sourceAttr(),
  title: sourceAttr(),
});
export const cherryDiagramSchema = leafSchema('cherry_diagram', 'cherryDiagram', false, {
  diagramType: sourceAttr(),
  value: sourceAttr(),
});
export const cherryNativeBlockSchema = leafSchema('cherry_native_block', 'cherryNativeBlock');
export const cherryHtmlBlockSchema = leafSchema('cherry_html_block', 'cherryHtmlBlock');
export const cherryHtmlInlineSchema = leafSchema('cherry_html_inline', 'cherryHtmlInline', true);
export const cherryEmojiSchema = leafSchema('cherry_emoji', 'cherryEmoji', true);
export const cherryLinkTargetSchema = leafSchema('cherry_link_target', 'cherryLinkTarget', true, {
  target: sourceAttr(),
});

/** Cherry's footnote reference DOM is a numbered link, not Milkdown's plain
 * `sup[data-type="footnote_reference"]`. Keeping it as an atom preserves the
 * native visual contract while still allowing the surrounding heading text to
 * remain editable. */
export const cherryFootnoteReferenceSchema = $nodeSchema('cherry_footnote_reference', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  attrs: {
    label: sourceAttr(),
    number: { default: 0, validate: 'number' as const },
  },
  parseDOM: [
    {
      tag: 'sup.cherry-footnote-number',
      getAttrs: (dom: HTMLElement) => {
        const link = dom.querySelector('a');
        return {
          label: link?.getAttribute('data-key') ?? dom.dataset.label ?? '',
          number: Number(link?.getAttribute('data-index') ?? dom.dataset.number ?? 0),
        };
      },
    },
  ],
  toDOM: (node) => {
    const label = String(node.attrs.label ?? '');
    const number = Number(node.attrs.number ?? 0);
    const href = `#fn:${number}`;
    return [
      'sup',
      { class: 'cherry-footnote-number', 'data-label': label, 'data-number': String(number) },
      [
        'a',
        {
          href,
          id: `fnref:${number}`,
          title: label,
          'data-index': String(number),
          'data-key': label,
          class: 'footnote',
          contenteditable: 'false',
        },
        `[${number}]`,
      ],
    ];
  },
  parseMarkdown: {
    match: (node) => node.type === 'cherryFootnoteReference',
    runner: (state, node, type) =>
      state.addNode(type, {
        label: String(node.label ?? ''),
        number: Number(node.number ?? 0),
      }),
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cherry_footnote_reference',
    runner: (state, node) =>
      state.addNode('footnoteReference', undefined, undefined, {
        label: String(node.attrs.label ?? ''),
        identifier: String(node.attrs.label ?? ''),
      }),
  },
}));
