import { afterEach, describe, expect, it, vi } from 'vitest';
import MermaidCodeEngine from '../../src/addons/cherry-code-block-mermaid-plugin';
import PlantUMLCodeEngine from '../../src/addons/cherry-code-block-plantuml-plugin';
import CherryEngine from '../../src/index.engine.core';

function appendMeasuredSvg(container: HTMLElement, graphId: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = graphId;
  svg.innerHTML = '<text>Build to Deploy</text>';
  Object.defineProperty(svg, 'getBBox', {
    value: () => ({ x: 0, y: 0, width: 320, height: 180 }),
  });
  container.appendChild(svg);
}

const MERMAID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><text>Build to Deploy</text></svg>';

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('addons/combined Markdown rendering', () => {
  it('renders Mermaid and PlantUML alongside core Markdown syntax in one document', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const options = {
      engine: {
        syntax: {
          plantuml: { baseUrl: 'https://plantuml.example.com/server' },
        },
      },
    };
    const initialize = vi.fn();
    const render = vi.fn((graphId: string, _source: string, callback: (svg: string) => void, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      callback(MERMAID_SVG);
    });

    MermaidCodeEngine.install(options, { mermaidAPI: { initialize, render } });
    PlantUMLCodeEngine.install(options, {});
    const engine = new CherryEngine(options);
    const container = document.createElement('div');
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    container.innerHTML = engine.makeHtml(`
# Release diagrams

The **build** is ready.[^status]

\`\`\`mermaid
graph TD; Build-->Deploy
\`\`\`

\`\`\`plantuml
@startuml
Build -> Deploy
@enduml
\`\`\`

$$
x = 1
$$

- [x] published

[^status]: Diagram status
`);

    const mermaid = container.querySelector('figure[data-type="mermaid"]');
    const plantuml = container.querySelector('[data-type="plantuml"] img');

    expect(container.querySelector('h1')?.textContent).toBe('Release diagrams');
    expect(container.querySelector('p strong')?.textContent).toBe('build');
    expect(mermaid?.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 320 180');
    expect(mermaid?.textContent).toContain('Build to Deploy');
    expect(plantuml?.getAttribute('src')).toMatch(/^https:\/\/plantuml\.example\.com\/server\/svg\//);
    expect(container.querySelector('.Cherry-Math')?.getAttribute('data-content')).toBe('x%20%3D%201');
    expect(container.querySelector('li.check-list-item .ch-icon-check')).not.toBeNull();
    expect(container.querySelector('.one-footnote')?.textContent).toContain('Diagram status');
    expect(initialize).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledOnce();
  });

  it('preserves Mermaid source controls and layout metadata in a mixed extension document', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const options = {
      engine: {
        syntax: {
          codeBlock: {
            mermaid: { showSourceToolbar: true },
          },
        },
      },
    };
    const render = vi.fn((graphId: string, _source: string, callback: (svg: string) => void, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      callback(MERMAID_SVG);
    });

    MermaidCodeEngine.install(options, { mermaidAPI: { initialize: vi.fn(), render } });
    const engine = new CherryEngine(options);
    const container = document.createElement('div');
    const markdown = [
      '[toc]',
      '',
      '# Architecture',
      '',
      '```mermaid #320px #180px #center',
      'graph TD; API-->Worker',
      '```',
      '',
      'The diagram is [documented](https://example.com/docs).[^architecture]',
      '',
      '- [ ] review',
      '',
      '[^architecture]: Architecture note',
    ].join('\n');
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    container.innerHTML = engine.makeHtml(markdown);

    const figure = container.querySelector('figure[data-type="mermaid"]');

    expect(container.querySelector('.toc a[href="#architecture"]')?.textContent).toBe('Architecture');
    expect(figure?.getAttribute('style')).toBe('width:320px;height:180px;');
    expect(figure?.classList.contains('cherry-mermaid-align-center')).toBe(true);
    expect(figure?.querySelector('.cherry-mermaid-source-toolbar-panel[data-mode="preview"] svg')).not.toBeNull();
    expect(figure?.querySelectorAll('.cherry-mermaid-source-toolbar-panel')).toHaveLength(2);
    expect(figure?.textContent).toContain('graph TD; API-->Worker');
    expect(container.querySelector('a[href="https://example.com/docs"]')?.textContent).toBe('documented');
    expect(container.querySelector('li.check-list-item .ch-icon-square')).not.toBeNull();
    expect(container.querySelector('.one-footnote')?.textContent).toContain('Architecture note');
    expect(render).toHaveBeenCalledOnce();
  });

  it('keeps an uninstalled Mermaid fence as readable code while rendering adjacent Markdown', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    const engine = new CherryEngine({
      engine: {
        syntax: {
          header: { anchorStyle: 'none' },
        },
      },
    });
    const container = document.createElement('div');
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    container.innerHTML = engine.makeHtml('## Fallback\n\n```mermaid\ngraph TD; A-->B\n```\n\nAfter the diagram.');
    const codeBlock = container.querySelector('[data-type="codeBlock"][data-lang="mermaid"]');

    expect(container.querySelector('h2')?.textContent).toBe('Fallback');
    expect(container.querySelector('figure[data-type="mermaid"]')).toBeNull();
    expect(codeBlock?.querySelector('pre.language-javascript')).not.toBeNull();
    expect(codeBlock?.textContent).toContain('graph TD; A-->B');
    expect(container.querySelectorAll('p[data-type="p"]')).toHaveLength(1);
    expect(container.querySelector('p[data-type="p"]')?.textContent).toBe('After the diagram.');
  });

  it('keeps nested plugin output and falls back when a plugin renders no content', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    const engine = new CherryEngine({
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {
              notice: {
                render: (source: string) => `<aside class="notice-plugin">${source.trim()}</aside>`,
              },
              empty: {
                render: () => '',
              },
            },
          },
        },
      },
    });
    const container = document.createElement('div');
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    container.innerHTML = engine.makeHtml(
      '> Before plugin\n>\n> ```notice\n> nested content\n> ```\n>\n> After plugin\n\n```empty\nkeep this source\n```',
    );
    const quote = container.querySelector('blockquote');
    const fallback = container.querySelector('[data-type="codeBlock"][data-lang="empty"]');

    expect(quote?.textContent).toContain('Before plugin');
    expect(quote?.querySelector('.notice-plugin')?.textContent).toBe('nested content');
    expect(quote?.textContent).toContain('After plugin');
    expect(fallback?.querySelector('pre.language-javascript')).not.toBeNull();
    expect(fallback?.textContent).toContain('keep this source');
    expect(container.querySelector('[data-type="empty"]')).toBeNull();
  });
});
