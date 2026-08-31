export type CherryCompatibilityMode = 'structured' | 'native-source' | 'passthrough';

export interface CherryCompatibilityCase {
  id: string;
  label: string;
  markdown: string;
  mode: CherryCompatibilityMode;
  selector?: string;
  expectedText?: string;
}

/**
 * Shared acceptance matrix for Cherry's built-in syntax. Unit and browser tests
 * consume this list so new syntax cannot silently disappear from WYSIWYG mode.
 */
export const cherryCompatibilityCases: readonly CherryCompatibilityCase[] = [
  { id: 'heading', label: 'heading', markdown: '# Heading', mode: 'structured', selector: 'h1' },
  {
    id: 'inline-code',
    label: 'inline code',
    markdown: 'Use `const value = 1` here.',
    mode: 'structured',
    selector: 'code',
  },
  {
    id: 'code-block',
    label: 'fenced code block',
    markdown: '```js\nconst value = 1;\n```',
    mode: 'structured',
    selector: '.cherry-milkdown-code-block',
  },
  { id: 'list', label: 'list', markdown: '- one\n- two', mode: 'structured', selector: 'ul' },
  {
    id: 'table',
    label: 'GFM table',
    markdown: '| A | B |\n| --- | --- |\n| 1 | 2 |',
    mode: 'structured',
    selector: 'table',
  },
  {
    id: 'table-chart',
    label: 'Cherry table chart',
    markdown: '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | ---: | ---: |\n| Sales | 1 | 2 |',
    mode: 'native-source',
    selector: '.cherry-echarts-wrapper',
  },
  { id: 'formula', label: 'formula', markdown: '$E=mc^2$', mode: 'structured', selector: 'math-field' },
  { id: 'toc', label: 'TOC', markdown: '# Heading\n\n[[toc]]', mode: 'native-source', selector: '.toc' },
  {
    id: 'panel',
    label: 'Panel',
    markdown: ':::warning Notice\nBody\n:::',
    mode: 'structured',
    selector: '.cherry-panel',
  },
  { id: 'detail', label: 'Detail', markdown: '+++ More\nBody\n+++', mode: 'structured', selector: 'details' },
  {
    id: 'tabs',
    label: 'Tabs',
    markdown: ':::tabs\n:: One\nFirst\n:: Two\nSecond\n:::',
    mode: 'native-source',
    selector: '.cherry-tabs',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    markdown: ':::timeline\n:: 2025\nFirst\n:: 2026\nSecond\n:::',
    mode: 'native-source',
    selector: '.cherry-timeline',
  },
  { id: 'html', label: 'HTML', markdown: '<div>HTML</div>', mode: 'native-source', selector: '.cherry-embed' },
  {
    id: 'mermaid',
    label: 'Mermaid',
    markdown: '```mermaid\ngraph TD; A-->B;\n```',
    mode: 'native-source',
    selector: '.cherry-embed',
  },
  {
    id: 'echarts-code',
    label: 'ECharts code block',
    markdown: '```echarts\n{"series":[]}\n```',
    mode: 'native-source',
    selector: '.cherry-embed',
  },
  {
    id: 'cherry-inline',
    label: 'Cherry inline syntax',
    markdown: '!!#f00 red!! !!!#fff background!!! !18 size! ^^sub^^ ^sup^ {字|zi} /under/ ==mark==',
    mode: 'structured',
    expectedText: 'red',
  },
  {
    id: 'custom-hook',
    label: 'business custom hook',
    markdown: ':::custom\nOpaque source\n:::',
    mode: 'passthrough',
    expectedText: 'Opaque source',
  },
] as const;
