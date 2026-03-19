/**
 * Milkdown mark plugin for Cherry font size syntax: !24 text!
 * Renders as <span style="font-size:24px;line-height:1em;"> in the WYSIWYG editor
 */
import { $markSchema, $command, $remark } from '@milkdown/kit/utils';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { transformCherryMarks } from './utils';

const MARK_NAME = 'cherry_fontsize';
const MDAST_TYPE = 'cherryFontSize';

// Regex: match !size text! (1 exclamation mark, not 2)
// After fontColor transform has run, remaining ! patterns are fontSize only
// The size must be 1-2 digits followed by space
const PARSE_PATTERN = /!(\d{1,2})\s([\s\S]+?)!/g;

function remarkCherryFontSize() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node, _, state, info) {
        const exit = state.enter(MDAST_TYPE);
        const tracker = state.createTracker(info);
        let value = tracker.move(`!${node.size} `);
        value += state.containerPhrasing(node, {
          ...tracker.current(),
          before: value,
          after: '!',
        });
        value += tracker.move('!');
        exit();
        return value;
      },
    },
  });

  // Tree transform: parse !size text! in text nodes
  return (tree) => {
    transformCherryMarks(tree, PARSE_PATTERN, (match) => ({
      type: MDAST_TYPE,
      size: match[1],
      children: [{ type: 'text', value: match[2] }],
    }));
  };
}

export const remarkFontSizePlugin = $remark('remarkCherryFontSize', () => remarkCherryFontSize);

export const fontSizeSchema = $markSchema(MARK_NAME, () => ({
  attrs: { size: { default: '17' } },
  parseDOM: [
    {
      style: 'font-size',
      getAttrs: (value) => {
        const match = value?.match(/^(\d+)px/);
        return match ? { size: match[1] } : false;
      },
    },
  ],
  toDOM: (mark) => ['span', { style: `font-size:${mark.attrs.size}px;line-height:1em;` }, 0],
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, node, markType) => {
      state.openMark(markType, { size: node.size });
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === MARK_NAME,
    runner: (state, mark) => {
      state.withMark(mark, MDAST_TYPE, undefined, {
        size: mark.attrs.size,
      });
    },
  },
}));

export const toggleFontSizeCommand = $command('ToggleFontSize', (ctx) => (size) =>
  toggleMark(fontSizeSchema.type(ctx), size ? { size } : undefined),
);

export const fontSize = [remarkFontSizePlugin, fontSizeSchema, toggleFontSizeCommand].flat();
