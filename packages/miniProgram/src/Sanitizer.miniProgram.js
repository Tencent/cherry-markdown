import { parseDocument } from 'htmlparser2';

const hooks = {
  afterSanitizeAttributes: [],
};

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const RAW_TEXT_TAGS = new Set(['script', 'style']);

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeAttributes(attrs = {}, config = {}) {
  const safeAttrs = {};
  Object.keys(attrs).forEach((key) => {
    if (/^on/i.test(key)) {
      return;
    }
    if (Array.isArray(config.FORBID_ATTR) && config.FORBID_ATTR.includes(key)) {
      return;
    }
    const value = attrs[key];
    if ((key === 'href' || key === 'src') && /^\s*javascript:/i.test(String(value))) {
      return;
    }
    safeAttrs[key] = value;
  });
  return safeAttrs;
}

function serializeNode(node, config) {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return escapeHtml(node.data || '');
  }

  if (node.type === 'comment') {
    return '';
  }

  if (node.type === 'script' || node.type === 'style') {
    return '';
  }

  if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') {
    const children = node.children || [];
    return children.map((child) => serializeNode(child, config)).join('');
  }

  const tagName = String(node.name || '').toLowerCase();
  const attribs = sanitizeAttributes(node.attribs || {}, config);
  hooks.afterSanitizeAttributes.forEach((hook) => {
    hook({
      hasAttribute: (name) => Object.prototype.hasOwnProperty.call(attribs, name),
      getAttribute: (name) => attribs[name],
      setAttribute: (name, value) => {
        attribs[name] = value;
      },
    });
  });
  const serializedAttrs = Object.keys(attribs)
    .map((key) => ` ${key}="${escapeHtml(attribs[key])}"`)
    .join('');

  if (VOID_TAGS.has(tagName)) {
    return `<${tagName}${serializedAttrs}>`;
  }

  const children = (node.children || []).map((child) => serializeNode(child, config)).join('');
  if (RAW_TEXT_TAGS.has(tagName)) {
    return `<${tagName}${serializedAttrs}>${children}</${tagName}>`;
  }
  return `<${tagName}${serializedAttrs}>${children}</${tagName}>`;
}

export const sanitizer = {
  addHook(name, callback) {
    if (!hooks[name]) {
      hooks[name] = [];
    }
    hooks[name].push(callback);
  },
  sanitize(html, config = {}) {
    if (typeof html !== 'string' || html.length === 0) {
      return '';
    }
    const doc = parseDocument(html, { decodeEntities: true });
    return (doc.children || []).map((node) => serializeNode(node, config)).join('');
  },
};
