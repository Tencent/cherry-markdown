import { beforeEach, describe, expect, it, vi } from 'vitest';
import Footnote from '../../../src/core/hooks/Footnote';
import { hashHex } from '../../../src/utils/hash';

interface RefNumberConfig {
  appendClass?: string;
  render: (number: number, title: string) => string;
}

interface RefListTitleConfig {
  appendClass?: string;
  render: () => string;
}

interface RefListItemConfig {
  appendClass?: string;
  render: (number: number, title: string, content: string, renderReference: () => string) => string;
}

interface RefListConfig {
  appendClass?: string;
  title: RefListTitleConfig;
  listItem: RefListItemConfig;
}

interface FootnoteConfig {
  selfClosing: boolean;
  refNumber: RefNumberConfig;
  refList: RefListConfig | false;
  bubbleCard: boolean | Record<string, string>;
}

interface FootnoteFixtureOptions {
  config?: Partial<FootnoteConfig>;
  flowSessionContext?: boolean;
  localeTitle?: string | null;
}

function defaultRefList(): RefListConfig {
  return {
    appendClass: '',
    title: { appendClass: '', render: () => '' },
    listItem: {
      appendClass: '',
      render: (_number, _title, content, renderReference) => `${renderReference()}${content}`,
    },
  };
}

function createFootnote({
  config = {},
  flowSessionContext = false,
  localeTitle = 'Footnotes',
}: FootnoteFixtureOptions = {}) {
  const resolvedConfig: FootnoteConfig = {
    selfClosing: false,
    refNumber: { appendClass: '', render: (number) => `[${number}]` },
    refList: defaultRefList(),
    bubbleCard: false,
    ...config,
  };
  const cherry = {
    options: { engine: { global: { flowSessionContext } } },
  };
  const hook = new Footnote({ externals: {}, config: resolvedConfig, cherry });
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      makeHtmlForFootnote: (markdown: string) => markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
      $cherry: { locale: { footnoteTitle: localeTitle } },
    },
  });
  return hook;
}

