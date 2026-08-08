import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Header from '../../../src/core/hooks/Header';
import { hashHex } from '../../../src/utils/hash';

interface HeaderConfig {
  strict?: boolean;
  anchorStyle?: 'default' | 'none';
}

interface HeaderOptions {
  config?: HeaderConfig;
  space?: boolean;
  selfClosing?: boolean;
  flowSessionContext?: boolean;
}

const sentenceMake = (markdown: string) => ({
  html: markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
  sign: hashHex(markdown),
});

function createHeader({
  config = {},
  space = false,
  selfClosing = false,
  flowSessionContext = false,
}: HeaderOptions = {}) {
  const cherry = {
    options: {
      engine: {
        global: { flowSessionContext },
        syntax: {
          space,
          header: { selfClosing },
        },
      },
    },
  };
  const hook = new Header({ config, cherry });
  Object.defineProperty(hook, '$engine', {
    value: {
      $cherry: cherry,
      hash: (value: string) => hashHex(value),
    },
  });
  return hook;
}

function renderHeader(hook: Header, markdown: string) {
  const prepared = hook.beforeMakeHtml(markdown);
  const rendered = hook.makeHtml(prepared, sentenceMake);
  return hook.afterMakeHtml(rendered);
}

describe('core/hooks/Header', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('parses visible title text and rejects non-string values', () => {
    const hook = createHeader();
    const defaults = new Header();

    expect(hook.$parseTitleText('<strong>A</strong> &#60;B&#62;')).toBe('A <B>');
    expect(Reflect.apply(hook.$parseTitleText, hook, [42])).toBe('');
    expect(hook.$parseTitleText()).toBe('');
    expect(defaults.strict).toBe(true);
    expect(defaults.config).toEqual({});
  });

  it('generates normalized IDs for ASCII, separators, Unicode, and malformed surrogates', () => {
    const hook = createHeader();

    expect(hook.$generateId(' Hello__WORLD - 42 ')).toBe('-hello-world-42-');
    expect(hook.$generateId('AbC', false)).toBe('AbC');
    expect(hook.$generateId('标题')).toBe('%E6%A0%87%E9%A2%98');
    expect(hook.$generateId(`a\ud800b`)).toBe('ab');
    expect(hook.$generateId('a.!?b')).toBe('ab');
  });

  it('adds deterministic suffixes to duplicate generated IDs', () => {
    const hook = createHeader();

    expect(hook.generateIDNoDup('Same')).toBe('same');
    expect(hook.generateIDNoDup('Same')).toBe('same-2');
    expect(hook.generateIDNoDup('Same')).toBe('same-3');
    expect(hook.generateIDNoDup('&#60;Same&#62;')).toBe('same-4');
  });

  it('wraps headings with generated, custom, and footnote-free IDs', () => {
    const hook = createHeader();
    const generated = hook.$wrapHeader('  **Hello**  ', 2, '1,2', sentenceMake).html;
    const custom = hook.$wrapHeader('Custom title {#chosen-id}', 3, '3,4', sentenceMake).html;
    const footnote = hook.$wrapHeader('Title~fn#12#', 4, '5,6', sentenceMake).html;

    expect(generated).toContain('<h2 id="safe_hello"');
    expect(generated).toContain('<a class="anchor" href="#hello"></a><strong>Hello</strong>');
    expect(custom).toContain('<h3 id="safe_chosen-id"');
    expect(custom).not.toContain('{#chosen-id}');
    expect(footnote).toContain('<h4 id="safe_title"');
    expect(footnote).toContain('Title~fn#12#');
  });

  it('preserves configured heading spacing and can omit anchors', () => {
    const hook = createHeader({ config: { anchorStyle: 'none' }, space: true });
    const { html } = hook.$wrapHeader('  spaced  ', 1, '1,1', sentenceMake);

    expect(html).toContain('> spaced  </h1>');
    expect(html).not.toContain('class="anchor"');
  });

  it('renders ATX and Setext headings with closing markers removed', () => {
    const hook = createHeader();
    const html = renderHeader(hook, '# First #\n\nSecond\n---\n\nTop\n===');

    expect(html).toContain('<h1 id="safe_first"');
    expect(html).toContain('>First</h1>');
    expect(html).toContain('<h2 id="safe_second"');
    expect(html).toContain('>Second</h2>');
    expect(html).toContain('<h1 id="safe_top"');
    expect(html).toContain('>Top</h1>');
  });

  it('requires whitespace after ATX markers only in strict mode', () => {
    const strict = createHeader({ config: { strict: true } });
    const relaxed = createHeader({ config: { strict: false } });

    expect(renderHeader(strict, '#compact')).toBe('#compact');
    expect(renderHeader(relaxed, '#compact')).toContain('<h1 id="safe_compact"');
    expect(strict.test('# title', 'atx')).toBe(true);
    expect(strict.test('plain', 'atx')).toBe(false);
    expect(strict.test('Title\n===', 'setext')).toBe(true);
  });

  it('leaves empty headings and cached Setext content unchanged', () => {
    const hook = createHeader();
    const empty = hook.beforeMakeHtml('#   ');
    const cache = hook.pushCache('<span>cached</span>');
    const rendered = hook.makeHtml(`${cache}\n---`, sentenceMake);

    expect(empty).toBe('#   ');
    expect(hook.beforeMakeHtml(`${cache}\n---`)).toContain('---');
    expect(rendered).toMatch(/~~C\d+I\w+_L2\$/);
    expect(hook.afterMakeHtml(rendered)).toContain('<h2 id="safe_cached"');
  });

  it('does not turn another paragraph hook cache into a Setext heading', () => {
    const hook = createHeader();
    const foreignCache = '~~C999999Iabcdef$';

    expect(hook.makeHtml(`${foreignCache}\n---`, sentenceMake)).toBe(`${foreignCache}\n---`);
  });

  it('normalizes unfinished headings in self-closing and flow-session modes', () => {
    const selfClosing = createHeader({ selfClosing: true });
    const flow = createHeader({ flowSessionContext: true });

    expect(selfClosing.beforeMakeHtml('text\n-')).not.toBe('text\n-');
    expect(selfClosing.beforeMakeHtml('text\n###')).toBe('text\n');
    expect(flow.beforeMakeHtml('text\n### CHERRYFLOWSESSIONCURSOR')).toBe('text\nCHERRYFLOWSESSIONCURSOR');
  });

  it('resets duplicate-ID tracking after final rendering', () => {
    const hook = createHeader();

    expect(renderHeader(hook, '# Same\n\n# Same')).toContain('id="safe_same-2"');
    expect(hook.headerIDCache).toEqual([]);
    expect(hook.headerIDCounter).toEqual({});
    expect(renderHeader(hook, '# Same')).toContain('id="safe_same"');
  });
});
