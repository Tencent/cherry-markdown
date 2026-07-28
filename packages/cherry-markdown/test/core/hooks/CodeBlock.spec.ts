import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodeBlock from '../../../src/core/hooks/CodeBlock';
import { hashHex } from '../../../src/utils/hash';

interface CustomRenderOptions {
  mermaidConfig?: { showSourceToolbar?: boolean };
  showSourceToolbar?: boolean;
  updateCache: (html: string) => void;
  fallback: () => string;
}

type CustomRenderFunction = (
  code: string,
  sign: string,
  engine: TestEngine,
  options: CustomRenderOptions | string,
) => string;

interface CustomRenderer {
  render: CustomRenderFunction | string;
  constructor: { TYPE?: string };
}

interface TestEngine {
  hash: (value: string) => string;
}

interface CodeBlockConfig {
  lineNumber?: boolean;
  copyCode?: boolean;
  expandCode?: boolean;
  editCode?: boolean;
  changeLang?: boolean;
  selfClosing?: boolean;
  indentedCodeBlock?: boolean;
  mermaid?: { svg2img?: boolean; showSourceToolbar?: boolean };
  customRenderer?: Record<string, CustomRenderer>;
  highlighter?: (code: string, language: string) => string;
}

function createCodeBlock(
  config: CodeBlockConfig = {},
  options: {
    flowSessionContext?: boolean;
    flowSessionCursor?: boolean;
    showInlineColor?: boolean;
    omitInlineColor?: boolean;
    inlineSelfClosing?: boolean;
    emptyLocales?: boolean;
    wrapperRender?: (language: string, code: string, html: string) => string;
  } = {},
) {
  const cherry = {
    options: {
      engine: {
        global: {
          flowSessionContext: options.flowSessionContext ?? false,
          flowSessionCursor: options.flowSessionCursor ?? false,
        },
        syntax: {
          inlineCode: {
            showColor: options.omitInlineColor ? undefined : (options.showInlineColor ?? true),
            selfClosing: options.inlineSelfClosing ?? false,
          },
          codeBlock: {
            wrapperRender: options.wrapperRender,
          },
        },
      },
    },
    getLocales: () => (options.emptyLocales ? {} : { mermaidPreview: 'Diagram', mermaidSource: 'Source code' }),
  };
  const hook = new CodeBlock({
    externals: {},
    config: {
      lineNumber: true,
      copyCode: true,
      expandCode: false,
      editCode: true,
      changeLang: true,
      selfClosing: false,
      mermaid: { svg2img: false, showSourceToolbar: false },
      ...config,
    },
    cherry,
  });
  const engine: TestEngine = {
    hash: (value: string) => hashHex(value),
  };
  Object.defineProperty(hook, '$engine', { value: engine });
  return { hook, engine, cherry };
}

function restoreFencedCode(hook: CodeBlock, markdown: string) {
  return hook.afterMakeHtml(hook.beforeMakeHtml(markdown));
}

