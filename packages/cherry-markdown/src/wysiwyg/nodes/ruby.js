/**
 * Milkdown node plugin for Cherry ruby/pinyin syntax: { text | annotation }
 * Renders as <ruby>text<rt>annotation</rt></ruby> in the WYSIWYG editor
 */
import { $nodeSchema, $command, $remark, $view } from '@milkdown/kit/utils';
import { transformCherryMarks } from '../marks/utils';

const NODE_NAME = 'cherry_ruby';
const MDAST_TYPE = 'cherryRuby';

// Match { text | annotation } with surrounding spaces/boundaries
const PARSE_PATTERN = /(?:^| )\{([^\n{}]+?)\|([^\n{}]+?)\}(?:$| )/g;

function remarkCherryRuby() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node) {
        return ` { ${node.text} | ${node.annotation} } `;
      },
    },
  });

  return (tree) => {
    transformCherryMarks(tree, PARSE_PATTERN, (match) => ({
      type: MDAST_TYPE,
      text: match[1].trim(),
      annotation: match[2].trim(),
    }));
  };
}

export const remarkRubyPlugin = $remark('remarkCherryRuby', () => remarkCherryRuby);

export const rubySchema = $nodeSchema(NODE_NAME, () => ({
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    text: { default: '' },
    annotation: { default: '' },
  },
  parseDOM: [
    {
      tag: 'ruby',
      getAttrs: (dom) => ({
        text: dom.firstChild?.textContent || '',
        annotation: dom.querySelector('rt')?.textContent || '',
      }),
    },
  ],
  toDOM: (node) => ['ruby', {}, node.attrs.text, ['rt', {}, node.attrs.annotation]],
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, node, type) => {
      state.addNode(type, { text: node.text, annotation: node.annotation });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === NODE_NAME,
    runner: (state, node) => {
      state.addNode(MDAST_TYPE, undefined, undefined, {
        text: node.attrs.text,
        annotation: node.attrs.annotation,
      });
    },
  },
}));

export const insertRubyCommand = $command('InsertRuby', (ctx) => ({ text, annotation } = {}) =>
  (state, dispatch) => {
    const rubyType = state.schema.nodes[NODE_NAME];
    if (!rubyType) return false;
    const node = rubyType.create({ text: text || '', annotation: annotation || '' });
    dispatch?.(state.tr.replaceSelectionWith(node));
    return true;
  },
);

/**
 * 创建 Ruby 编辑弹窗
 */
function createRubyEditor(node, view, getPos) {
  const pos = typeof getPos === 'function' ? getPos() : getPos;

  const overlay = document.createElement('div');
  overlay.className = 'cherry-ruby-editor-overlay';

  const editor = document.createElement('div');
  editor.className = 'cherry-ruby-editor';

  const textLabel = document.createElement('label');
  textLabel.textContent = '文本';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.value = node.attrs.text;
  textInput.className = 'cherry-ruby-editor-input';

  const annoLabel = document.createElement('label');
  annoLabel.textContent = '注音';
  const annoInput = document.createElement('input');
  annoInput.type = 'text';
  annoInput.value = node.attrs.annotation;
  annoInput.className = 'cherry-ruby-editor-input';

  const btnRow = document.createElement('div');
  btnRow.className = 'cherry-ruby-editor-buttons';
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '确定';
  saveBtn.className = 'cherry-ruby-editor-btn cherry-ruby-editor-btn--save';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.className = 'cherry-ruby-editor-btn';

  btnRow.append(cancelBtn, saveBtn);
  editor.append(textLabel, textInput, annoLabel, annoInput, btnRow);
  overlay.append(editor);

  const close = () => overlay.remove();

  saveBtn.addEventListener('click', () => {
    const newText = textInput.value.trim();
    const newAnno = annoInput.value.trim();
    if (newText && newAnno && typeof pos === 'number') {
      const tr = view.state.tr.setNodeMarkup(pos, undefined, { text: newText, annotation: newAnno });
      view.dispatch(tr);
    }
    close();
    view.focus();
  });

  cancelBtn.addEventListener('click', () => {
    close();
    view.focus();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
      view.focus();
    }
  });

  // Enter 确认, Escape 取消
  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      view.focus();
    }
  };
  textInput.addEventListener('keydown', handleKey);
  annoInput.addEventListener('keydown', handleKey);

  document.body.appendChild(overlay);
  annoInput.focus();
  annoInput.select();
}

export const rubyView = $view(rubySchema.node, () => (node, view, getPos) => {
  const dom = document.createElement('ruby');
  dom.className = 'cherry-ruby-node';
  const textNode = document.createTextNode(node.attrs.text);
  const rt = document.createElement('rt');
  rt.textContent = node.attrs.annotation;
  dom.append(textNode, rt);

  dom.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createRubyEditor(node, view, getPos);
  });

  return {
    dom,
    update(updatedNode) {
      if (updatedNode.type.name !== NODE_NAME) return false;
      node = updatedNode;
      textNode.textContent = updatedNode.attrs.text;
      rt.textContent = updatedNode.attrs.annotation;
      return true;
    },
    stopEvent() {
      return false;
    },
  };
});

export const ruby = [remarkRubyPlugin, rubySchema, insertRubyCommand, rubyView].flat();
