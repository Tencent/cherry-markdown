/**
 * Minimal Markdown to HTML renderer for MiniProgram stream rendering.
 * It intentionally covers the portable subset used by native MiniProgram views.
 */

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function renderInline(markdown = '') {
  const codeTokens = [];
  let html = escapeHtml(markdown).replace(/`([^`]+)`/g, (match, code) => {
    const token = `\u0000CODE${codeTokens.length}\u0000`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  html = html
    .replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, '<img src="$2" alt="$1" title="$3">')
    .replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, '<a href="$2" title="$3">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  codeTokens.forEach((code, index) => {
    html = html.replace(`\u0000CODE${index}\u0000`, code);
  });

  return html;
}

function renderParagraph(lines) {
  return `<p>${renderInline(lines.join(' '))}</p>`;
}

function renderList(items, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${tag}>`;
}

export function markdownToHtml(markdown = '') {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let code = null;
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(renderParagraph(paragraph));
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      html.push(renderList(list.items, list.ordered));
      list = null;
    }
  };

  lines.forEach((line) => {
    const fence = line.match(/^```\s*([^`]*)\s*$/);
    if (fence) {
      if (code) {
        html.push(
          `<pre class="language-${escapeAttr(code.lang)}"><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`,
        );
        code = null;
      } else {
        flushParagraph();
        flushList();
        code = { lang: fence[1] || '', lines: [] };
      }
      return;
    }

    if (code) {
      code.lines.push(line);
      return;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      html.push(`<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`);
      return;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${renderInline(quote[1])}</p></blockquote>`);
      return;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextOrdered = Boolean(ordered);
      if (!list || list.ordered !== nextOrdered) {
        flushList();
        list = { ordered: nextOrdered, items: [] };
      }
      list.items.push((unordered || ordered)[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  if (code) {
    html.push(`<pre class="language-${escapeAttr(code.lang)}"><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`);
  }
  flushParagraph();
  flushList();

  return html.join('');
}
