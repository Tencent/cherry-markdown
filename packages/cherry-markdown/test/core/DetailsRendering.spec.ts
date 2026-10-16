import { describe, expect, it, vi } from 'vite-plus/test';
import { sanitizer } from '../../src/Sanitizer';
import CherryEngine from '../../src/index.engine.core';
import Engine from '../../src/Engine';

function engine(): Engine {
  return new CherryEngine();
}

const htmlDetail = (body: string, title = 'Title') => `<details>\n<summary>${title}</summary>\n\n${body}\n\n</details>`;
const cherryDetail = (body: string, title = 'Title') => `+++ ${title}\n${body}\n+++`;
const quote = (body: string) =>
  body
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
const panel = (body: string) => `:::warning Panel\n\n${body}\n\n:::`;
const syntaxes = [
  { syntax: 'HTML', wrap: htmlDetail },
  { syntax: 'Cherry', wrap: cherryDetail },
];
type RenderPhase = 'initial render' | 'cached rerender';
const renderPhases: { phase: RenderPhase }[] = [{ phase: 'initial render' }, { phase: 'cached rerender' }];

function render(source: string, instance = engine()) {
  const container = document.createElement('div');
  container.innerHTML = instance.makeHtml(source) as string;
  expect(container.innerHTML).not.toMatch(/~~C\d+I/);
  return container;
}

function renderPhase(source: string, phase: RenderPhase) {
  const instance = engine();
  if (phase === 'cached rerender') render(source, instance);
  return render(source, instance);
}

