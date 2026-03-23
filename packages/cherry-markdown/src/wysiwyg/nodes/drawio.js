/**
 * Milkdown node plugin for Cherry draw.io syntax:
 *   ![desc](data:image/png;base64,...){data-type=drawio data-xml=<mxfile>...</mxfile>}
 *
 * Renders as an editable image in the WYSIWYG editor.
 * Double-click opens the draw.io editor dialog for re-editing.
 *
 * Note: remark parses "![desc](base64url)" as an image node, and the trailing
 * "{data-type=drawio data-xml=...}" becomes a separate text node.
 * The remark plugin merges these into a single cherryDrawio MDAST node.
 */
import { $nodeSchema, $command, $remark, $view } from '@milkdown/kit/utils';
import { visit, SKIP } from 'unist-util-visit';
import { drawioDialog } from '@/utils/dialog';

const NODE_NAME = 'cherry_drawio';
const MDAST_TYPE = 'cherryDrawio';

// Module-level drawio config, injected by WysiwygEditor.init()
let _drawioConfig = { iframeUrl: '', iframeStyle: '' };

/**
 * Set draw.io configuration (called from WysiwygEditor before Crepe creation)
 * @param {{ iframeUrl: string, iframeStyle: string }} config
 */
export function setDrawioConfig(config) {
  _drawioConfig = { ..._drawioConfig, ...config };
}

// --- Remark plugin ---

function remarkCherryDrawio() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node) {
        return `![${node.desc || ''}](${node.base64}){data-type=drawio data-xml=${node.xmlData}}`;
      },
    },
  });

  return (tree) => {
    transformDrawioNodes(tree);
  };
}

/**
 * Scan paragraph children for image + text("{data-type=drawio ...}") patterns
 * and merge them into cherryDrawio MDAST nodes.
 */
function transformDrawioNodes(tree) {
  visit(tree, 'paragraph', (node) => {
    if (!node.children) return;

    const newChildren = [];
    let changed = false;
    let i = 0;

    while (i < node.children.length) {
      const child = node.children[i];
      const next = node.children[i + 1];

      // Case: image node followed by text starting with "{data-type=drawio"
      if (
        child.type === 'image' &&
        next &&
        next.type === 'text' &&
        /^\{data-type=drawio\s/.test(next.value)
      ) {
        const xmlMatch = next.value.match(/^\{data-type=drawio\s+data-xml=([^}]+)\}/);
        if (xmlMatch) {
          newChildren.push({
            type: MDAST_TYPE,
            desc: child.alt || '',
            base64: child.url || '',
            xmlData: xmlMatch[1],
          });
          // Preserve any text after the closing }
          const remaining = next.value.slice(xmlMatch[0].length);
          if (remaining) {
            newChildren.push({ type: 'text', value: remaining });
          }
          i += 2;
          changed = true;
          continue;
        }
      }

      newChildren.push(child);
      i++;
    }

    if (changed) {
      node.children = newChildren;
    }

    return SKIP;
  });
}

export const remarkDrawioPlugin = $remark('remarkCherryDrawio', () => remarkCherryDrawio);

// --- Node Schema ---

export const drawioSchema = $nodeSchema(NODE_NAME, () => ({
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    desc: { default: '' },
    base64: { default: '' },
    xmlData: { default: '' },
  },
  parseDOM: [
    {
      tag: 'img[data-type="drawio"]',
      getAttrs: (dom) => ({
        desc: dom.getAttribute('alt') || '',
        base64: dom.getAttribute('src') || '',
        xmlData: dom.getAttribute('data-xml') || '',
      }),
    },
  ],
  toDOM: (node) => [
    'img',
    {
      src: node.attrs.base64,
      alt: node.attrs.desc,
      'data-type': 'drawio',
      'data-xml': node.attrs.xmlData,
      style: 'max-width:100%;cursor:pointer;',
    },
  ],
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, node, type) => {
      state.addNode(type, { desc: node.desc, base64: node.base64, xmlData: node.xmlData });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === NODE_NAME,
    runner: (state, node) => {
      state.addNode(MDAST_TYPE, undefined, undefined, {
        desc: node.attrs.desc,
        base64: node.attrs.base64,
        xmlData: node.attrs.xmlData,
      });
    },
  },
}));

// --- Insert Command ---

export const insertDrawioCommand = $command('InsertDrawio', () => ({ desc, base64, xmlData } = {}) =>
  (state, dispatch) => {
    const drawioType = state.schema.nodes[NODE_NAME];
    if (!drawioType) return false;
    const node = drawioType.create({
      desc: desc || '',
      base64: base64 || '',
      xmlData: xmlData || '',
    });
    dispatch?.(state.tr.replaceSelectionWith(node));
    return true;
  },
);

// --- NodeView ---

function openDrawioEditor(node, view, getPos) {
  if (!_drawioConfig.iframeUrl) return;
  const pos = typeof getPos === 'function' ? getPos() : getPos;
  if (typeof pos !== 'number') return;

  let xmlData;
  try {
    xmlData = decodeURI(node.attrs.xmlData);
  } catch (e) {
    xmlData = node.attrs.xmlData;
  }

  drawioDialog(
    _drawioConfig.iframeUrl,
    _drawioConfig.iframeStyle,
    xmlData,
    (data) => {
      const { xmlData: newXml, base64: newBase64 } = data;
      const tr = view.state.tr.setNodeMarkup(pos, undefined, {
        desc: node.attrs.desc || 'draw.io',
        base64: newBase64,
        xmlData: encodeURI(newXml),
      });
      view.dispatch(tr);
    },
  );
}

export const drawioView = $view(drawioSchema.node, () => (initialNode, view, getPos) => {
  let node = initialNode;

  const dom = document.createElement('img');
  dom.className = 'cherry-drawio-node';
  dom.src = node.attrs.base64;
  dom.alt = node.attrs.desc;
  dom.setAttribute('data-type', 'drawio');
  dom.style.cssText = 'max-width:100%;cursor:pointer;border:2px solid transparent;transition:border-color 0.2s;';
  dom.title = 'Double-click to edit draw.io diagram';

  dom.addEventListener('mouseenter', () => {
    dom.style.borderColor = '#4d90fe';
  });
  dom.addEventListener('mouseleave', () => {
    dom.style.borderColor = 'transparent';
  });

  dom.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawioEditor(node, view, getPos);
  });

  return {
    dom,
    update(updatedNode) {
      if (updatedNode.type.name !== NODE_NAME) return false;
      node = updatedNode;
      dom.src = updatedNode.attrs.base64;
      dom.alt = updatedNode.attrs.desc;
      return true;
    },
    stopEvent() {
      return false;
    },
  };
});

// --- Export ---

export const drawio = [remarkDrawioPlugin, drawioSchema, insertDrawioCommand, drawioView].flat();
