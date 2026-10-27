import { parseDocument } from 'htmlparser2';
import { decodeHTML } from 'entities';
import { isValidSemanticUrl } from '../shared/engine';
import type {
  MiniProgramBlock,
  MiniProgramInline,
  MiniProgramTransformOptions,
  MiniProgramListItem,
  MiniProgramTableRow,
  MiniProgramTableCell,
} from '../types';

interface Event {
  kind: string;
  data: Record<string, unknown>;
}
interface Branch extends Event {
  children: Tree[];
}
type Tree = string | Branch;
const references = /\uE000([oca])(\d+)\uE001/g;
const string = (value: unknown): string => (typeof value === 'string' ? value : '');
const numeric = (value: unknown, fallback = 0): number => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const inlineKinds = new Set([
  'strong',
  'em',
  'code',
  'inline_code',
  'underline',
  'strikethrough',
  'sub',
  'sup',
  'span',
  'link',
  'image',
  'math_inline',
  'cursor',
  'ruby',
  'task_marker',
  'break',
  'mark',
]);

export interface SemanticSegment {
  lines: number;
  blocks: MiniProgramBlock[];
  headings: string[];
}
export interface SemanticResult {
  blocks: MiniProgramBlock[];
  segments: SemanticSegment[];
  documentDependent: boolean;
  checkpointBlocked: boolean;
}

/** A tree writer, not an HTML serializer. References survive Cherry's existing hook/cache pipeline. */
export class SemanticWriter {
  private documentDependent = false;
  private checkpointBlocked = false;

  invalidateDocument(_reason: string): void {
    this.documentDependent = true;
  }

  private readonly events: Event[] = [];
  private readonly headingCounts: Map<string, number>;
  private headings: Branch[] = [];
  private readonly headingBases = new Map<string, string>();

  constructor(
    private readonly restore: (value: string) => string,
    private readonly options: MiniProgramTransformOptions = {},
    headings: ReadonlyMap<string, number> = new Map(),
  ) {
    this.headingCounts = new Map(headings);
  }

  wrap(kind: string, data: Record<string, unknown>, content: string): string {
    if (kind === 'heading' && data.autoId) data = { ...data, headingBase: this.headingBases.get(string(data.id)) };
    const id = this.events.push({ kind, data }) - 1;
    return `\uE000o${id}\uE001${content}\uE000c${id}\uE001`;
  }

  atom(kind: string, data: Record<string, unknown>): string {
    // Literal payloads bypass the engine's final token-string replacement. Keep its cursor
    // out of code/math source and emit a native cursor beside the atomic node instead.
    const cursor = this.options.forceNoCursor === false && /CHERRYFLOWSESSIONCURSOR/.test(string(data.text));
    if (cursor) {
      const clean = (value: string) => value.replace(/CHERRYFLOWSESSIONCURSOR/g, '');
      data = {
        ...data,
        text: clean(string(data.text)),
        ...(Array.isArray(data.tokens)
          ? { tokens: data.tokens.map((token) => ({ ...token, text: clean(string(token.text)) })) }
          : {}),
      };
    }
    const reference = `\uE000a${this.events.push({ kind, data }) - 1}\uE001`;
    return cursor ? reference + this.atom('cursor', {}) : reference;
  }

  headingId(base: string): string {
    const count = (this.headingCounts.get(base) || 0) + 1;
    this.headingCounts.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    this.headingBases.set(id, base);
    return id;
  }

  private trees(content: string): Tree[] {
    const root: Branch = { kind: 'root', data: {}, children: [] };
    const stack = [{ id: -1, node: root }];
    const closed = new Set<number>();
    let offset = 0;
    for (const match of content.matchAll(references)) {
      const current = stack[stack.length - 1].node;
      if (match.index > offset) current.children.push(content.slice(offset, match.index));
      const id = Number(match[2]);
      const event = this.events[id];
      if (!event) throw new Error('Unknown Cherry semantic reference');
      if (match[1] === 'c') {
        if (closed.delete(id)) {
          offset = match.index + match[0].length;
          continue;
        }
        const target = stack.findIndex((frame) => frame.id === id);
        if (target < 1) throw new Error('Unbalanced Cherry semantic references');
        // Paragraphs inserted by Cherry may cross explicit source-HTML block boundaries.
        // Close the paragraph scope at the block boundary without parsing/rebuilding HTML.
        for (let index = stack.length - 1; index > target; index--) closed.add(stack[index].id);
        stack.length = target;
      } else {
        if (!inlineKinds.has(event.kind) && event.kind !== 'root') {
          const paragraph = stack.findIndex((frame) => frame.node.kind === 'paragraph');
          if (paragraph >= 1) {
            for (let index = stack.length - 1; index >= paragraph; index--) closed.add(stack[index].id);
            stack.length = paragraph;
          }
        }
        const branch: Branch = { ...event, children: [] };
        stack[stack.length - 1].node.children.push(branch);
        if (match[1] === 'o') stack.push({ id, node: branch });
      }
      offset = match.index + match[0].length;
    }
    if (offset < content.length) stack[stack.length - 1].node.children.push(content.slice(offset));
    if (stack.length !== 1) throw new Error('Unclosed Cherry semantic references');
    return root.children;
  }