// Issue #1902: exercise the real engine, including interactions between hooks.
describe('core/DetailsRendering', () => {
  describe('basic rendering', () => {
    describe.each(syntaxes)('$syntax', ({ wrap }) => {
      it.each([
        { context: 'paragraph', body: 'before\n\nafter', selector: 'p' },
        { context: 'heading', body: '# Heading', selector: 'h1' },
        { context: 'list', body: '- first\n- second', selector: 'li' },
        { context: 'code', body: '```js\nconst answer = 42;\n```', selector: 'pre code' },
        { context: 'table', body: '| A | B |\n| --- | --- |\n| 1 | 2 |', selector: 'table' },
        { context: 'quote', body: '> quoted **body**', selector: 'blockquote strong' },
      ])('$context | keeps rendered content inside a collapsed container', ({ body, selector }) => {
        const container = render(wrap(body));
        const details = container.querySelector('details')!;
        expect(details.querySelector(selector)).not.toBeNull();
        expect(container.querySelectorAll(selector).length).toBe(details.querySelectorAll(selector).length);
        expect(details.hasAttribute('open')).toBe(false);
        expect(details.firstElementChild?.tagName).toBe('SUMMARY');
      });
    });

    it('HTML / attributes and inline summary | preserves attributes, open state and emphasis', () => {
      const container = render(
        '<details open id="keep"><summary class="label">**Bold**</summary>\n\ntext\n\n</details>',
      );
      expect(container.querySelector('details')?.id).toBe('keep');
      expect(container.querySelector('details')?.hasAttribute('open')).toBe(true);
      expect(container.querySelector('summary.label strong')?.textContent).toBe('Bold');
    });

    it('HTML / missing summary | preserves native default-summary behavior', () => {
      expect(render('<details>\n\nbody\n\n</details>').querySelector('summary')).toBeNull();
    });
  });

  describe('nesting', () => {
    describe.each(syntaxes)('$syntax', ({ wrap }) => {
      describe.each([
        { context: 'blockquote', surround: quote },
        { context: 'panel', surround: panel },
        { context: 'panel > blockquote', surround: (body: string) => panel(quote(body)) },
        { context: 'blockquote > panel', surround: (body: string) => quote(panel(body)) },
      ])('$context', ({ surround }) => {
        it.each(renderPhases)('$phase | restores folding caches within the enclosing container', ({ phase }) => {
          const container = renderPhase(surround(wrap('**inside**')), phase);
          const outer = container.querySelector('blockquote, .cherry-panel--body')!;
          expect(outer.querySelectorAll('details')).toHaveLength(1);
          expect(outer.querySelector('details strong')?.textContent).toBe('inside');
        });
      });
    });

    it.each(
      syntaxes.flatMap(({ syntax: outerSyntax, wrap: outer }) =>
        syntaxes.map(({ syntax: innerSyntax, wrap: inner }) => ({ outerSyntax, innerSyntax, outer, inner })),
      ),
    )('$outerSyntax > $innerSyntax | preserves nested ownership', ({ outer, inner }) => {
      const container = render(outer(`before\n\n${inner('**inside**', 'Inner')}\n\nafter`, 'Outer'));
      const sections = container.querySelectorAll('details');
      expect(sections).toHaveLength(2);
      expect(sections[0].querySelector('details')).toBe(sections[1]);
      expect(sections[1].querySelector('strong')?.textContent).toBe('inside');
      expect(sections[0].textContent).toContain('before');
      expect(sections[0].textContent).toContain('after');
      expect(sections[1].textContent).not.toContain('after');
    });

    it('HTML > Cherry multi-panel > HTML | preserves panel titles, open states and ownership', () => {
      const panels = `+++ First\nfirst\n\n${htmlDetail('inner', 'Nested')}\n\n++- Second\nsecond\n++ Third\nthird\n+++`;
      const container = render(htmlDetail(panels, 'Outer'));
      const multiple = container.querySelector('.cherry-detail__multiple')!;
      const panelsDom = [...multiple.children].filter((child) => child.tagName === 'DETAILS');
      expect(panelsDom).toHaveLength(3);
      expect(panelsDom.map((d) => d.querySelector('summary')?.textContent)).toEqual(['First', 'Second', 'Third']);
      expect(panelsDom.map((d) => d.hasAttribute('open'))).toEqual([false, true, false]);
      expect(panelsDom[0].querySelector('details')?.querySelector('summary')?.textContent).toBe('Nested');
    });

    it('Cherry > HTML / ++ literal | does not split the enclosing Cherry panel', () => {
      const container = render(cherryDetail(htmlDetail('++ Literal\nbody')));
      expect(container.querySelectorAll('details')).toHaveLength(2);
      expect(container.querySelectorAll('.cherry-detail__multiple')).toHaveLength(0);
      expect(container.textContent).toContain('++ Literal');
    });
  });

  describe('document state', () => {
    describe.each(syntaxes)('$syntax', ({ wrap }) => {
      it.each(renderPhases)('$phase / duplicate headings | allocates anchors in source order', ({ phase }) => {
        const container = renderPhase(`# Same\n\n${wrap('## Same')}\n\n# Same`, phase);
        expect([...container.querySelectorAll('h1,h2')].map((h) => h.id)).toEqual(['same', 'same-2', 'same-3']);
        expect(container.querySelector('details h2')?.id).toBe('same-2');
      });

      it.each(renderPhases)('$phase / footnotes | keeps definitions global and heading IDs unique', ({ phase }) => {
        const source = `# Same\n\n${wrap('## Same\n\nreference[^note]')}\n\n# Same\n\n[^note]: explanation`;
        const container = renderPhase(source, phase);
        const ids = [...container.querySelectorAll('h1,h2')].map((h) => h.id);
        expect(new Set(ids).size).toBe(3);
        expect(container.querySelectorAll('.one-footnote')).toHaveLength(1);
        expect(container.querySelector('details .cherry-footnote-number a')).not.toBeNull();
        expect(container.querySelector('details .one-footnote')).toBeNull();
      });

      it.each(renderPhases)('$phase / TOC | includes headings inside the folding container', ({ phase }) => {
        const container = renderPhase(`[[toc]]\n\n# Outside\n\n${wrap('## Inside')}\n\n# End`, phase);
        expect([...container.querySelectorAll('.toc a')].map((a) => a.textContent)).toEqual([
          'Outside',
          'Inside',
          'End',
        ]);
        expect(container.querySelector('details h2')?.id).toBe('inside');
      });
    });

    const source = `${htmlDetail('old')}\n\n${cherryDetail('other')}`;

    it('HTML + Cherry / adjacent containers | preserves sibling ownership', () => {
      const container = render(source);
      expect(container.querySelectorAll('details')).toHaveLength(2);
      expect(container.querySelector('details details')).toBeNull();
    });

    it('HTML + Cherry / edited body | replaces stale cached content', () => {
      const instance = engine();
      render(source, instance);
      const edited = render(source.replace('old', 'updated'), instance);
      expect(edited.querySelector('details')?.textContent).toContain('updated');
      expect(edited.querySelector('details')?.textContent).not.toContain('old');
    });

    it('HTML + Cherry / restored body | reproduces the original output after an edit', () => {
      const instance = engine();
      const first = render(source, instance);
      render(source.replace('old', 'updated'), instance);
      expect(render(source, instance).innerHTML).toBe(first.innerHTML);
    });
  });

  describe('source mapping', () => {
    describe.each(syntaxes)('$syntax', ({ wrap }) => {
      it.each([
        { context: 'ATX heading', body: '# Heading' },
        { context: 'Setext heading', body: 'Heading\n=======' },
        { context: 'multiple headings', body: '# First\n\n## Second' },
        { context: 'cached code block', body: '```js\nconst x = 1;\n```' },
      ])('$context | preserves the source line count', ({ body }) => {
        const source = wrap(body);
        expect(render(source).querySelector('.cherry-detail')?.getAttribute('data-lines')).toBe(
          String(source.split('\n').length),
        );
      });
    });

    it('Cherry / surrounding paragraphs | preserves legacy leading blank-line accounting', () => {
      const source = 'before\n\n+++ Title\n# Heading\n+++\n\nafter';
      expect(render(source).querySelector('.cherry-detail')?.getAttribute('data-lines')).toBe('4');
    });

    it('Cherry / parent panel | preserves both detail and panel line counts', () => {
      const container = render(':::warning Panel\n\n+++ Title\nbody\n+++\n\n:::');
      expect(container.querySelector('.cherry-detail')?.getAttribute('data-lines')).toBe('4');
      expect(container.querySelector('.cherry-panel')?.getAttribute('data-lines')).toBe('7');
    });
  });

  describe('compatibility', () => {
    describe('malformed input', () => {
      describe.each([
        { context: 'Cherry / missing close', source: '+++ Title\nbody' },
        { context: 'Cherry / empty body', source: '+++ Title\n+++' },
        { context: 'Cherry / blank body', source: '+++ Title\n\n+++' },
        { context: 'Cherry / missing title separator', source: '+++Title\nbody\n+++' },
        { context: 'Cherry / orphan close', source: 'before\n+++\nafter' },
        { context: 'Cherry / orphan section', source: 'before\n++ Title\nafter' },
        { context: 'HTML / orphan close', source: 'before\n</details>\nafter' },
      ])('$context', ({ source }) => {
        it.each(renderPhases)('$phase | preserves the legacy non-container interpretation', ({ phase }) => {
          const container = renderPhase(source, phase);
          expect(container.querySelector('details')).toBeNull();
          expect(container.textContent).toContain(source.includes('Title') ? 'Title' : 'before');
        });
      });

      describe.each([
        {
          context: 'HTML / missing close',
          source: '<details>\n<summary>Title</summary>\n\nbody',
          summaries: ['Title'],
        },
        {
          context: 'HTML / missing summary close',
          source: '<details>\n<summary>Title\n\nbody\n</details>',
          summaries: ['Title'],
        },
        { context: 'HTML / extra close', source: `${htmlDetail('body')}\n</details>\nafter`, summaries: ['Title'] },
        { context: 'Cherry / extra close', source: `${cherryDetail('body')}\n+++\nafter`, summaries: ['Title'] },
        {
          context: 'Cherry > unclosed HTML',
          source: cherryDetail('<details>\n<summary>Inner</summary>\n\nbody'),
          summaries: ['Title', 'Inner'],
        },
        {
          context: 'unclosed HTML > valid Cherry',
          source: `<details>\n<summary>Broken</summary>\n\n${cherryDetail('body')}`,
          summaries: ['Broken', 'Title'],
        },
        {
          context: 'unclosed Cherry > valid HTML',
          source: `+++ Broken\n\n${htmlDetail('body')}`,
          summaries: ['Title'],
        },
        {
          context: 'unclosed Cherry > valid Cherry',
          source: `+++ Broken\n\n${cherryDetail('body', 'Inner')}`,
          summaries: ['Inner'],
        },
        {
          context: 'HTML > Cherry / crossed closing delimiters',
          source: '<details>\n<summary>Outer</summary>\n\n+++ Inner\nbody\n</details>\n+++',
          summaries: ['Outer', 'Inner'],
        },
        {
          context: 'Cherry > HTML / crossed closing delimiters',
          source: '+++ Outer\n<details>\n<summary>Inner</summary>\n\nbody\n+++\n</details>',
          summaries: ['Outer', 'Inner'],
        },
      ])('$context', ({ source, summaries }) => {
        it.each(renderPhases)('$phase | retains body text and recoverable containers', ({ phase }) => {
          const instance = engine();
          if (phase === 'cached rerender') render(source, instance);
          const container = render(source, instance);
          expect([...container.querySelectorAll('summary')].map((node) => node.textContent)).toEqual(summaries);
          expect(container.querySelectorAll('details')).toHaveLength(summaries.length);
          expect(container.textContent).toContain('body');
          expect(render(source, instance).innerHTML).toBe(container.innerHTML);
        });
      });
    });

    it('Cherry / trailing empty section | preserves the final ++ line as body text', () => {
      const container = render('+++ Title\nbody\n++ Second\n+++');
      expect(container.querySelectorAll('details')).toHaveLength(1);
      expect(container.querySelector('summary')?.textContent).toBe('Title');
      expect(container.querySelector('details')?.textContent).toContain('++ Second');
    });

    describe.each([
      { syntax: 'HTML', wrap: htmlDetail },
      { syntax: 'Cherry', wrap: cherryDetail },
      { syntax: 'mixed', wrap: (body: string, title: string) => htmlDetail(cherryDetail(body, title), title) },
    ])('$syntax / deep nesting', ({ syntax, wrap }) => {
      it.each([{ depth: 10 }, { depth: 50 }, { depth: 100 }])(
        '$depth levels | retains every container and the leaf after an edit',
        ({ depth }) => {
          let source = 'leaf **before**';
          for (let level = 0; level < depth; level += 1) source = wrap(source, `Level ${level}`);
          const instance = engine();
          const count = syntax === 'mixed' ? depth * 2 : depth;
          const first = render(source, instance);
          expect(first.querySelectorAll('details')).toHaveLength(count);
          expect(first.querySelector('strong')?.textContent).toBe('before');
          expect(
            [...first.querySelectorAll('details')].every((node) => node.contains(first.querySelector('strong'))),
          ).toBe(true);
          const edited = render(source.replace('**before**', '**after**'), instance);
          expect(edited.querySelectorAll('details')).toHaveLength(count);
          expect(edited.querySelector('strong')?.textContent).toBe('after');
          expect(
            [...edited.querySelectorAll('details')].every((node) => node.contains(edited.querySelector('strong'))),
          ).toBe(true);
          expect(render(source, instance).innerHTML).toBe(first.innerHTML);
        },
      );
    });

    it.each(syntaxes)('$syntax / 500 nested single sections | avoids multiplying DOM depth', ({ wrap }) => {
      let source = 'leaf **body**';
      for (let level = 0; level < 500; level += 1) source = wrap(source, `Level ${level}`);
      const container = render(source);
      const leaf = container.querySelector('strong');
      expect(leaf?.textContent).toBe('body');
      expect(container.querySelectorAll('details')).toHaveLength(500);
      expect([...container.querySelectorAll('details')].every((node) => node.contains(leaf))).toBe(true);
      expect(container.querySelectorAll('.cherry-detail')).toHaveLength(1);
      expect(container.querySelectorAll('.cherry-detail-body')).toHaveLength(1);
    });

    it('HTML / sanitizer cache | reuses unchanged output and sanitizes edited markup', () => {
      const instance = engine();
      const source = htmlDetail('body');
      const spy = vi.spyOn(sanitizer, 'sanitize');
      try {
        const first = render(source, instance);
        const calls = spy.mock.calls.length;
        expect(calls).toBeGreaterThan(0);
        expect(render(source, instance).innerHTML).toBe(first.innerHTML);
        expect(spy).toHaveBeenCalledTimes(calls);
        const edited = render(htmlDetail('<img src="x" onerror="alert(1)">changed'), instance);
        expect(spy.mock.calls.length).toBeGreaterThan(calls);
        expect(edited.querySelector('[onerror]')).toBeNull();
        expect(edited.textContent).toContain('changed');
      } finally {
        spy.mockRestore();
      }
    });

    it.each([
      { context: 'unordered (-)', marker: '-' },
      { context: 'decimal (1.)', marker: '1.' },
      { context: 'Latin (en-a.)', marker: 'en-a.' },
      { context: 'Chinese (一.)', marker: '一.' },
    ])('Cherry / $context list | preserves indented syntax as list text', ({ marker }) => {
      const container = render(`${marker} item\n\n  +++ Title\n  body\n  +++`);
      expect(container.querySelectorAll('li')).toHaveLength(1);
      expect(container.querySelector('details')).toBeNull();
      expect(container.querySelector('li')?.textContent).toContain('+++ Title');
      expect(container.querySelector('li')?.textContent).toContain('body');
      expect(container.children).toHaveLength(1);
    });

    describe.each(syntaxes)('$syntax', ({ wrap }) => {
      it('long document (110 paragraphs) | preserves container boundaries across sanitizer batches', () => {
        const paragraphs = Array.from({ length: 110 }, (_, i) => `paragraph ${i}\n\n## Heading ${i}`).join('\n\n');
        const outside = Array.from({ length: 110 }, (_, i) => `outside ${i}`).join('\n\n');
        const container = render(`${outside}\n\n${wrap(paragraphs)}\n\n${outside}`);
        const details = container.querySelector('details')!;
        expect(details.textContent).toContain('paragraph 0');
        expect(details.textContent).toContain('paragraph 109');
        expect(details.querySelectorAll('p')).toHaveLength(110);
        expect(details.textContent).not.toContain('outside');
        expect(container.querySelectorAll('details')).toHaveLength(1);
        expect(container.textContent?.match(/outside 109/g)).toHaveLength(2);
      });

      it.each([
        { context: 'HTML comment', body: '<!-- <details> -->' },
        { context: 'quoted attribute', body: '<span title="<details>">label</span>' },
        { context: 'fenced code', body: '```md\n+++ Fake\ntext\n+++\n<details>\n```' },
        { context: 'escaped body tags', body: '\\<details>text\\</details>' },
      ])('$context | does not interpret literal tags as nested containers', ({ body }) => {
        expect(render(wrap(body)).querySelectorAll('details')).toHaveLength(1);
      });

      it('inline code | preserves literal tag text inside code', () => {
        const container = render(wrap('`<details>`'));
        expect(container.querySelectorAll('details')).toHaveLength(1);
        expect(container.querySelector('code')?.textContent).toBe('<details>');
      });

      it('mixed literal contexts | keeps comments, attributes and code opaque together', () => {
        const body =
          '<!-- <details> -->\n\n<span title="<details>">label</span>\n\n`<details>`\n\n```md\n+++ Fake\ntext\n+++\n<details>\n```';
        const container = render(wrap(body));
        expect(container.querySelectorAll('details')).toHaveLength(1);
        expect(container.querySelector('code')?.textContent).toBe('<details>');
      });
    });

    it('HTML / escaped root tags | leaves escaped markup as text', () => {
      expect(render('\\<details>text\\</details>').querySelector('details')).toBeNull();
    });

    it.each([
      { context: 'container event handler', selector: 'details[onclick]' },
      { context: 'summary event handler', selector: 'summary[onclick]' },
      { context: 'script tag', selector: 'script' },
    ])('HTML / $context | removes executable markup', ({ selector }) => {
      const container = render(
        '<details onclick="alert(1)"><summary onclick="alert(2)">Title</summary>\n\n<script>alert(3)</script>\n\n</details>',
      );
      expect(container.querySelector(selector)).toBeNull();
      expect(container.querySelector('details')?.textContent).toContain('Title');
    });
  });
});
