/**
 * Milkdown mark plugin for Cherry superscript syntax: ^text^
 * Renders as <sup> in the WYSIWYG editor
 */
import { $markSchema, $command, $inputRule, $remark } from '@milkdown/kit/utils';
import { markRule } from '@milkdown/kit/prose';
import { toggleMark } from '@milkdown/kit/prose/commands';

const MARK_NAME = 'cherry_superscript';
const MDAST_TYPE = 'cherrySuperscript';

function remarkCherrySuperscript() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node, _, state, info) {
        const exit = state.enter(MDAST_TYPE);
        const tracker = state.createTracker(info);
        let value = tracker.move('^');
        value += state.containerPhrasing(node, {
          ...tracker.current(),
          before: value,
          after: '^',
        });
        value += tracker.move('^');
        exit();
        return value;
      },
    },
  });
}

export const remarkSuperscriptPlugin = $remark('remarkCherrySuperscript', () => remarkCherrySuperscript);

export const superscriptSchema = $markSchema(MARK_NAME, () => ({
  parseDOM: [{ tag: 'sup' }],
  toDOM: () => ['sup', 0],
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

export const toggleSuperscriptCommand = $command('ToggleSuperscript', (ctx) => () =>
  toggleMark(superscriptSchema.type(ctx)),
);

export const superscriptInputRule = $inputRule((ctx) =>
  markRule(/(?<![\\^])(\^)([^\s^](?:[^^]*[^\s^])?)(\^)(?!\^)/, superscriptSchema.type(ctx)),
);

export const superscript = [
  remarkSuperscriptPlugin,
  superscriptSchema,
  toggleSuperscriptCommand,
  superscriptInputRule,
].flat();
