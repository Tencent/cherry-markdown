import type { CherryEngineLike } from '../types.js';

let mermaidRenderId = 0;

export const MERMAID_ALIGNMENT_CLASSES = [
  'cherry-mermaid-align-center',
  'cherry-mermaid-align-right',
  'cherry-mermaid-align-left',
  'cherry-mermaid-align-float-right',
  'cherry-mermaid-align-float-left',
];

export function destroyCherryRenderedContent(engine: CherryEngineLike, container: Element) {
  engine.destroyRenderedContent?.(container);
}

export async function renderMermaid(source: string) {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ securityLevel: 'strict', startOnLoad: false });
  mermaidRenderId += 1;
  return (await mermaid.render(`cherry-milkdown-mermaid-${mermaidRenderId}`, source)).svg;
}

export function mermaidLayout(source: string) {
  const opener = source.split(/\r?\n/, 1)[0] ?? '';
  const sizes = opener.match(/#([0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)/gi) ?? [];
  const alignment = opener.match(/#(center|right|left|float-right|float-left)/i)?.[1] ?? '';
  return {
    width: sizes[0]?.slice(1) ?? '',
    height: sizes[1]?.slice(1) ?? '',
    alignment,
  };
}