  private decode(value: string): string {
    return decodeHTML(this.restore(value));
  }

  text(content: string): string {
    const plain = (nodes: Tree[]): string =>
      nodes
        .map((node) =>
          typeof node === 'string'
            ? this.decode(node)
            : (node.kind === 'inline_code' ? this.restore(string(node.data.text)) : string(node.data.text)) ||
              plain(node.children),
        )
        .join('');
    return plain(this.trees(content));
  }

  isInLink(content: string, offset: number): boolean {
    let depth = 0;
    for (const match of content.slice(0, offset).matchAll(references)) {
      if (this.events[Number(match[2])]?.kind === 'link') depth += match[1] === 'o' ? 1 : match[1] === 'c' ? -1 : 0;
    }
    return depth > 0;
  }

  /** Parse only explicit source HTML. Ordinary Markdown never goes through an HTML parser. */
  sourceHtml(source: string): string {
    if (!source.includes('<')) return source;
    const protectedLinks: string[] = [];
    let linkPrefix = 'CHERRYSOURCELINK';
    while (source.includes(linkPrefix)) linkPrefix += 'X';
    const protectedSource = source.replace(
      /<(?:[a-z][a-z0-9+.-]{1,31}:\/\/[^<> `]+|mailto:[^<> `]+|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/gi,
      (link) => {
        protectedLinks.push(link);
        return `${linkPrefix}${protectedLinks.length - 1}END`;
      },
    );
    type HtmlNode = ReturnType<typeof parseDocument>['children'][number];
    const visit = (node: HtmlNode): string => {
      if (node.type === 'text')
        return node.data
          .replace(/&/g, '&amp;')
          .replace(/\uE000/g, '&#57344;')
          .replace(/\uE001/g, '&#57345;');
      if (node.type === 'script' || node.type === 'style' || node.type === 'comment') return '';
      if (!('name' in node) || !('attribs' in node)) return 'children' in node ? node.children.map(visit).join('') : '';
      this.invalidateDocument('source-html');
      const attrs = Object.fromEntries(Object.entries(node.attribs).filter(([name]) => !/^on/i.test(name)));
      const content = node.children.map(visit).join('');
      const tags: Record<string, string> = {
        b: 'strong',
        i: 'em',
        del: 'strikethrough',
        s: 'strikethrough',
        u: 'underline',
        a: 'link',
        img: 'image',
        br: 'break',
        hr: 'thematic_break',
        p: 'paragraph',
        div: 'container',
        ul: 'list',
        ol: 'list',
        li: 'list_item',
        table: 'table',
        thead: 'table_head',
        tbody: 'container',
        tr: 'table_row',
        th: 'table_cell',
        td: 'table_cell',
      };
      const kind = tags[node.name] || (inlineKinds.has(node.name) ? node.name : '');
      if (!kind) {
        if (this.options.unknownTag === 'unwrap') return content;
        if (this.options.unknownTag === 'drop') return '';
        return this.wrap('unsupported', { tag: node.name }, content);
      }
      const data = {
        decoded: true,
        attrs,
        href: attrs.href || '',
        src: attrs.src || '',
        alt: attrs.alt || '',
        ordered: node.name === 'ol',
        start: attrs.start || '1',
        header: node.name === 'th',
        align: attrs.align || '',
        classicBr: true,
      };
      if (kind === 'image' || kind === 'break' || kind === 'thematic_break') return this.atom(kind, data);
      return this.wrap(kind, data, content);
    };
    return parseDocument(protectedSource)
      .children.map(visit)
      .join('')
      .replace(new RegExp(`${linkPrefix}(\\d+)END`, 'g'), (_, index) => protectedLinks[Number(index)]);
  }

  protectUnclosed(source: string, begin: RegExp | string, complete: RegExp): void {
    const remaining = source.replace(new RegExp(complete.source, complete.flags), '');
    const opener = typeof begin === 'string' ? new RegExp(begin) : new RegExp(begin.source, begin.flags);
    this.checkpointBlocked ||= opener.test(remaining);
  }

  private inlines(nodes: Tree[], classicBr = true): MiniProgramInline[] {
    return nodes.flatMap((node): MiniProgramInline[] => {
      if (typeof node === 'string') {
        const text = decodeHTML(node);
        if (classicBr || !text.includes('\n')) return text ? [{ type: 'text', text }] : [];
        return text
          .split('\n')
          .flatMap((part, index): MiniProgramInline[] => [
            ...(index ? [{ type: 'break' } as const] : []),
            ...(part ? [{ type: 'text', text: part } as const] : []),
          ]);
      }
      const { kind, data } = node;
      if (kind === 'task_marker') return [];
      if (kind === 'inline_code')
        return [{ type: 'code', attrs: {}, children: [{ type: 'text', text: this.restore(string(data.text)) }] }];
      if (kind === 'math_inline') return [{ type: 'math_inline', text: this.restore(string(data.text)), attrs: {} }];
      if (kind === 'cursor') return [{ type: 'cursor' }];
      if (kind === 'break') return [{ type: 'break' }];
      if (kind === 'image') {
        const src = data.decoded ? this.restore(string(data.src)) : this.decode(string(data.src));
        const alt = data.decoded ? this.restore(string(data.alt)) : this.decode(string(data.alt));
        return src && isValidSemanticUrl(src, true)
          ? [{ type: 'image', src, alt, title: '', attrs: { src, alt } }]
          : [];
      }
      if (kind === 'link')
        return [
          {
            type: 'link',
            href: isValidSemanticUrl(this.decode(string(data.href)))
              ? data.decoded
                ? this.restore(string(data.href))
                : this.decode(string(data.href))
              : '',
            attrs: {},
            children: this.inlines(node.children, classicBr),
          },
        ];
      if (kind === 'ruby')
        return [
          {
            type: 'ruby',
            annotation: this.restore(string(data.ruby)),
            children: this.inlines(node.children, classicBr),
          },
        ];
      const children = this.inlines(node.children, classicBr);
      if (['strong', 'em', 'code', 'underline', 'strikethrough', 'sub', 'sup', 'span', 'mark'].includes(kind)) {
        return [
          {
            type: kind as 'strong' | 'em' | 'code' | 'underline' | 'strikethrough' | 'sub' | 'sup' | 'span' | 'mark',
            attrs: (data.attrs || {}) as Record<string, string>,
            children,
          },
        ];
      }
      return children;
    });
  }

  private row(node: Branch): MiniProgramTableRow {
    return {
      type: 'table_row',
      children: node.children.flatMap((cell): MiniProgramTableCell[] =>
        typeof cell === 'string' || cell.kind !== 'table_cell'
          ? []
          : [
              {
                type: 'table_cell',
                header: Boolean(cell.data.header),
                align: (string(cell.data.align) as 'left' | 'center' | 'right') || undefined,
                children: this.inlines(cell.children),
              },
            ],
      ),
    };
  }

  private finalText(nodes: Tree[]): string {
    return nodes
      .map((node): string => {
        if (typeof node === 'string') return decodeHTML(node);
        if (node.kind === 'code_block') return string(node.data.text);
        if (node.kind === 'break') return '\n';
        if (typeof node.data.text === 'string') return this.restore(node.data.text);
        if (node.kind === 'image') return this.decode(string(node.data.alt));
        return this.finalText(node.children);
      })
      .join('');
  }

  private block(node: Branch): MiniProgramBlock[] {
    const { kind, data, children } = node;
    if (kind === 'frontmatter') return [];
    if (kind === 'paragraph' || kind === 'container') {
      if (children.some((child) => typeof child !== 'string' && !inlineKinds.has(child.kind)))
        return this.blocks(children);
      const inlines = this.inlines(children, data.classicBr !== false);
      if (inlines.length === 1 && inlines[0].type === 'image') return [inlines[0]];
      return inlines.length ? [{ type: 'paragraph', attrs: {}, children: inlines }] : [];
    }
    if (kind === 'panel')
      return [
        { type: 'panel', kind: string(data.panelType), title: string(data.title), children: this.blocks(children) },
      ];
    if (kind === 'detail')
      return [{ type: 'detail', title: string(data.title), open: Boolean(data.open), children: this.blocks(children) }];
    if (kind === 'heading')
      return [
        {
          type: 'heading',
          level: numeric(data.level, 1),
          attrs: { id: string(data.id) },
          children: this.inlines(children),
        },
      ];
    if (kind === 'blockquote') return [{ type: 'blockquote', children: this.blocks(children) }];
    if (kind === 'list') {
      const items = children.flatMap((item): MiniProgramListItem[] => {
        if (typeof item === 'string' || item.kind !== 'list_item') return [];
        let checked: boolean | undefined;
        const strip = (nodes: Tree[]): Tree[] =>
          nodes.flatMap((child): Tree[] => {
            if (typeof child !== 'string' && child.kind === 'task_marker') {
              checked = Boolean(child.data.checked);
              return [];
            }
            return [
              typeof child === 'string'
                ? child
                : { ...child, children: child.kind === 'list' ? child.children : strip(child.children) },
            ];
          });
        const body = this.blocks(strip(item.children));
        if (checked !== undefined && body[0]?.type === 'paragraph' && body[0].children[0]?.type === 'text')
          body[0].children[0].text = body[0].children[0].text.replace(/^\s+/, '');
        return [{ type: 'list_item', ...(checked === undefined ? {} : { checked }), children: body }];
      });
      return [
        { type: 'list', ordered: Boolean(data.ordered), attrs: { start: String(data.start || 1) }, children: items },
      ];
    }
    if (kind === 'table') {
      const head = children.filter(
        (child): child is Branch => typeof child !== 'string' && child.kind === 'table_head',
      );
      const rows = children.filter((child): child is Branch => typeof child !== 'string' && child.kind === 'table_row');
      return [
        {
          type: 'table',
          ...(data.chart ? { chart: data.chart as Record<string, unknown> } : {}),
          header: head.flatMap((section) =>
            section.children
              .filter((child): child is Branch => typeof child !== 'string' && child.kind === 'table_row')
              .map((row) => this.row(row)),
          ),
          rows: rows.map((row) => this.row(row)),
        },
      ];
    }
    if (kind === 'code_block') {
      const lang = string(data.lang) || 'text';
      const text = string(data.text);
      if (lang === 'mermaid') return [{ type: 'diagram', kind: 'mermaid', text }];
      const tokens = Array.isArray(data.tokens) ? (data.tokens as Array<{ text: string; type: string }>) : [];
      return [{ type: 'code_block', lang, text, tokens }];
    }
    if (kind === 'math_block') return [{ type: 'math_block', text: this.restore(string(data.text)), display: true }];
    if (kind === 'image') return this.inlines([node]) as MiniProgramBlock[];
    if (kind === 'thematic_break') return [{ type: 'thematic_break' }];
    if (kind === 'unsupported')
      return [
        {
          type: 'unsupported',
          tag: string(data.tag),
          text: typeof data.text === 'string' ? this.restore(data.text) : this.finalText(children),
        },
      ];
    if (kind === 'blank')
      return data.text ? [{ type: 'paragraph', children: [{ type: 'text', text: string(data.text) }] }] : [];
    if (kind === 'toc')
      return [
        { type: 'paragraph', children: [{ type: 'text', text: '目录' }] },
        {
          type: 'list',
          ordered: false,
          children: this.headings.map((heading) => ({
            type: 'list_item',
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'link', href: `#${string(heading.data.id)}`, children: this.inlines(heading.children) },
                ],
              },
            ],
          })),
        },
      ];
    return this.blocks(children);
  }

  private blocks(nodes: Tree[]): MiniProgramBlock[] {
    const result: MiniProgramBlock[] = [];
    let inline: Tree[] = [];
    const flush = () => {
      if (inline.length) {
        const children = this.inlines(inline);
        if (children.some((node) => node.type !== 'text' || node.text.trim()))
          result.push({ type: 'paragraph', children });
        inline = [];
      }
    };
    for (const node of nodes) {
      if (typeof node === 'string' || inlineKinds.has(node.kind)) inline.push(node);
      else {
        flush();
        result.push(...this.block(node));
      }
    }
    flush();
    return result;
  }

  private segmentHeadings(node: Branch): string[] {
    return [
      ...(typeof node.data.headingBase === 'string' ? [node.data.headingBase] : []),
      ...node.children.flatMap((child) => (typeof child === 'string' ? [] : this.segmentHeadings(child))),
    ];
  }

  finish(content: string): SemanticResult {
    if (/<\/?[A-Za-z][^>]*>/.test(content))
      throw new Error(
        'A Cherry hook emitted HTML in semantic mode. Custom renderers must use semanticRenderer events.',
      );
    const trees = this.trees(content);
    const collect = (nodes: Tree[]) =>
      nodes.forEach((node) => {
        if (typeof node !== 'string') {
          if (node.kind === 'heading') this.headings.push(node);
          collect(node.children);
        }
      });
    collect(trees);
    const segments = trees.flatMap((node): SemanticSegment[] =>
      typeof node === 'string'
        ? node.trim()
          ? [{ lines: node.split('\n').length, blocks: this.blocks([node]), headings: [] }]
          : []
        : [{ lines: numeric(node.data.lines), blocks: this.block(node), headings: this.segmentHeadings(node) }],
    );
    return {
      blocks: segments.flatMap((segment) => segment.blocks),
      segments,
      documentDependent: this.documentDependent,
      checkpointBlocked: this.checkpointBlocked,
    };
  }
}
