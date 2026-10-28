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

function unsafeHtmlUrl(value: string) {
  const normalized = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, '').toLowerCase();
  return /^(?:javascript|vbscript|data:text\/html)/.test(normalized);
}

function unsafeInlineStyle(value: string) {
  return /(?:expression\s*\(|(?:javascript|vbscript)\s*:|url\s*\(|@import|-moz-binding|behavior\s*:)/i.test(value);
}

/**
 * Converts Cherry renderer output into inert DOM before it is mounted inside
 * an editable ProseMirror node. `restricted` is used for authored HTML, while
 * trusted Cherry renderer output still has executable content removed.
 */
export function sanitizedEngineFragment(html: string, inline = false, restricted = false): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script, iframe, object, embed, base, meta, form').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
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
        (['href', 'src', 'xlink:href', 'formaction', 'srcset'].includes(name) && unsafeHtmlUrl(value)) ||
        (name === 'style' && unsafeInlineStyle(value))
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
