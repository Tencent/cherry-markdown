import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import type { RemarkPluginRaw } from '@milkdown/kit/transformer';
import { $remark } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import { cherryMath } from './math.js';
import { cherryWysiwygMarkInputRules, cherryWysiwygMarkSchemas } from './marks.js';
import { cherryStructureSchemas, cherryStructureViews } from './nodes.js';
import { transformCherryWysiwygTree, type MarkdownNode } from './transform.js';
import { cherryToolbar } from './toolbar.js';

interface MarkdownState {
  containerFlow(node: MarkdownNode, info: unknown): string;
  containerPhrasing(node: MarkdownNode, info: unknown): string;
}

function markHandler(open: (node: MarkdownNode) => string, close: string) {
  return (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) =>
    `${open(node)}${node.value ?? state.containerPhrasing(node, info)}${close}`;
}

function normalize(value: string) {
  return value.replace(/\r\n/g, '\n').trim();
}

const customMarkdownPlugin: RemarkPluginRaw<unknown> = function customMarkdownPlugin() {
  const data = this.data();
  const extensions = (data.toMarkdownExtensions ??= []) as Array<Record<string, unknown>>;
  extensions.push({
    handlers: {
      break: () => '  \n',
      cherryToc: (node: MarkdownNode) => String(node.source ?? '[[toc]]'),
      cherryFrontmatter: (node: MarkdownNode) => String(node.source ?? '---\n---'),
      cherryCommentDefinition: (node: MarkdownNode) => String(node.source ?? ''),
      cherryDiagram: (node: MarkdownNode) => String(node.source ?? ''),
      cherryTableChart: (node: MarkdownNode) => String(node.source ?? ''),
      cherryNativeBlock: (node: MarkdownNode) => String(node.source ?? ''),
      cherryHtmlBlock: (node: MarkdownNode) => String(node.source ?? node.value ?? ''),
      cherryHtmlInline: (node: MarkdownNode) => String(node.source ?? node.value ?? ''),
      cherryEmoji: (node: MarkdownNode) => String(node.source ?? node.value ?? ''),
      cherryLinkTarget: (node: MarkdownNode) => String(node.source ?? ''),
      cherry_background_color: markHandler((node) => `!!!${String(node.color ?? '')} `, '!!!'),
      cherry_color: markHandler((node) => `!!${String(node.color ?? '')} `, '!!'),
      cherry_font_size: markHandler((node) => `!${String(node.size ?? '')} `, '!'),
      cherry_subscript: markHandler(() => '^^', '^^'),
      cherry_superscript: markHandler(() => '^', '^'),
      cherry_ruby: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) =>
        `{${node.value ?? state.containerPhrasing(node, info)}|${String(node.annotation ?? '')}}`,
      cherry_underline: markHandler(() => '/', '/'),
      cherry_highlight: markHandler(() => '==', '=='),
      cherryCompoundItem: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) => {
        const body = state.containerFlow(node, info).trim();
        const role = String(node.role ?? '');
        const label = String(node.label ?? '');
        if (role === 'column') return body;
        if (role === 'detail-item') return `${node.open ? '++-' : '++'} ${label}\n${body}`.trim();
        return `:: ${label}\n${body}`.trim();
      },
      cherryPanel: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) => {
        const body = state.containerFlow(node, info).trim();
        const source = String(node.source ?? '');
        const originalBody = String(node.originalBody ?? '');
        if (source && normalize(body) === normalize(originalBody)) return source;
        const type = String(node.rawType || node.kind || 'panel');
        const title = String(node.title ?? '');
        return `:::${type}${title ? ` ${title}` : ''}\n${body}\n:::`;
      },
      cherryDetail: (node: MarkdownNode, _parent: MarkdownNode, state: MarkdownState, info: unknown) => {
        const body = state.containerFlow(node, info).trim();
        const first = body.replace(/^\+\+(-?)\s+/, '+++$1 ');
        return `${first}\n+++`;
      },
    },
  });
  return (tree, file) => {
    const parse = (source: string, options?: { supplementalDefinitions?: boolean }) => {
      const parsed = this.parse(source) as MarkdownNode;
      transformCherryWysiwygTree(parsed, source, parse, options);
      return parsed.children ?? [];
    };
    transformCherryWysiwygTree(tree as MarkdownNode, String(file.value), parse);
  };
};

const cherryWysiwygRemark = $remark('cherryWysiwygRemark', () => customMarkdownPlugin);

export const cherryWysiwyg: MilkdownPlugin[] = [
  cherryWysiwygConfigCtx,
  ...cherryWysiwygMarkSchemas,
  ...cherryWysiwygMarkInputRules,
  ...cherryMath,
  ...cherryStructureSchemas,
  ...cherryStructureViews,
  cherryToolbar,
  ...cherryWysiwygRemark,
].flat();