describe('core/hooks/CodeBlock', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('renders fenced JavaScript with line numbers and command attributes', () => {
    const { hook } = createCodeBlock();
    const html = restoreFencedCode(hook, '```javascript\nconst value = 1;\n```');

    expect(html).toContain('data-type="codeBlock"');
    expect(html).toContain('data-lang="javascript"');
    expect(html).toContain('data-edit-code="true"');
    expect(html).toContain('data-copy-code="true"');
    expect(html).toContain('<pre class="language-javascript">');
    expect(html).toContain('<span class="code-line">');
    expect(html).toContain('token keyword">const</span>');
  });

  it('falls back to JavaScript highlighting while preserving the requested language', () => {
    const { hook } = createCodeBlock({ lineNumber: false });
    const html = hook.renderCodeBlock('plain text', 'UnknownLang', 'sign', 2);

    expect(html).toContain('data-lang="unknownlang"');
    expect(html).toContain('<pre class="language-javascript">');
    expect(html).not.toContain('class="code-line"');
  });

  it('removes a streaming cursor from the language marker', () => {
    const { hook } = createCodeBlock();
    const html = hook.renderCodeBlock('const value = 1;', 'javascript CHERRY_FLOW_SESSION_CURSOR', 'sign', 1);

    expect(html).toContain('data-lang="javascript"');
    expect(html).toContain('<pre class="language-javascript">');
    expect(html).not.toContain('CHERRY_FLOW_SESSION_CURSOR');
  });

  it('uses a custom highlighter and wrapper renderer', () => {
    const highlighter = vi.fn((code: string, language: string) => `<b>${language}:${code}</b>`);
    const wrapperRender = vi.fn(
      (language: string, _code: string, html: string) => `<section data-language="${language}">${html}</section>`,
    );
    const { hook } = createCodeBlock({ highlighter }, { wrapperRender });
    const html = hook.renderCodeBlock('source', 'TEXT', 'sign', 1);

    expect(highlighter).toHaveBeenCalledWith('source', 'text');
    expect(wrapperRender).toHaveBeenCalledOnce();
    expect(html).toContain('<section data-language="text"><pre class="language-text">');
    expect(html).toContain('<b>text:source</b>');
  });

  it('adds an expansion mask for long non-Mermaid code', () => {
    const { hook } = createCodeBlock({ expandCode: true });
    const longCode = Array.from({ length: 12 }, (_, index) => `line ${index}`).join('\n');
    const html = hook.renderCodeBlock(longCode, 'text', 'sign', 12);
    const mermaid = hook.renderCodeBlock(longCode, 'mermaid', 'diagram', 12);

    expect(html).toContain('class="cherry-code-unExpand"');
    expect(html).toContain('cherry-mask-code-block');
    expect(mermaid).not.toContain('cherry-mask-code-block');
  });

  it('repairs multiline Prism spans before adding line wrappers', () => {
    const { hook } = createCodeBlock();
    const lines = hook.fillTag(['<span class="token string">first', 'second</span>', '', 'plain']);

    expect(lines).toEqual([
      '<span class="token string">first</span>',
      '<span class="token string">second</span>',
      '',
      'plain',
    ]);
    expect(hook.renderLineNumber('one\ntwo\n')).toBe(
      '<span class="code-line">one</span>\n<span class="code-line">two</span>',
    );
  });

  it('parses Mermaid size and alignment markers', () => {
    const { hook } = createCodeBlock();

    expect(hook.parseMermaidSize('mermaid #300px #40% #float-right')).toEqual({
      lang: 'mermaid',
      sizeAttrs: 'width:300px;height:40%;',
      alignClass: 'cherry-mermaid-align-float-right',
    });
    expect(hook.parseMermaidSize('javascript')).toEqual({ lang: 'javascript', sizeAttrs: '', alignClass: '' });
  });

  it('expands Mermaid shorthand without overriding explicitly registered languages', () => {
    const flowRenderer = { render: vi.fn(() => '<svg />'), constructor: {} };
    const { hook: defaultHook } = createCodeBlock();
    const { hook: customHook } = createCodeBlock({ customRenderer: { FLOW: flowRenderer } });

    expect(defaultHook.appendMermaid('A-->B', 'flow LR')).toEqual(['graph LR\nA-->B', 'mermaid']);
    expect(defaultHook.appendMermaid('A-->B', 'flow')).toEqual(['graph TD\nA-->B', 'mermaid']);
    expect(defaultHook.appendMermaid('A->>B', 'seq')).toEqual(['sequenceDiagram\nA->>B', 'mermaid']);
    expect(defaultHook.appendMermaid('stateDiagram-v2\nA --> B', 'mermaid')).toEqual([
      'stateDiagram\nA --> B',
      'mermaid',
    ]);
    expect(customHook.appendMermaid('A-->B', 'flow')).toEqual(['A-->B', 'flow']);
  });

  it('returns false for missing, invalid, and empty custom renderers', () => {
    const invalid = { render: 'not a function', constructor: {} };
    const empty = { render: vi.fn(() => ''), constructor: {} };
    const { hook } = createCodeBlock({
      customRenderer: {
        invalid,
        empty,
      },
    });
    const props = { sign: 'sign', lines: 2, lang: 'empty', mermaidSizeAttrs: '', mermaidAlignClass: '' };

    expect(hook.parseCustomLanguage('missing', 'source', props)).toBe(false);
    expect(hook.parseCustomLanguage('invalid', 'source', props)).toBe(false);
    expect(hook.parseCustomLanguage('empty', 'source', props)).toBe(false);
  });

  it('wraps custom renderer output and provides fallback/update callbacks', () => {
    let receivedOptions: CustomRenderOptions | undefined;
    const renderer = {
      render: vi.fn((_code: string, _sign: string, _engine: TestEngine, options: CustomRenderOptions | string) => {
        if (typeof options !== 'string') {
          receivedOptions = options;
        }
        return '<svg>preview</svg>';
      }),
      constructor: { TYPE: 'figure' },
    };
    const { hook } = createCodeBlock({ customRenderer: { diagram: renderer } });
    const props = {
      sign: 'diagram-sign',
      lines: 4,
      lang: 'diagram',
      mermaidSizeAttrs: 'width:300px;',
      mermaidAlignClass: 'cherry-mermaid-align-center',
    };

    const html = hook.parseCustomLanguage('diagram', 'source', props);
    const fallback = receivedOptions?.fallback();
    receivedOptions?.updateCache('<svg>updated</svg>');

    expect(html).toContain('<figure data-sign="diagram-sign" data-type="diagram" data-lines="4"');
    expect(html).toContain('style="width:300px;"');
    expect(html).toContain('class="cherry-mermaid-align-center"');
    expect(html).toContain('<svg>preview</svg>');
    expect(fallback).toContain('data-type="codeBlock"');
    expect(hook.popCache('diagram-sign')).toContain('<svg>updated</svg>');
  });

  it('passes the original language to an all-language renderer', () => {
    const render = vi.fn(() => '<div>custom</div>');
    const renderer = { render, constructor: {} };
    const { hook, engine } = createCodeBlock({ customRenderer: { all: renderer } });

    const html = hook.parseCustomLanguage('all', 'source', {
      sign: 'sign',
      lines: 2,
      lang: 'typescript',
      mermaidSizeAttrs: '',
      mermaidAlignClass: '',
    });

    expect(render).toHaveBeenCalledWith('source', 'sign', engine, 'typescript');
    expect(html).toContain('data-type="all"');
    expect(hook.formatLang('typescript')).toBe('all');
    expect(hook.formatLang('mermaid')).toBe('mermaid');
  });

  it('builds a localized Mermaid source/preview toolbar and removes flow cursor text', () => {
    let renderedSource = '';
    const renderer = {
      render: vi.fn((code: string) => {
        renderedSource = code;
        return '<svg>diagram</svg>';
      }),
      constructor: {},
    };
    const { hook } = createCodeBlock(
      {
        mermaid: { showSourceToolbar: true },
        customRenderer: { mermaid: renderer },
      },
      { flowSessionContext: true, flowSessionCursor: true },
    );

    const html = hook.parseCustomLanguage('mermaid', 'graph TD\nCHERRYFLOWSESSIONCURSOR', {
      sign: 'diagram',
      lines: 3,
      lang: 'mermaid',
      mermaidSizeAttrs: '',
      mermaidAlignClass: '',
    });

    expect(renderedSource).toBe('graph TD\n');
    expect(html).toContain('cherry-mermaid-source-toolbar');
    expect(html).toContain('data-mode="preview">Diagram</div>');
    expect(html).toContain('data-mode="source">Source code</div>');
    expect(html).toContain('<svg>diagram</svg>');
    expect(html).not.toContain('CHERRYFLOWSESSIONCURSOR');
  });

  it('uses fallback labels for the Mermaid source toolbar', () => {
    const renderer = { render: vi.fn(() => '<svg>diagram</svg>'), constructor: {} };
    const { hook } = createCodeBlock(
      { mermaid: { showSourceToolbar: true }, customRenderer: { mermaid: renderer } },
      { emptyLocales: true },
    );

    const html = hook.parseCustomLanguage('mermaid', 'graph TD', {
      sign: 'diagram',
      lines: 2,
      lang: 'mermaid',
      mermaidSizeAttrs: '',
      mermaidAlignClass: '',
    });

    expect(html).toContain('data-mode="preview">Preview</div>');
    expect(html).toContain('data-mode="source">Source</div>');
  });

  it('renders indented code and preserves disabled syntax verbatim', () => {
    const { hook } = createCodeBlock();
    const { hook: disabled } = createCodeBlock({ indentedCodeBlock: false });
    const markdown = '\n\n    <tag>\n    `inline`';
    const html = hook.restoreCache(hook.$getIndentCodeBlock(markdown));

    expect(html).toContain('<code class="indent-code">&lt;tag&gt;\n`inline`</code>');
    expect(disabled.$getIndentCodeBlock(markdown)).toBe(markdown);
    expect(disabled.$replaceCodeInIndent(markdown)).toBe(markdown);
    expect(disabled.$recoverCodeInIndent(markdown)).toBe(markdown);
    expect(hook.$recoverCodeInIndent(hook.$replaceCodeInIndent(markdown))).toBe(markdown);
  });

  it('auto-closes unfinished fenced blocks but leaves complete and plain text unchanged', () => {
    const { hook } = createCodeBlock();

    expect(hook.$dealUnclosingCode('plain text')).toBe('plain text');
    expect(hook.$dealUnclosingCode('```js\ncode\n```')).toBe('```js\ncode\n```');
    expect(hook.$dealUnclosingCode('```js\ncode')).toBe('```js\ncode\n```\n');
    expect(hook.$dealUnclosingCode('```js\n')).toBe('```js\n```\n');
    expect(hook.$dealUnclosingCode('```\n')).toBe('```\n```\n');
    expect(hook.$dealUnclosingCode('text\n```\n')).toBe('text\n');
  });

  it('preserves indentation and blockquote markers through fenced rendering', () => {
    const { hook } = createCodeBlock();
    const indented = restoreFencedCode(hook, '  ```javascript\n  const value = 1;\n  ```');
    const quoted = restoreFencedCode(hook, '> ```javascript\n> const value = 1;\n> ```');

    expect(indented).toContain('token keyword">const</span>');
    expect(indented).not.toContain('  const value');
    expect(quoted.trimStart().startsWith('>')).toBe(true);
    expect(quoted).not.toContain('&gt; const');
  });

  it.each(['#ff00aa', 'rgb(1, 2, 3)', 'hsl(120, 50%, 25%)'])('adds an inline swatch for %s', (color) => {
    const { hook } = createCodeBlock();
    hook.makeInlineCode(`\`${color}\``);
    const rendered = Object.values(CodeBlock.inlineCodeCache)[0];

    expect(rendered).toContain(`background:${color};`);
    expect(rendered).toContain('class="ch-inline-color"');
  });

  it('escapes inline code, respects disabled swatches, and auto-closes unfinished syntax', () => {
    const { hook } = createCodeBlock({}, { showInlineColor: false, inlineSelfClosing: true });
    const cacheKey = hook.makeInlineCode('`#ff00aa` and `open\n');
    const rendered = Object.values(CodeBlock.inlineCodeCache);

    expect(cacheKey).toMatch(/~~CODE\w+\$/);
    expect(rendered.some((html) => html.includes('#ff00aa'))).toBe(true);
    expect(rendered.every((html) => !html.includes('ch-inline-color'))).toBe(true);
    expect(rendered.some((html) => html.includes('open'))).toBe(true);
  });

  it('uses the default inline color behavior and skips unnecessary auto-close', () => {
    const { hook } = createCodeBlock({}, { omitInlineColor: true, inlineSelfClosing: true });

    hook.makeInlineCode('`#abcdef`');
    const stable = hook.makeInlineCode('already closed `value`\n');

    expect(Object.values(CodeBlock.inlineCodeCache).some((html) => html.includes('ch-inline-color'))).toBe(true);
    expect(stable).not.toContain('`value``');
  });

  it('converts fenced math and renders a custom fenced plugin through the main pipeline', () => {
    const renderer = { render: vi.fn(() => '<svg>plugin</svg>'), constructor: {} };
    const { hook: mathHook } = createCodeBlock();
    const { hook: pluginHook } = createCodeBlock({ customRenderer: { diagram: renderer } });

    expect(mathHook.beforeMakeHtml('```math\nx^2\n```')).toContain('~D~D\nx^2\n~D~D');
    const pluginHtml = restoreFencedCode(pluginHook, '```diagram\nA-->B\n```');

    expect(pluginHtml).toContain('data-type="diagram"');
    expect(pluginHtml).toContain('<svg>plugin</svg>');
  });

  it('renders ECharts custom blocks without storing the custom parser result cache', () => {
    const renderer = { render: vi.fn(() => '<div class="echarts-result">chart</div>'), constructor: {} };
    const { hook } = createCodeBlock({ customRenderer: { echarts: renderer } });

    const first = restoreFencedCode(hook, '```echarts\noption = {}\n```');
    const second = restoreFencedCode(hook, '```echarts\noption = {}\n```');

    expect(first).toContain('class="echarts-result"');
    expect(second).toContain('class="echarts-result"');
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });
});
