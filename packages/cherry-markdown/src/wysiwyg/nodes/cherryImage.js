/**
 * Milkdown node plugin for Cherry image syntax with extended attributes:
 *   ![alt#width#height#alignment#decoration](url "title")
 *
 * Replaces Milkdown's built-in image-block with a custom block node that
 * supports Cherry's image size, alignment, and decoration extensions.
 *
 * Click on the image to show resize handles and tool buttons (reusing
 * imgSizeHandler and imgToolHandler from the preview mode).
 */
import { $nodeSchema, $command, $remark, $view, $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { visit, SKIP } from 'unist-util-visit';
import imgSizeHandler from '@/utils/imgSizeHandler';
import imgToolHandler from '@/utils/imgToolHandler';
import imgAltHelper from '@/utils/image';

const NODE_NAME = 'cherry_image';
const MDAST_TYPE = 'cherryImage';

// Module-level locale config for tool buttons
let _locale = {};
export function setCherryImageLocale(locale) {
  _locale = locale;
}

// --- Alt text parsing helpers ---

const SIZE_REGEX = /#([0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto)/g;
const ALIGN_REGEX = /#(center|right|left|float-right|float-left)/i;
const DECO_REGEX = /#(border|shadow|radius|B|S|R)/g;

/**
 * Parse Cherry extended attributes from alt text
 * @param {string} rawAlt e.g. 'dog#100px#80px#center#shadow#B'
 * @returns {{ alt: string, width: string, height: string, alignment: string, decorations: string }}
 */
function parseAltExtensions(rawAlt) {
  if (!rawAlt) return { alt: '', width: '', height: '', alignment: '', decorations: '' };

  const sizes = rawAlt.match(SIZE_REGEX) || [];
  const alignMatch = rawAlt.match(ALIGN_REGEX);
  const decos = rawAlt.match(DECO_REGEX) || [];

  const width = sizes[0] ? sizes[0].replace('#', '') : '';
  const height = sizes[1] ? sizes[1].replace('#', '') : '';
  const alignment = alignMatch ? alignMatch[1] : '';
  const decorations = decos.map((d) => d.replace('#', '')).join(' ');

  // Strip all # extensions from alt to get pure text
  let alt = rawAlt
    .replace(SIZE_REGEX, '')
    .replace(ALIGN_REGEX, '')
    .replace(DECO_REGEX, '')
    .replace(/#+$/, '')
    .trim();

  return { alt, width, height, alignment, decorations };
}

/**
 * Rebuild alt text with Cherry extensions
 */
function buildAltWithExtensions(alt, width, height, alignment, decorations) {
  let result = alt || '';
  if (width) result += `#${width}`;
  if (height) result += `#${height}`;
  if (alignment) result += `#${alignment}`;
  if (decorations) {
    decorations
      .trim()
      .split(/\s+/)
      .forEach((d) => {
        if (d) result += `#${d}`;
      });
  }
  return result;
}

/**
 * Compute decoration styles/classes for the img element (border, shadow, radius)
 */
function computeDecoStyle(attrs) {
  const fakeAlt = buildAltWithExtensions('', '', '', '', attrs.decorations);
  return imgAltHelper.processExtendStyleInAlt(fakeAlt);
}

/**
 * Compute wrapper alignment style.
 * In WYSIWYG, alignment is on the wrapper (block-level), not on the img.
 */
function computeWrapperAlignment(alignment) {
  // Use width:fit-content so auto margins work for centering/right-alignment
  switch (alignment) {
    case 'center':
      return 'width:fit-content;margin-left:auto;margin-right:auto;display:block;';
    case 'right':
      return 'width:fit-content;margin-left:auto;margin-right:0;display:block;';
    case 'left':
      return 'width:fit-content;margin-right:auto;margin-left:0;display:block;';
    case 'float-left':
      return 'float:left;margin-right:8px;';
    case 'float-right':
      return 'float:right;margin-left:8px;';
    default:
      return '';
  }
}

// --- Remark plugin ---

function remarkCherryImage() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [MDAST_TYPE](node) {
        const fullAlt = buildAltWithExtensions(node.alt, node.width, node.height, node.alignment, node.decorations);
        const titlePart = node.title ? ` "${node.title}"` : '';
        return `![${fullAlt}](${node.url}${titlePart})`;
      },
    },
  });

  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!node.children) return;

      // Case 1: standalone image (paragraph with a single image child)
      if (node.children.length === 1 && node.children[0].type === 'image') {
        const img = node.children[0];
        const parsed = parseAltExtensions(img.alt || '');

        parent.children[index] = {
          type: MDAST_TYPE,
          alt: parsed.alt,
          url: img.url || '',
          title: img.title || '',
          width: parsed.width,
          height: parsed.height,
          alignment: parsed.alignment,
          decorations: parsed.decorations,
        };
        return [SKIP, index];
      }

      // Case 2: paragraph with mixed content containing images with # extensions
      // Split paragraph: extract each #-extended image as a standalone cherry_image block
      const hasExtendedImage = node.children.some(
        (child) => child.type === 'image' && child.alt && /#/.test(child.alt),
      );
      if (!hasExtendedImage) return undefined;

      const newNodes = [];
      let textBuffer = [];

      const flushTextBuffer = () => {
        if (textBuffer.length > 0) {
          newNodes.push({ type: 'paragraph', children: textBuffer });
          textBuffer = [];
        }
      };

      for (const child of node.children) {
        if (child.type === 'image' && child.alt && /#/.test(child.alt)) {
          flushTextBuffer();
          const parsed = parseAltExtensions(child.alt || '');
          newNodes.push({
            type: MDAST_TYPE,
            alt: parsed.alt,
            url: child.url || '',
            title: child.title || '',
            width: parsed.width,
            height: parsed.height,
            alignment: parsed.alignment,
            decorations: parsed.decorations,
          });
        } else {
          textBuffer.push(child);
        }
      }
      flushTextBuffer();

      // Replace the original paragraph with the split nodes
      parent.children.splice(index, 1, ...newNodes);
      return [SKIP, index];
    });
  };
}

