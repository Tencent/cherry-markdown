import type { CherryRawPattern, CherryRawRange } from './types.js';

const SPECIAL_CODE_LANGUAGES = ['mermaid', 'plantuml', 'echarts'];

export const builtinCherryRawPatterns: CherryRawPattern[] = [
  {
    name: 'frontmatter',
    kind: 'block',
    pattern: /^---[^\n]*\n[\s\S]+?\n---[^\n]*(?=\n|$)/,
  },
  {
    name: 'math-block',
    kind: 'block',
    pattern: /^[ \t]*\$\$[\s\S]*?\$\$[ \t]*$/m,
  },
  {
    name: 'toc',
    kind: 'block',
    pattern: /^[ \t]*(?:\[\[(?:toc|TOC)\]\]|【【(?:toc|TOC)】】|\[(?:toc|TOC)\])[ \t]*$/m,
  },
  {
    name: 'comment-reference',
    kind: 'block',
    pattern: /^[ \t]*\[(?!\^)[^\]\n]+?\]:[^\S\n]*[^\n]+$/m,
  },
  {
    name: 'panel',
    kind: 'block',
    pattern: /^[ \t]*:::[^:\n][^\n]*\n[\s\S]*?^[ \t]*:::[ \t]*$/m,
  },
  {
    name: 'detail',
    kind: 'block',
    pattern: /^[ \t]*\+\+\+-?[ \t]+[^\n]+\n[\s\S]*?^[ \t]*\+\+\+[ \t]*$/m,
  },
  {
    name: 'background-color',
    kind: 'inline',
    pattern: /(?<!\\)!!!(?:#[0-9a-zA-Z]{3,6}|[a-z]{3,10})\s[\s\S]+?!!!/,
  },
  {
    name: 'color',
    kind: 'inline',
    pattern: /(?<!\\)!!(?:#[0-9a-zA-Z]{3,6}|[a-z]{3,20})\s[\s\S]+?!!/,
  },
  {
    name: 'font-size',
    kind: 'inline',
    pattern: /(?<!\\)![0-9]{1,2}\s[\s\S]*?!/,
  },
  {
    name: 'subscript',
    kind: 'inline',
    pattern: /(?<!\\)\^\^[^\n]+?\^\^/,
  },
  {
    name: 'superscript',
    kind: 'inline',
    pattern: /(?<![\\^])\^[^\n^]+?\^/,
  },
  {
    name: 'ruby',
    kind: 'inline',
    pattern: /(?:^| )\{[^|\n]+?\|[^}\n]+?\}(?= |$)/,
  },
  {
    name: 'underline',
    kind: 'inline',
    pattern: /(?:^| )\/[^/\n]+?\/(?= |$)/,
  },
  {
    name: 'highlight',
    kind: 'inline',
    pattern: /(?:^| )==[^=\n]+?==(?= |$)/,
  },
  {
    name: 'inline-math',
    kind: 'inline',
    pattern: /(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?(?<!\\)\$/,
  },
  {
    name: 'emoji',
    kind: 'inline',
    pattern: /:[+\w-]+:/,
  },
];

function cloneGlobal(pattern: RegExp): RegExp {
  const flags = new Set(pattern.flags.replace('y', '').split(''));
  flags.add('g');
  return new RegExp(pattern.source, [...flags].join(''));
}

function overlaps(left: Pick<CherryRawRange, 'from' | 'to'>, right: Pick<CherryRawRange, 'from' | 'to'>) {
  return left.from < right.to && right.from < left.to;
}

function collectCodeRanges(source: string): CherryRawRange[] {
  const ranges: CherryRawRange[] = [];
  const fenced = /^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm;
  let match: RegExpExecArray | null;
  while ((match = fenced.exec(source))) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      kind: 'block',
      syntax: 'code',
      source: match[0],
    });
  }

  const inlineCode = /(`+)([^\n]*?)\1/g;
  while ((match = inlineCode.exec(source))) {
    const from = match.index;
    const to = match.index + match[0].length;
    if (ranges.some((range) => range.from <= from && range.to >= to)) {
      continue;
    }
    ranges.push({
      from,
      to,
      kind: 'inline',
      syntax: 'inline-code',
      source: match[0],
    });
  }
  return ranges;
}

function collectSpecialCodeRanges(source: string): CherryRawRange[] {
  const languages = SPECIAL_CODE_LANGUAGES.join('|');
  const pattern = new RegExp(
    `^( {0,3})(\u0060{3,}|~{3,})[ \\t]*(?:${languages})(?:[ \\t][^\\n]*)?\\n[\\s\\S]*?^\\1\\2[ \\t]*$`,
    'gim',
  );
  const ranges: CherryRawRange[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      kind: 'block',
      syntax: 'diagram',
      source: match[0],
    });
  }
  return ranges;
}

function normalizeRanges(ranges: CherryRawRange[]): CherryRawRange[] {
  const sorted = [...ranges].sort((left, right) => {
    if (left.from !== right.from) return left.from - right.from;
    if (left.kind !== right.kind) return left.kind === 'block' ? -1 : 1;
    return right.to - right.from - (left.to - left.from);
  });
  const accepted: CherryRawRange[] = [];
  for (const range of sorted) {
    if (!accepted.some((current) => overlaps(current, range))) accepted.push(range);
  }
  return accepted;
}

export function detectCherryRawRanges(source: string, customPatterns: CherryRawPattern[] = []): CherryRawRange[] {
  const codeRanges = collectCodeRanges(source);
  const specialCodeRanges = collectSpecialCodeRanges(source);
  const patterns = [...builtinCherryRawPatterns, ...customPatterns];
  const ranges: CherryRawRange[] = [...specialCodeRanges];

  for (const descriptor of patterns) {
    const pattern = cloneGlobal(descriptor.pattern);
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      if (!match[0]) {
        pattern.lastIndex += 1;
        continue;
      }
      const range: CherryRawRange = {
        from: match.index,
        to: match.index + match[0].length,
        kind: descriptor.kind,
        syntax: descriptor.name,
        source: match[0],
      };
      const isSpecialCode = specialCodeRanges.some((special) => overlaps(special, range));
      if (!isSpecialCode && codeRanges.some((code) => overlaps(code, range))) continue;
      ranges.push(range);
    }
  }

  return normalizeRanges(ranges);
}
