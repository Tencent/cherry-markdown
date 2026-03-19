/**
 * Milkdown mark plugin for Cherry subscript syntax: ^^text^^
 * Renders as <sub> in the WYSIWYG editor
 */
import { $markSchema, $command, $inputRule, $remark } from '@milkdown/kit/utils';
import { markRule } from '@milkdown/kit/prose';
import { toggleMark } from '@milkdown/kit/prose/commands';

const MARK_NAME = 'cherry_subscript';
const MDAST_TYPE = 'cherrySubscript';

function remarkCherrySubscript() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node, _, state, info) {
        const exit = state.enter(MDAST_TYPE);
        const tracker = state.createTracker(info);
        let value = tracker.move('^^');
        value += state.containerPhrasing(node, {
          ...tracker.current(),
          before: value,
          after: '^^',
        });
        value += tracker.move('^^');
        exit();
        return value;
      },
    },
  });
}

export const remarkSubscriptPlugin = $remark('remarkCherrySubscript', () => remarkCherrySubscript);

export const subscriptSchema = $markSchema(MARK_NAME, () => ({
  parseDOM: [{ tag: 'sub' }],
  toDOM: () => ['sub', 0],
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

export const toggleSubscriptCommand = $command('ToggleSubscript', (ctx) => () =>
  toggleMark(subscriptSchema.type(ctx)),
);

export const subscriptInputRule = $inputRule((ctx) =>
  markRule(/(?<!\^)(\^\^)([^\s^](?:[^^]*[^\s^])?)(\^\^)(?!\^)/, subscriptSchema.type(ctx)),
);

export const subscript = [
  remarkSubscriptPlugin,
  subscriptSchema,
  toggleSubscriptCommand,
  subscriptInputRule,
].flat();