export const remarkCherryImagePlugin = $remark('remarkCherryImage', () => remarkCherryImage);

// --- Node Schema ---

export const cherryImageSchema = $nodeSchema(NODE_NAME, () => ({
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,
  attrs: {
    src: { default: '' },
    alt: { default: '' },
    title: { default: '' },
    width: { default: '' },
    height: { default: '' },
    alignment: { default: '' },
    decorations: { default: '' },
  },
  parseDOM: [
    {
      tag: 'img[data-cherry-image]',
      getAttrs: (dom) => ({
        src: dom.getAttribute('src') || '',
        alt: dom.getAttribute('alt') || '',
        title: dom.getAttribute('title') || '',
        width: dom.style.width || dom.getAttribute('width') || '',
        height: dom.style.height || dom.getAttribute('height') || '',
        alignment: dom.dataset.alignment || '',
        decorations: dom.dataset.decorations || '',
      }),
    },
  ],
  toDOM: (node) => {
    let imgStyle = 'max-width:100%;';
    if (node.attrs.width) imgStyle += `width:${node.attrs.width};`;
    if (node.attrs.height) imgStyle += `height:${node.attrs.height};`;
    const deco = computeDecoStyle(node.attrs);
    if (deco.extendStyles) imgStyle += deco.extendStyles;
    const classes = ['cherry-wysiwyg-image', deco.extendClasses.trim()].filter(Boolean).join(' ');
    return [
      'img',
      {
        src: node.attrs.src,
        alt: node.attrs.alt,
        title: node.attrs.title || undefined,
        'data-cherry-image': 'true',
        'data-alignment': node.attrs.alignment || undefined,
        'data-decorations': node.attrs.decorations || undefined,
        style: imgStyle,
        class: classes,
      },
    ];
  },
  parseMarkdown: {
    match: (node) => node.type === MDAST_TYPE,
    runner: (state, node, type) => {
      state.addNode(type, {
        src: node.url,
        alt: node.alt,
        title: node.title,
        width: node.width,
        height: node.height,
        alignment: node.alignment,
        decorations: node.decorations,
      });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === NODE_NAME,
    runner: (state, node) => {
      state.addNode(MDAST_TYPE, undefined, undefined, {
        alt: node.attrs.alt,
        url: node.attrs.src,
        title: node.attrs.title,
        width: node.attrs.width,
        height: node.attrs.height,
        alignment: node.attrs.alignment,
        decorations: node.attrs.decorations,
      });
    },
  },
}));

// --- Insert Command ---

export const insertCherryImageCommand = $command('InsertCherryImage', () => ({ src, alt, title } = {}) =>
  (state, dispatch) => {
    const imageType = state.schema.nodes[NODE_NAME];
    if (!imageType) return false;
    const node = imageType.create({
      src: src || '',
      alt: alt || '',
      title: title || '',
    });
    dispatch?.(state.tr.replaceSelectionWith(node));
    return true;
  },
);

// --- NodeView ---

// Track active bubble to dismiss on outside click
let _activeBubble = null;

function dismissActiveBubble() {
  if (_activeBubble) {
    _activeBubble.hideBubble();
    _activeBubble = null;
  }
}

export const cherryImageView = $view(cherryImageSchema.node, () => (initialNode, view, getPos) => {
  let node = initialNode;

  // Outer wrapper for positioning resize handles and toolbar
  const wrapper = document.createElement('div');
  wrapper.className = 'cherry-wysiwyg-image-wrapper';
  wrapper.style.cssText = 'position:relative;display:block;max-width:100%;';

  // Hidden reference element: imgSizeHandler uses previewerDom.parentNode.getBoundingClientRect()
  // By placing posRef inside wrapper, previewerDom.parentNode === wrapper,
  // so coordinates are calculated relative to wrapper — matching the absolute positioning context.
  const posRef = document.createElement('div');
  posRef.style.display = 'none';
  wrapper.appendChild(posRef);

  // Image element
  const img = document.createElement('img');
  img.className = 'cherry-wysiwyg-image';
  img.style.cssText = 'max-width:100%;cursor:pointer;display:block;';
  applyAttrs(wrapper, img, node.attrs);
  wrapper.appendChild(img);

  // Caption element (displays title below the image)
  const caption = document.createElement('figcaption');
  caption.className = 'cherry-wysiwyg-image-caption';
  caption.contentEditable = 'true';
  caption.textContent = node.attrs.title || '';
  caption.style.display = node.attrs.title ? '' : 'none';
  caption.setAttribute('placeholder', _locale.imageCaption || 'Add caption');
  wrapper.appendChild(caption);

  // Show caption on double-click image (if no title yet)
  img.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    caption.style.display = '';
    caption.focus();
  });

  // Update title attr on caption blur
  caption.addEventListener('blur', () => {
    const newTitle = caption.textContent.trim();
    if (!newTitle && !node.attrs.title) {
      caption.style.display = 'none';
      return;
    }
    if (newTitle !== node.attrs.title) {
      updateNodeAttrs({ title: newTitle });
    }
    if (!newTitle) {
      caption.style.display = 'none';
    }
  });

  // Prevent Enter from creating newline in caption
  caption.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      caption.blur();
    }
  });

  // Resize handles container (absolutely positioned within wrapper)
  const sizeContainer = document.createElement('div');
  sizeContainer.className = 'cherry-previewer-img-size-handler';
  sizeContainer.style.display = 'none';
  sizeContainer.style.position = 'absolute';

  // Tool buttons container
  const toolContainer = document.createElement('div');
  toolContainer.className = 'cherry-previewer-img-tool-handler';
  toolContainer.style.display = 'none';
  toolContainer.style.position = 'absolute';
  toolContainer.style.zIndex = '10';

  wrapper.appendChild(sizeContainer);
  wrapper.appendChild(toolContainer);

  let bubbleVisible = false;

  function showBubble(event) {
    if (bubbleVisible) return;
    dismissActiveBubble();
    bubbleVisible = true;

    // posRef.parentNode === wrapper, so imgSizeHandler.getImgPosition() will calculate
    // coordinates relative to wrapper — correct for absolute positioning within wrapper.
    const previewerDom = posRef;

    // Show resize handles
    sizeContainer.style.display = '';
    sizeContainer.innerHTML = '';
    imgSizeHandler.showBubble(img, sizeContainer, previewerDom);
    imgSizeHandler.bindChange((imgEl, style) => {
      updateNodeAttrs({
        width: `${Math.round(style.width)}px`,
        height: `${Math.round(style.height)}px`,
      });
    });

    // Show tool buttons
    toolContainer.style.display = '';
    toolContainer.innerHTML = '';
    const locale = {
      border: _locale.border || 'Border',
      shadow: _locale.shadow || 'Shadow',
      radius: _locale.radius || 'Radius',
      alignLeft: _locale.alignLeft || 'Left',
      alignCenter: _locale.alignCenter || 'Center',
      alignRight: _locale.alignRight || 'Right',
      alignFloatLeft: _locale.alignFloatLeft || 'Float Left',
      alignFloatRight: _locale.alignFloatRight || 'Float Right',
    };
    imgToolHandler.showBubble(img, toolContainer, previewerDom, event, locale);
    imgToolHandler.bindChange((imgEl, type) => {
      handleToolChange(type);
    });

    _activeBubble = { hideBubble };

    // Mouse events for resize
    const onMouseDown = (e) => {
      imgSizeHandler.emit('mousedown', e);
      // Mirror 'doing-resize-img' to wrapper for user-select:none
      if (imgSizeHandler.$isResizing()) {
        wrapper.classList.add('doing-resize-img');
      }
    };
    const onMouseMove = (e) => imgSizeHandler.emit('mousemove', e);
    const onMouseUp = (e) => {
      imgSizeHandler.emit('mouseup', e);
      wrapper.classList.remove('doing-resize-img');
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    sizeContainer.addEventListener('mousedown', onMouseDown);

    // Store cleanup references
    wrapper._cleanupResize = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      sizeContainer.removeEventListener('mousedown', onMouseDown);
    };
  }

  function hideBubble() {
    if (!bubbleVisible) return;
    bubbleVisible = false;
    sizeContainer.style.display = 'none';
    sizeContainer.innerHTML = '';
    toolContainer.style.display = 'none';
    toolContainer.innerHTML = '';
    imgSizeHandler.emit('remove');
    if (wrapper._cleanupResize) {
      wrapper._cleanupResize();
      wrapper._cleanupResize = null;
    }
    if (_activeBubble?.hideBubble === hideBubble) {
      _activeBubble = null;
    }
  }

  function updateNodeAttrs(partialAttrs) {
    const pos = typeof getPos === 'function' ? getPos() : getPos;
    if (typeof pos !== 'number') return;
    const newAttrs = { ...node.attrs, ...partialAttrs };
    const tr = view.state.tr.setNodeMarkup(pos, undefined, newAttrs);
    view.dispatch(tr);
  }

  function handleToolChange(type) {
    const decoTypes = ['border', 'shadow', 'radius', 'B', 'S', 'R'];
    const alignTypes = ['left', 'center', 'right', 'float-left', 'float-right'];

    if (decoTypes.includes(type)) {
      // Toggle decoration
      const currentDecos = node.attrs.decorations ? node.attrs.decorations.trim().split(/\s+/) : [];
      const idx = currentDecos.indexOf(type);
      if (idx >= 0) {
        currentDecos.splice(idx, 1);
      } else {
        currentDecos.push(type);
      }
      updateNodeAttrs({ decorations: currentDecos.join(' ') });
    } else if (alignTypes.includes(type)) {
      updateNodeAttrs({ alignment: type });
    } else if (type === 'clear-align') {
      updateNodeAttrs({ alignment: '' });
    }
  }

  function applyAttrs(wrapperEl, imgEl, attrs) {
    imgEl.src = attrs.src || '';
    imgEl.alt = attrs.alt || '';
    if (attrs.title) imgEl.title = attrs.title;

    // Image styles: size + decoration
    let imgStyle = 'max-width:100%;cursor:pointer;display:block;';
    if (attrs.width) imgStyle += `width:${attrs.width};`;
    if (attrs.height) imgStyle += `height:${attrs.height};`;
    const deco = computeDecoStyle(attrs);
    if (deco.extendStyles) imgStyle += deco.extendStyles;
    imgEl.style.cssText = imgStyle;
    const alignClass = attrs.alignment ? `cherry-img-align-${attrs.alignment}` : '';
    imgEl.className = ['cherry-wysiwyg-image', deco.extendClasses.trim(), alignClass].filter(Boolean).join(' ');

    // Wrapper styles: alignment
    const alignStyle = computeWrapperAlignment(attrs.alignment);
    wrapperEl.style.cssText = `position:relative;display:block;max-width:100%;${alignStyle}`;
    // Preserve ProseMirror selection state when updating classes
    const isSelected = wrapperEl.classList.contains('ProseMirror-selectednode');
    wrapperEl.className = 'cherry-wysiwyg-image-wrapper';
    if (attrs.alignment) wrapperEl.classList.add(`cherry-img-align-${attrs.alignment}`);
    if (isSelected) wrapperEl.classList.add('ProseMirror-selectednode');
  }

  // Click to show bubble
  img.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBubble(e);
  });

  return {
    dom: wrapper,
    update(updatedNode) {
      if (updatedNode.type.name !== NODE_NAME) return false;
      node = updatedNode;
      applyAttrs(wrapper, img, node.attrs);
      // Sync caption
      if (document.activeElement !== caption) {
        caption.textContent = node.attrs.title || '';
        caption.style.display = node.attrs.title ? '' : 'none';
      }
      // Update resize handler position if visible
      if (bubbleVisible) {
        imgSizeHandler.updatePosition();
      }
      return true;
    },
    selectNode() {
      wrapper.classList.add('ProseMirror-selectednode');
    },
    deselectNode() {
      wrapper.classList.remove('ProseMirror-selectednode');
      hideBubble();
    },
    stopEvent(event) {
      // Allow mouse events on resize handles
      if (event.target.classList.contains('cherry-previewer-img-size-handler__points')) {
        return true;
      }
      // Allow clicks on tool buttons
      if (event.target.closest('.cherry-previewer-img-tool-handler')) {
        return true;
      }
      // Allow editing in caption
      if (event.target === caption || event.target.closest('.cherry-wysiwyg-image-caption')) {
        return true;
      }
      return false;
    },
    destroy() {
      hideBubble();
    },
  };
});

// --- ProseMirror Plugin: dismiss bubble on outside click ---

const cherryImagePluginKey = new PluginKey('cherry-image-bubble');

export const cherryImageBubblePlugin = $prose(() => new Plugin({
  key: cherryImagePluginKey,
  props: {
    handleClick(view, pos, event) {
      // If click is not on a cherry image, dismiss any active bubble
      const node = view.state.doc.nodeAt(pos);
      if (!node || node.type.name !== NODE_NAME) {
        dismissActiveBubble();
      }
      return false;
    },
  },
}));

// --- Export ---

export const cherryImage = [
  remarkCherryImagePlugin,
  cherryImageSchema,
  insertCherryImageCommand,
  cherryImageView,
  cherryImageBubblePlugin,
].flat();
