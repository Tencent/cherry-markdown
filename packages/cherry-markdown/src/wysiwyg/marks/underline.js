/**
 * Milkdown mark plugin for Cherry underline syntax: /text/
 * Renders as <u> in the WYSIWYG editor
 */
import { $markSchema, $command, $remark } from '@milkdown/kit/utils';
import { toggleMark } from '@milkdown/kit/prose/commands';

const MARK_NAME = 'cherry_underline';
const MDAST_TYPE = 'cherryUnderline';

function remarkCherryUnderline() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node, _, state, info) {
        const exit = state.enter(MDAST_TYPE);
        const tracker = state.createTracker(info);
        let value = tracker.move(' /');
        value += state.containerPhrasing(node, {
          ...tracker.current(),
          before: value,
          after: '/',
        });
        value += tracker.move('/ ');
        exit();
        return value;
      },
    },
  });
}

export const remarkUnderlinePlugin = $remark('remarkCherryUnderline', () => remarkCherryUnderline);

export const underlineSchema = $markSchema(MARK_NAME, () => ({
  parseDOM: [
    { tag: 'u' },
    {
      style: 'text-decoration',
      getAttrs: (value) => value === 'underline',
    },
  ],
  toDOM: () => ['u', 0],
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

export const toggleUnderlineCommand = $command('ToggleUnderline', (ctx) => () =>
  toggleMark(underlineSchema.type(ctx)),
);

export const underline = [remarkUnderlinePlugin, underlineSchema, toggleUnderlineCommand].flat();