describe('core/hooks/Footnote', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('stores, retrieves, and clears definition and reference state', () => {
    const hook = createFootnote();

    expect(hook.getFootnoteCache('missing')).toBeNull();
    hook.pushFootnoteCache('note', 'content');
    expect(hook.getFootnoteCache('note')).toBe('content');
    hook.pushFootNote('note', 'content');

    hook.$cleanCache();

    expect(hook.getFootnoteCache('note')).toBeNull();
    expect(hook.getFootNote()).toEqual([]);
    expect(hook.footnoteMap).toEqual({});
  });

  it('creates one footnote for duplicate references and normalizes quoted titles', () => {
    const hook = createFootnote({
      config: {
        refNumber: { appendClass: 'custom-ref', render: (number, title) => `${title}-${number}` },
        bubbleCard: {},
      },
    });
    const first = hook.pushFootNote('a"b', ' **body** ');
    const duplicate = hook.pushFootNote('a"b', 'ignored');
    const [note] = hook.getFootNote();

    expect(duplicate).toBe(first);
    expect(hook.getFootNote()).toHaveLength(1);
    expect(note.fn).toContain('title="a\'b"');
    expect(note.fn).toContain('class="footnote custom-ref cherry-show-bubble-card"');
    expect(note.fn).toContain("a'b-1");
    expect(note.note).toContain('<strong>body</strong>');
  });

  it('falls back to default number and reference-link content for empty renderers', () => {
    const hook = createFootnote({
      config: {
        refNumber: { render: () => '' },
        refList: {
          title: { render: () => '' },
          listItem: { render: () => '' },
        },
      },
    });
    hook.pushFootNote('note', ' body ');
    const [note] = hook.getFootNote();

    expect(note.fn).toContain('>[1]</a>');
    expect(note.note).toContain('class="footnote-ref ">[1]</a>body');
  });

  it('supports a custom list item renderer and its reference callback', () => {
    const render = vi.fn(
      (number: number, title: string, content: string, renderReference: () => string) =>
        `<section data-number="${number}" data-title="${title}">${renderReference()}<em>${content.trim()}</em></section>`,
    );
    const hook = createFootnote({
      config: {
        refList: {
          appendClass: 'custom-list',
          title: { appendClass: 'custom-title', render: () => 'References' },
          listItem: { appendClass: 'custom-item', render },
        },
      },
    });
    hook.pushFootNote('note', ' body ');
    const html = hook.formatFootNote();

    expect(render).toHaveBeenCalledOnce();
    expect(html).toContain('class="footnote custom-list "');
    expect(html).toContain('class="footnote-title custom-title">References</div>');
    expect(html).toContain('class="one-footnote custom-item"');
    expect(html).toContain('<section data-number="1" data-title="note">');
    expect(html).toContain('<em>body</em>');
  });

  it('renders a configured list title once without falling back to the locale title', () => {
    const renderTitle = vi.fn(() => 'References');
    const hook = createFootnote({
      localeTitle: 'Footnotes from locale',
      config: {
        refList: {
          appendClass: '',
          title: { appendClass: 'custom-title', render: renderTitle },
          listItem: defaultRefList().listItem,
        },
      },
    });

    const html = hook.beforeMakeHtml('Text[^note].\n\n[^note]: body');

    expect(renderTitle).toHaveBeenCalledOnce();
    expect(html).toContain('class="footnote-title custom-title">References</div>');
    expect(html).not.toContain('Footnotes from locale');
  });

  it('does not render a title when the configured title renderer is empty', () => {
    const hook = createFootnote({ localeTitle: 'Footnotes from locale' });

    const html = hook.beforeMakeHtml('Text[^note].\n\n[^note]: body');

    expect(html).not.toContain('footnote-title');
    expect(html).not.toContain('Footnotes from locale');
  });

  it('marks the reference list as hidden when refList is disabled', () => {
    const hook = createFootnote({ config: { refList: false } });

    const html = hook.beforeMakeHtml('Text[^note].\n\n[^note]: body');

    expect(html).toMatch(/class="footnote\s+hidden"/);
    expect(html).not.toContain('footnote-title');
  });

  it('does not render a reference list when the document has no footnotes', () => {
    const hook = createFootnote();

    expect(hook.beforeMakeHtml('Plain paragraph.')).not.toContain('class="footnote');
  });

  it('uses the default number inside custom reference callbacks when number rendering is empty', () => {
    const hook = createFootnote({
      config: {
        refNumber: { render: () => '' },
        refList: {
          title: { render: () => 'References' },
          listItem: { render: (_number, _title, _content, renderReference) => renderReference() },
        },
      },
    });

    hook.pushFootNote('note', 'body');

    expect(hook.getFootNote()[0].note).toContain('class="footnote-ref ">[1]</a>');
  });

  it('extracts multiline definitions, preserves line count, and resolves repeated references', () => {
    const hook = createFootnote();
    const markdown = 'First[^note], second[^note].\n\n[^note]: line one\n  line two';
    const prepared = hook.beforeMakeHtml(markdown);
    const html = hook.afterMakeHtml(prepared);

    expect(prepared).not.toContain('[^note]:');
    expect(prepared.match(/\0~fn#0#\0/g)).toHaveLength(2);
    expect(html.match(/class="cherry-footnote-number"/g)).toHaveLength(2);
    expect(html).toContain('line one\n  line two');
    expect(html).toContain('class="one-footnote "');
  });

  it('removes a single-line definition without introducing a newline', () => {
    const hook = createFootnote();

    expect(hook.beforeMakeHtml('[^note]: body')).toBe('');
    expect(hook.getFootnoteCache('note')).toBe('body');
  });

  it('leaves undefined references unchanged outside self-closing modes', () => {
    const hook = createFootnote();

    expect(hook.beforeMakeHtml('Unknown[^later].')).toBe('Unknown[^later].');
  });

  it('numbers repeated undefined references consistently in self-closing mode', () => {
    const hook = createFootnote({
      config: {
        selfClosing: true,
        refNumber: { appendClass: 'draft-ref', render: (number, title) => `${title}-${number}` },
      },
    });
    const html = hook.beforeMakeHtml('First[^a"b], again[^a"b], next[^next].');

    expect(html.match(/href="#fn:1"/g)).toHaveLength(2);
    expect(html.match(/href="#fn:2"/g)).toHaveLength(1);
    expect(html).toContain('class="footnote draft-ref"');
    expect(html).toContain("a'b-1");
    expect(hook.getFootNote()).toEqual([]);
  });

  it('enables undefined references in flow-session context', () => {
    const hook = createFootnote({ flowSessionContext: true });

    expect(hook.beforeMakeHtml('Draft[^later].')).toContain('href="#fn:1"');
  });

  it('uses the default number for undefined self-closing references when number rendering is empty', () => {
    const hook = createFootnote({
      config: {
        selfClosing: true,
        refNumber: { render: () => '' },
      },
    });

    expect(hook.beforeMakeHtml('Draft[^later].')).toContain('class="footnote ">[1]</a>');
  });

  it('keeps makeHtml stable and replaces stored placeholders after rendering', () => {
    const hook = createFootnote();
    const placeholder = hook.pushFootNote('note', 'body');

    expect(hook.makeHtml('unchanged')).toBe('unchanged');
    expect(hook.afterMakeHtml(placeholder)).toContain('class="cherry-footnote-number"');
  });
});
