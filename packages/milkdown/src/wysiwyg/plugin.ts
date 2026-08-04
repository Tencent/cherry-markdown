import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import { $remark } from '@milkdown/kit/utils';
import { cherryWysiwygMarkInputRules, cherryWysiwygMarkSchemas } from './marks.js';
import {
  cherryVisualBlockSchema,
  cherryVisualBlockView,
  cherryVisualInlineSchema,
  cherryVisualInlineView,
  cherryTocRefreshPlugin,
  cherryWysiwygConfigCtx,
} from './nodes.js';
import { transformCherryWysiwygTree, type MarkdownNode } from './transform.js';

const cherryWysiwygRemark = $remark('cherryWysiwygRemark', () => () => (tree, file) => {
  transformCherryWysiwygTree(tree as MarkdownNode, String(file.value));
});

export const cherryWysiwyg: MilkdownPlugin[] = [
  cherryWysiwygConfigCtx,
  ...cherryWysiwygMarkSchemas,
  ...cherryWysiwygMarkInputRules,
  cherryVisualBlockSchema,
  cherryVisualInlineSchema,
  cherryVisualBlockView,
  cherryVisualInlineView,
  cherryTocRefreshPlugin,
  ...cherryWysiwygRemark,
];
