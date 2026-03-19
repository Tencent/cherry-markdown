/**
 * Milkdown mark plugin for Cherry highlight syntax: ==text==
 * Renders as <mark> in the WYSIWYG editor
 */
import { $markSchema, $command, $inputRule, $remark } from '@milkdown/kit/utils';
import { markRule } from '@milkdown/kit/prose';
import { toggleMark } from '@milkdown/kit/prose/commands';

const MARK_NAME = 'cherry_highlight';
const MDAST_TYPE = 'cherryHighlight';

function remarkCherryHighlight() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node, _, state, info) {
        const exit = state.enter(MDAST_TYPE);
        const tracker = state.createTracker(info);
        let value = tracker.move('==');
        value += state.containerPhrasing(node, {
          ...tracker.current(),
          before: value,
          after: '==',
        });
        value += tracker.move('==');
        exit();
        return value;
      },
    },
  });
}

export const remarkHighlightPlugin = $remark('remarkCherryHighlight', () => remarkCherryHighlight);

export const highlightSchema = $markSchema(MARK_NAME, () => ({
  parseDOM: [{ tag: 'mark' }],
  toDOM: () => ['mark', 0],
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === MARK_NAME,
    runner: (state, mark) => {
      state.withMark(mark, MDAST_TYPE);
    },
  },
}));

export const toggleHighlightCommand = $command('ToggleHighlight', (ctx) => () =>
  toggleMark(highlightSchema.type(ctx)),
);

export const highlightInputRule = $inputRule((ctx) =>
  markRule(/(?<!=)(==)([^\s=](?:[^=]*[^\s=])?)(==)(?!=)/, highlightSchema.type(ctx)),
);

export const highlight = [
  remarkHighlightPlugin,
  highlightSchema,
  toggleHighlightCommand,
  highlightInputRule,
].flat();
