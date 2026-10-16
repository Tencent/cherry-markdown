/**
 * @typedef {{ opening: string, summaryOpening: string, title: string, start: number, end: number, children: DetailNode[] }} DetailSection
 * @typedef {{ kind: 'html' | 'cherry', start: number, end: number, preLines: string, ignored: boolean, sections: DetailSection[] }} DetailNode
 */

function isInList(source, offset) {
  const lineStart = source.lastIndexOf('\n', offset - 1) + 1;
  const prefix = source.slice(lineStart, offset);
  const marker = /^(?:[*+-]|\d+[.]|en-[a-z][.]|[a-z][.]|[I一二三四五六七八九十]+[.])[ \t]+/;
  if (marker.test(prefix.trimStart())) return true;
  const indent = prefix.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
  if (indent === 0) return false;
  let end = lineStart - 1;
  while (end >= 0) {
    const start = source.lastIndexOf('\n', end - 1) + 1;
    const line = source.slice(start, end);
    end = start - 1;
    if (line.trim() === '') continue;
    const previousIndent = line.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
    if (previousIndent < indent) return marker.test(line.trimStart());
  }
  return false;
}

/**
 * @param {string} opening
 * @param {string} title
 * @param {number} start
 * @param {string} [summaryOpening]
 * @returns {DetailSection}
 */
function createSection(opening, title, start, summaryOpening = '<summary>') {
  return { opening, summaryOpening, title, start, end: 0, children: [] };
}

/**
 * Normalize HTML-specific summary syntax before the common renderer sees it.
 * A malformed leading summary stays on the generic HTML path.
 * @param {DetailSection} section
 * @param {string} source
 */
function readHtmlSummary(section, source) {
  const body = source.slice(section.start, section.end);
  const summary = body.match(/^\s*(<summary(?:[^"'<>]|"[^"]*"|'[^']*')*>)([\s\S]*?)<\/summary\s*>/i);
  if (!summary) return !/^\s*<summary(?:\s|>)/i.test(body);
  [, section.summaryOpening, section.title] = summary;
  section.start += summary[0].length;
  section.children = section.children.filter((child) => child.start >= section.start);
  return true;
}

/**
 * Parse both detail spellings into the same container tree. This runs after
 * code has been cached, so delimiters in code blocks/inline code are opaque.
 * Offsets refer to the original input (including paragraph-cache tokens).
 */
export function parseDetails(source) {
  const tokens =
    /<!--[\s\S]*?-->|<\/?[a-z][a-z0-9-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>|^[\t ]*\+\+\+(-?)[\t ]+([^\n]+)\n|^[\t ]*\+\+\+[\t ]*(?=\n|$)|^[\t ]*\+\+(-?)[\t ]+([^\n]+)(?=\n|$)/gim;
  /** @type {DetailNode[]} */
  const roots = [];
  /** @type {DetailNode[]} */
  const stack = [];
  /** @param {DetailNode[]} nodes */
  function appendNodes(nodes) {
    const parent = stack[stack.length - 1];
    const children = parent ? parent.sections[parent.sections.length - 1].children : roots;
    children.push(...nodes);
  }

  // All incomplete/invalid containers use the same recovery rule: retain their
  // raw text and attach completed children to the nearest surviving container.
  function discardOpenNodes(from) {
    for (const node of stack.splice(from)) {
      if (!node.ignored) {
        for (const section of node.sections) appendNodes(section.children);
      }
    }
  }

  let token;
  while ((token = tokens.exec(source))) {
    const text = token[0];
    const htmlOpen = /^<details(?:\s|>)/i.test(text);
    const htmlClose = /^<\/details\s*>/i.test(text);
    const cherryOpen = token[2] !== undefined;
    const cherryClose = /^[\t ]*\+\+\+[\t ]*$/.test(text);
    // An incomplete HTML child cannot consume a Cherry closing delimiter.
    // HTML closers inside Cherry bodies remain literal until Cherry closes.
    if (cherryClose) {
      let cherryIndex = stack.length - 1;
      while (cherryIndex >= 0 && stack[cherryIndex].kind !== 'cherry') cherryIndex -= 1;
      if (cherryIndex >= 0) discardOpenNodes(cherryIndex + 1);
    }
    const parent = stack[stack.length - 1];
    if (htmlOpen || cherryOpen) {
      stack.push({
        kind: htmlOpen ? 'html' : 'cherry',
        ignored: !!parent?.ignored || isInList(source, token.index + text.match(/^[ \t]*/)[0].length),
        start: token.index,
        end: 0,
        preLines: '',
        sections: [
          createSection(
            htmlOpen ? text : `<details ${token[1] === '-' ? 'open' : ''}>`,
            token[2] ?? '',
            tokens.lastIndex,
            htmlOpen ? '' : '<summary>',
          ),
        ],
      });
    } else if (parent && ((htmlClose && parent.kind === 'html') || (cherryClose && parent.kind === 'cherry'))) {
      const section = parent.sections[parent.sections.length - 1];
      // Keep the historical requirement that +++ has a non-empty body line.
      if (parent.kind === 'cherry' && parent.sections.length === 1 && token.index <= section.start + 1) continue;
      section.end = token.index;
      parent.end = tokens.lastIndex;
      stack.pop();
      if (parent.ignored) continue;
      if (parent.kind === 'html' && !readHtmlSummary(section, source)) appendNodes(section.children);
      else appendNodes([parent]);
    } else if (parent?.kind === 'cherry' && token[4] !== undefined) {
      // The legacy body excludes the newline before +++; a final ++ line
      // without its own body therefore remains text rather than a new section.
      if (/^\n[\t ]*\+\+\+[\t ]*(?=\n|$)/.test(source.slice(tokens.lastIndex))) continue;
      parent.sections[parent.sections.length - 1].end = token.index;
      parent.sections.push(createSection(`<details ${token[3] === '-' ? 'open' : ''}>`, token[4], tokens.lastIndex));
    }
  }
  discardOpenNodes(0);
  roots.sort((left, right) => left.start - right.start);
  // Preserve Cherry's historical ownership of leading blank lines. Source-map
  // accounting is syntax adaptation; renderers consume only normalized offsets.
  let cursor = 0;
  for (const node of roots) {
    if (node.kind === 'cherry') {
      const leading = source.slice(cursor, node.start).match(/(?:^|\n)(\n*)$/);
      if (leading) {
        node.start = cursor + leading.index;
        [, node.preLines] = leading;
      }
    }
    cursor = node.end;
  }
  return roots;
}
