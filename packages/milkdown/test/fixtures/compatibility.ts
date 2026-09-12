export type CherryCompatibilityMode = 'structured' | 'native-source' | 'passthrough';

export interface CherryCompatibilityCase {
  id: string;
  label: string;
  markdown: string;
  mode: CherryCompatibilityMode;
  selector?: string;
  expectedText?: string;
  interaction: {
    create: string;
    focus: string;
    modify: string;
    delete: string;
    structured: boolean;
    sourceEditing: boolean;
    passthrough: boolean;
    expectedMarkdown: string;
    expectedDom: string;
    sync: string;
  };
}

function interaction(mode: CherryCompatibilityMode, markdown: string, expectedDom: string) {
  return {
    create: 'Markdown 快捷键或 Cherry 菜单',
    focus: '鼠标点击内容或节点空白区域',
    modify: mode === 'structured' ? '原位编辑结构化内容' : mode === 'native-source' ? '节点内源码编辑' : '原样透传',
    delete: 'Backspace/Delete 删除节点或内容',
    structured: mode === 'structured',
    sourceEditing: mode === 'native-source',
    passthrough: mode === 'passthrough',
    expectedMarkdown: markdown,
    expectedDom,
    sync: 'Milkdown、Cherry getMarkdown、CodeMirror 三份内容一致',
  } as const;
}

/** Shared acceptance matrix for Cherry's built-in syntax. */
export const cherryCompatibilityCases: readonly CherryCompatibilityCase[] = [
  {
    id: 'heading',
    label: 'heading',
    markdown: '# Heading',
    mode: 'structured',
    selector: 'h1',
    interaction: interaction('structured', '# Heading', 'h1'),
  },
  {
    id: 'inline-code',
    label: 'inline code',
    markdown: 'Use `const value = 1` here.',
    mode: 'structured',
    selector: 'code',
    interaction: interaction('structured', 'Use `const value = 1` here.', 'code'),
  },
  {
    id: 'code-block',
    label: 'fenced code block',
    markdown: '```js\nconst value = 1;\n```',
    mode: 'structured',
    selector: '.cherry-milkdown-code-block',
    interaction: interaction('structured', '```js\nconst value = 1;\n```', '.cherry-milkdown-code-block'),
  },
  {
    id: 'list',
    label: 'list',
    markdown: '- one\n- two',
    mode: 'structured',
    selector: 'ul',
    interaction: interaction('structured', '- one\n- two', 'ul'),
  },
  {
    id: 'table',
    label: 'GFM table',
    markdown: '| A | B |\n| --- | ---: |\n| 1 | 2 |',
    mode: 'structured',
    selector: '.milkdown-table-block table.children',
    interaction: interaction('structured', '| A | B |\n| --- | ---: |\n| 1 | 2 |', 'table'),
  },
  {
    id: 'table-chart',
    label: 'Cherry table chart',
    markdown: '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | ---: | ---: |\n| Sales | 1 | 2 |',
    mode: 'native-source',
    selector: '.cherry-echarts-wrapper',
    interaction: interaction(
      'native-source',
      '| :line:{"title":"Trend"} | Jan | Feb |\n| --- | ---: | ---: |\n| Sales | 1 | 2 |',
      '.cherry-echarts-wrapper',
    ),
  },
  {
    id: 'formula',
    label: 'formula',
    markdown: '$E=mc^2$',
    mode: 'structured',
    selector: 'math-field',
    interaction: interaction('structured', '$E=mc^2$', 'math-field'),
  },
  {
    id: 'toc',
    label: 'TOC',
    markdown: '# Heading\n\n[[toc]]',
    mode: 'native-source',
    selector: '.toc',
    interaction: interaction('native-source', '# Heading\n\n[[toc]]', '.toc'),
  },
  {
    id: 'panel',
    label: 'Panel',
    markdown: ':::warning Notice\nBody\n:::',
    mode: 'structured',
    selector: '.cherry-panel',
    interaction: interaction('structured', ':::warning Notice\nBody\n:::', '.cherry-panel'),
  },
  {
    id: 'detail',
    label: 'Detail',
    markdown: '+++ More\nBody\n+++',
    mode: 'structured',
    selector: '.cherry-detail',
    interaction: interaction('structured', '+++ More\nBody\n+++', '.cherry-detail'),
  },
  {
    id: 'tabs',
    label: 'Tabs',
    markdown: ':::tabs\n:: One\nFirst\n:: Two\nSecond\n:::',
    mode: 'structured',
    selector: '.cherry-tabs',
    interaction: interaction('structured', ':::tabs\n:: One\nFirst\n:: Two\nSecond\n:::', '.cherry-tabs'),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    markdown: ':::timeline\n:: 2025\nFirst\n:: 2026\nSecond\n:::',
    mode: 'structured',
    selector: '.cherry-timeline',
    interaction: interaction('structured', ':::timeline\n:: 2025\nFirst\n:: 2026\nSecond\n:::', '.cherry-timeline'),
  },
  {
    id: 'html',
    label: 'HTML',
    markdown: '<div>HTML</div>',
    mode: 'native-source',
    selector: '.cherry-embed',
    interaction: interaction('native-source', '<div>HTML</div>', '.cherry-embed'),
  },
  {
    id: 'mermaid',
    label: 'Mermaid',
    markdown: '```mermaid\ngraph TD; A-->B;\n```',
    mode: 'native-source',
    selector: '.cherry-embed',
    interaction: interaction('native-source', '```mermaid\ngraph TD; A-->B;\n```', '.cherry-embed'),
  },
  {
    id: 'echarts-code',
    label: 'ECharts code block',
    markdown: '```echarts\n{"series":[]}\n```',
    mode: 'native-source',
    selector: '.cherry-embed',
    interaction: interaction('native-source', '```echarts\n{"series":[]}\n```', '.cherry-embed'),
  },
  {
    id: 'cherry-inline',
    label: 'Cherry inline syntax',
    markdown: '!!#f00 red!! !!!#fff background!!! !18 size! ^^sub^^ ^sup^ {字|zi} /under/ ==mark==',
    mode: 'structured',
    expectedText: 'red',
    interaction: interaction(
      'structured',
      '!!#f00 red!! !!!#fff background!!! !18 size! ^^sub^^ ^sup^ {字|zi} /under/ ==mark==',
      '.cherry-wysiwyg-color',
    ),
  },
  {
    id: 'custom-hook',
    label: 'business custom hook',
    markdown: ':::custom\nOpaque source\n:::',
    mode: 'passthrough',
    expectedText: 'Opaque source',
    interaction: interaction('passthrough', ':::custom\nOpaque source\n:::', '.cherry-embed'),
  },
] as const;
