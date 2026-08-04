import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCherryMilkdown, type CherryMilkdownInstance } from '../src';

vi.mock('mathlive', () => ({}));
vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), render: vi.fn(async () => ({ svg: '<svg></svg>' })) },
}));

const instances: CherryMilkdownInstance[] = [];

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
});

const fixtures = [
  ['frontMatter', '---\ntitle: Cherry\n---\n\nBody'],
  ['codeBlock', '```js\nconst value = 1;\n```'],
  ['inlineCode', 'Use `const value = 1` here.'],
  ['inlineMath', 'Formula $E=mc^2$.'],
  ['mathBlock', '$$\na^2+b^2=c^2\n$$'],
  ['htmlBlock', '<div>HTML</div>'],
  ['footnote', 'Footnote[^one].\n\n[^one]: Definition'],
  ['commentReference', '[Cherry][ref]\n\n[ref]: https://example.com'],
  ['br', 'first  \nsecond'],
  ['table', '| A | B |\n| --- | --- |\n| 1 | 2 |'],
  ['toc', '# Heading\n\n[[toc]]'],
  ['blockquote', '> Quote'],
  ['header', '## Heading'],
  ['hr', '---'],
  ['list', '- one\n- two'],
  ['detail', '+++ Detail\nBody\n+++'],
  ['panel', ':::warning\nBody\n:::'],
  ['emoji', 'Hello :smile:'],
  ['image', '![alt](https://example.com/image.png)'],
  ['link', '[Cherry](https://example.com)'],
  ['autoLink', 'https://example.com'],
  ['emphasis', '**bold** and *italic*'],
  ['backgroundColor', '!!!#fff background!!!'],
  ['color', '!!#f00 red!!'],
  ['size', '!18 large!'],
  ['sub', '^^sub^^'],
  ['sup', '^sup^'],
  ['ruby', '{字|zi}'],
  ['strikethrough', '~~removed~~'],
  ['underline', '/under/'],
  ['highLight', '==marked=='],
  ['suggester', '@Cherry'],
  ['spaceTransfer', 'escaped \\* text &amp; space'],
] as const;

describe('Cherry built-in hook fixtures', () => {
  it.each(fixtures)('%s loads, serializes, and renders with CherryEngine', async (_name, value) => {
    const root = document.createElement('div');
    document.body.append(root);
    const instance = await createCherryMilkdown({ root, value });
    instances.push(instance);
    const markdown = instance.getMarkdown();
    expect(markdown.trim().length).toBeGreaterThan(0);
    const directEngine = new CherryEngine();
    const normalizeHtml = (html: string) => html.replace(/\sdata-sign="[^"]*"/g, '');
    expect(normalizeHtml(instance.engine.makeHtml(markdown))).toBe(normalizeHtml(directEngine.makeHtml(markdown)));
  });
});
