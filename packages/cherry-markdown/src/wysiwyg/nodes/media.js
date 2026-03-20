/**
 * Milkdown node plugins for Cherry !video and !audio syntax:
 *   !video[name](url)
 *   !video[name](url){poster=posterUrl}
 *   !audio[name](url)
 *
 * Renders as <video> / <audio> elements in the WYSIWYG editor.
 *
 * Note: remark parses "!video[name](url)" as text("!video") + link([name](url)),
 * so the remark plugin must scan for this pattern across sibling nodes.
 */
import { $nodeSchema, $remark } from '@milkdown/kit/utils';
import { visit, SKIP } from 'unist-util-visit';

/**
 * Regex to match !video/!audio in a single text node (when remark doesn't create a link)
 */
const MEDIA_TEXT_PATTERN = {
  video: /!video\[([^\]]*)\]\(([^)]+)\)(\{poster=([^}]+)\})?/g,
  audio: /!audio\[([^\]]*)\]\(([^)]+)\)/g,
};

/**
 * Scan paragraph children for !video/!audio patterns.
 * Handles two cases:
 * 1. text("...!video") + link([name](url)) — when remark creates a link node
 * 2. text("...!video[name](url)") — when URL is not recognized as valid by remark
 */
function transformMediaNodes(tree, type) {
  const mdastType = type === 'video' ? 'cherryVideo' : 'cherryAudio';

  visit(tree, 'paragraph', (node) => {
    if (!node.children) return;

    const newChildren = [];
    let changed = false;
    let i = 0;

    while (i < node.children.length) {
      const child = node.children[i];
      const next = node.children[i + 1];

      // Case 1: text ending with "!video"/"!audio" followed by a link node
      if (
        child.type === 'text' &&
        child.value.endsWith(`!${type}`) &&
        next &&
        next.type === 'link'
      ) {
        const textBefore = child.value.slice(0, -type.length - 1);
        if (textBefore) {
          newChildren.push({ type: 'text', value: textBefore });
        }

        const name = next.children?.map((c) => c.value || '').join('') || '';
        const url = next.url || '';

        let poster = '';
        const afterLink = node.children[i + 2];
        if (type === 'video' && afterLink?.type === 'text') {
          const posterMatch = afterLink.value.match(/^\{poster=([^}]+)\}/);
          if (posterMatch) {
            poster = posterMatch[1];
            const remaining = afterLink.value.slice(posterMatch[0].length);
            if (remaining) {
              node.children[i + 2] = { ...afterLink, value: remaining };
            } else {
              i++;
            }
          }
        }

        newChildren.push({ type: mdastType, name, url, poster });
        i += 2;
        changed = true;
        continue;
      }

      // Case 2: entire !video[name](url) in a single text node
      if (child.type === 'text' && child.value.includes(`!${type}[`)) {
        const regex = new RegExp(MEDIA_TEXT_PATTERN[type].source, 'g');
        let lastIndex = 0;
        let match;
        let textChanged = false;

        while ((match = regex.exec(child.value)) !== null) {
          textChanged = true;
          if (match.index > lastIndex) {
            newChildren.push({ type: 'text', value: child.value.slice(lastIndex, match.index) });
          }
          newChildren.push({
            type: mdastType,
            name: match[1],
            url: match[2],
            poster: (type === 'video' && match[4]) || '',
          });
          lastIndex = regex.lastIndex;
        }

        if (textChanged) {
          if (lastIndex < child.value.length) {
            newChildren.push({ type: 'text', value: child.value.slice(lastIndex) });
          }
          changed = true;
          i++;
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

// --- Video ---

const VIDEO_NODE = 'cherry_video';
const VIDEO_MDAST = 'cherryVideo';

function remarkCherryVideo() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [VIDEO_MDAST](node) {
        const attrs = node.poster ? `{poster=${node.poster}}` : '';
        return `!video[${node.name}](${node.url})${attrs}`;
      },
    },
  });

  return (tree) => {
    transformMediaNodes(tree, 'video');
  };
}

export const remarkVideoPlugin = $remark('remarkCherryVideo', () => remarkCherryVideo);

export const videoSchema = $nodeSchema(VIDEO_NODE, () => ({
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    name: { default: '' },
    url: { default: '' },
    poster: { default: '' },
  },
  parseDOM: [
    {
      tag: 'video[data-cherry-video]',
      getAttrs: (dom) => ({
        name: dom.getAttribute('title') || '',
        url: dom.getAttribute('src') || '',
        poster: dom.getAttribute('poster') || '',
      }),
    },
  ],
  toDOM: (node) => [
    'video',
    {
      src: node.attrs.url,
      poster: node.attrs.poster || undefined,
      controls: 'controls',
      title: node.attrs.name,
      'data-cherry-video': 'true',
      style: 'max-width:400px;',
    },
  ],
  parseMarkdown: {
    match: (node) => node.type === VIDEO_MDAST,
    runner: (state, node, type) => {
      state.addNode(type, { name: node.name, url: node.url, poster: node.poster || '' });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === VIDEO_NODE,
    runner: (state, node) => {
      state.addNode(VIDEO_MDAST, undefined, undefined, {
        name: node.attrs.name,
        url: node.attrs.url,
        poster: node.attrs.poster,
      });
    },
  },
}));

export const video = [remarkVideoPlugin, videoSchema].flat();

// --- Audio ---

const AUDIO_NODE = 'cherry_audio';
const AUDIO_MDAST = 'cherryAudio';

function remarkCherryAudio() {
  const data = this.data();
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  toMarkdownExtensions.push({
    handlers: {
      [AUDIO_MDAST](node) {
        return `!audio[${node.name}](${node.url})`;
      },
    },
  });

  return (tree) => {
    transformMediaNodes(tree, 'audio');
  };
}

export const remarkAudioPlugin = $remark('remarkCherryAudio', () => remarkCherryAudio);

export const audioSchema = $nodeSchema(AUDIO_NODE, () => ({
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    name: { default: '' },
    url: { default: '' },
  },
  parseDOM: [
    {
      tag: 'audio[data-cherry-audio]',
      getAttrs: (dom) => ({
        name: dom.getAttribute('title') || '',
        url: dom.getAttribute('src') || '',
      }),
    },
  ],
  toDOM: (node) => [
    'audio',
    {
      src: node.attrs.url,
      controls: 'controls',
      title: node.attrs.name,
      'data-cherry-audio': 'true',
    },
  ],
  parseMarkdown: {
    match: (node) => node.type === AUDIO_MDAST,
    runner: (state, node, type) => {
      state.addNode(type, { name: node.name, url: node.url });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === AUDIO_NODE,
    runner: (state, node) => {
      state.addNode(AUDIO_MDAST, undefined, undefined, {
        name: node.attrs.name,
        url: node.attrs.url,
      });
    },
  },
}));

export const audio = [remarkAudioPlugin, audioSchema].flat();
