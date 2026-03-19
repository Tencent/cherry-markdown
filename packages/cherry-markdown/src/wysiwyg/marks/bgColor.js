/**
 * Milkdown mark plugin for Cherry background color syntax: !!!#ff0000 text!!!
 * Renders as <span style="background-color:..."> in the WYSIWYG editor
 */
import { $markSchema, $command, $remark } from '@milkdown/kit/utils';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { transformCherryMarks } from './utils';

const MARK_NAME = 'cherry_bgcolor';
const MDAST_TYPE = 'cherryBgColor';

// Regex: match !!!color text!!! (3 exclamation marks)
const PARSE_PATTERN = /!!!(#[0-9a-zA-Z]{3,6}|[a-z]{3,10})\s([\s\S]+?)!!!/g;

function remarkCherryBgColor() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node, _, state, info) {
        const exit = state.enter(MDAST_TYPE);
        const tracker = state.createTracker(info);
        let value = tracker.move(`!!!${node.color} `);
        value += state.containerPhrasing(node, {
          ...tracker.current(),
          before: value,
          after: '!!!',
        });
        value += tracker.move('!!!');
        exit();
        return value;
      },
    },
  });

  // Tree transform: parse !!!color text!!! in text nodes
  return (tree) => {
    transformCherryMarks(tree, PARSE_PATTERN, (match) => ({
      type: MDAST_TYPE,
      color: match[1],
      children: [{ type: 'text', value: match[2] }],
    }));
  };
}

export const remarkBgColorPlugin = $remark('remarkCherryBgColor', () => remarkCherryBgColor);

export const bgColorSchema = $markSchema(MARK_NAME, () => ({
  attrs: { color: { default: '#ff0000' } },
  parseDOM: [
    {
      style: 'background-color',
      getAttrs: (value) => (value ? { color: value } : false),
    },
  ],
  toDOM: (mark) => ['span', { style: `background-color:${mark.attrs.color}` }, 0],
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, node, markType) => {
      state.openMark(markType, { color: node.color });
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === MARK_NAME,
    runner: (state, mark) => {
      state.withMark(mark, MDAST_TYPE, undefined, {
        color: mark.attrs.color,
      });
    },
  },
}));

export const toggleBgColorCommand = $command('ToggleBgColor', (ctx) => (color) =>
  toggleMark(bgColorSchema.type(ctx), color ? { color } : undefined),
);

export const bgColor = [remarkBgColorPlugin, bgColorSchema, toggleBgColorCommand].flat();
