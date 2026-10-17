import type { CherryEngineLike } from '../types.js';

let mermaidRenderId = 0;
let mermaidRenderQueue = Promise.resolve();

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

export async function renderMermaid(source: string, signal?: AbortSignal, container?: HTMLElement) {
  // Mermaid uses shared DOM and configuration. Match Cherry's single-render
  // concurrency boundary so two live NodeViews cannot overwrite each other.
  const previous = mermaidRenderQueue;
  let release!: () => void;
  mermaidRenderQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  let canvas: HTMLDivElement | undefined;
  try {
    if (signal?.aborted) throw new DOMException('Mermaid render aborted.', 'AbortError');
    const { default: mermaid } = await import('mermaid');
    if (signal?.aborted) throw new DOMException('Mermaid render aborted.', 'AbortError');
    const host = container?.closest('.cherry');
    const dark = Boolean(host?.matches('.theme__dark, .theme__abyss'));
    const style = host ? getComputedStyle(host) : undefined;
    // Keep Cherry's default Mermaid appearance; other themes inherit Cherry's
    // CSS tokens rather than introducing an independent color palette.
    const themed = host && !host.classList.contains('theme__default');
    const themeVariables =
      style &&
      Object.fromEntries(
        [
          ['primaryBorderColor', '--primary-color'],
          ['primaryTextColor', '--base-font-color'],
          ['lineColor', '--base-font-color'],
          ['background', '--base-previewer-bg'],
        ]
          .map(([name, token]) => [name, style.getPropertyValue(token!).trim()])
          .filter(([, value]) => value),
      );
    mermaid.initialize({
      securityLevel: 'strict',
      startOnLoad: false,
      theme: dark ? 'dark' : 'default',
      ...(themed && { themeVariables }),
    });
    canvas = document.createElement('div');
    canvas.dataset.cherryMilkdownMermaidCanvas = '';
    canvas.style.cssText = 'width:1024px;opacity:0;position:fixed;top:100%';
    document.body.append(canvas);
    mermaidRenderId += 1;
    return (await mermaid.render(`cherry-milkdown-mermaid-${mermaidRenderId}`, source, canvas)).svg;
  } finally {
    canvas?.remove();
    release();
  }
}
