const SAFE_HTML_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DEL',
  'DIV',
  'EM',
  'FIGCAPTION',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'I',
  'IMG',
  'LI',
  'MARK',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TABLE',
  'TBODY',
  'TD',
  'TH',
  'THEAD',
  'TR',
  'UL',
  'U',
]);

const SAFE_HTML_ATTRIBUTES = new Set([
  'alt',
  'aria-label',
  'class',
  'colspan',
  'height',
  'href',
  'id',
  'rel',
  'role',
  'rowspan',
  'src',
  'style',
  'tabindex',
  'target',
  'title',
  'width',
]);

const SAFE_HTML_CSS =
  /^(?:background(?:-color)?|border(?:-(?:bottom|left|radius|right|top)(?:-color|-style|-width)?)?|color|font(?:-size|-style|-weight)?|margin(?:-(?:bottom|left|right|top))?|padding(?:-(?:bottom|left|right|top))?|text-align|text-decoration|white-space|width|height)$/i;

// SMIL can change a sanitized href or another attribute after insertion.
// Keep static SVG and foreignObject labels used by Mermaid, but never allow
// renderer-provided animation elements to rewrite live DOM attributes.
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SVG_ANIMATION_TAGS = new Set(['animate', 'animatecolor', 'animatemotion', 'animatetransform', 'set', 'discard']);

function unsafeHtmlUrl(value: string, attribute: string) {
  // URL scheme checks must ignore embedded control characters.
  // eslint-disable-next-line no-control-regex -- Intentional URL normalization.
  const normalized = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, '').toLowerCase();
  // Match Cherry's link policy without blocking data URLs on image sources.
  if ((attribute === 'href' || attribute === 'xlink:href') && normalized.startsWith('data:')) return true;
  return /^(?:javascript|vbscript|data:text\/html)/.test(normalized);
}

/** Keep fallback image URLs subject to the same policy as Engine output. */
export function isSafeImageSource(value: string) {
  return !unsafeHtmlUrl(value, 'src');
}

function unsafeInlineStyle(value: string) {
  // Custom-property values retain CSS escapes even after CSSOM serialization.
  const decoded = value.replace(/\\(?:([\da-f]{1,6})(?:\r\n|[\t\n\f\r ])?|([^\n\f\r\da-f]))/gi, (_, hex, escaped) => {
    if (!hex) return escaped;
    const code = parseInt(hex, 16);
    return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? '\ufffd' : String.fromCodePoint(code);
  });
  // image-set() also accepts a quoted URL, including one supplied by var().
  return /(?:expression\s*\(|(?:javascript|vbscript)\s*:|url\s*\(|(?:-webkit-)?image-set\s*\(|@import|-moz-binding|behavior\s*:)/i.test(
    decoded,
  );
}

/**
 * Converts Cherry renderer output into inert DOM before it is mounted inside
 * an editable ProseMirror node. `restricted` is used for authored HTML, while
 * trusted Cherry renderer output still has executable content removed.
 */
export function sanitizedEngineFragment(
  html: string,
  inline = false,
  restricted = false,
  options: { allowRendererStyles?: boolean } = {},
): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script, iframe, object, embed, base, meta, form').forEach((node) => node.remove());
  // A stylesheet inside SVG still applies to the entire document. Engine
  // output cannot install document-wide stylesheets; explicitly registered
  // visual renderers may need embedded SVG styles for diagrams.
  if (!options.allowRendererStyles || restricted) {
    template.content.querySelectorAll('style, link').forEach((node) => node.remove());
  }
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (element.namespaceURI === SVG_NAMESPACE && SVG_ANIMATION_TAGS.has(element.localName.toLowerCase())) {
      element.remove();
      return;
    }
    if (restricted && !SAFE_HTML_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (restricted && !SAFE_HTML_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (
        name.startsWith('on') ||
        (['href', 'src', 'xlink:href', 'formaction', 'srcset'].includes(name) && unsafeHtmlUrl(value, name)) ||
        // CSSOM serialization exposes escaped function names such as u\72l().
        (name === 'style' && (unsafeInlineStyle(value) || unsafeInlineStyle(element.style.cssText)))
      ) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (restricted && name === 'style') {
        const safeStyle = Array.from(element.style)
          .filter((property) => SAFE_HTML_CSS.test(property))
          .map((property) => `${property}:${element.style.getPropertyValue(property)}`)
          .join(';');
        if (safeStyle) element.setAttribute('style', safeStyle);
        else element.removeAttribute('style');
      } else if (!options.allowRendererStyles && name === 'style') {
        // Cherry uses relative positioning for code controls. Fixed, sticky,
        // absolute and variable-derived positions can move Engine content on
        // top of unrelated host controls and must not be trusted here.
        const position = element.style.getPropertyValue('position').trim().toLowerCase();
        if (position && position !== 'static' && position !== 'relative') element.style.removeProperty('position');
      }
    }
  });
  if (inline && template.content.childElementCount === 1 && template.content.firstElementChild?.tagName === 'P') {
    const fragment = document.createDocumentFragment();
    fragment.append(...Array.from(template.content.firstElementChild.childNodes));
    return fragment;
  }
  return template.content;
}
