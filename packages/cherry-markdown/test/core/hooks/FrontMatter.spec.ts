import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import FrontMatter from '../../../src/core/hooks/FrontMatter';
import { hashHex } from '../../../src/utils/hash';

function createFrontMatter() {
  const previewer = document.createElement('div');
  const hook = new FrontMatter({});
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      $cherry: {
        previewer: {
          getDom: () => previewer,
        },
      },
    },
  });
  return { hook, previewer };
}

describe('core/hooks/FrontMatter', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('renders JSON front matter as escaped metadata', () => {
    const { hook } = createFrontMatter();
    const markdown = '---\n{"title":"A < B","draft":true}\n---\nbody';
    const processed = hook.beforeMakeHtml(markdown);
    const html = hook.restoreCache(processed);

    expect(html).toContain('data-type="frontMatter"');
    expect(html).toContain('data-lines="3"');
    expect(html).toContain('data-content="{&quot;title&quot;:&quot;A &lt; B&quot;,&quot;draft&quot;:true}"');
    expect(html).toContain('\nbody');
  });

  it('parses key-value front matter and updates kebab-case font size', () => {
    const { hook, previewer } = createFrontMatter();
    const html = hook.restoreCache(hook.beforeMakeHtml('---\ntitle: Cherry\nfont-size: 18px\n---\n'));

    expect(previewer.style.fontSize).toBe('18px');
    expect(html).toContain('&quot;title&quot;:&quot;Cherry&quot;');
    expect(html).toContain('&quot;font-size&quot;:&quot;18px&quot;');
  });

  it('updates camel-case font size from JSON front matter', () => {
    const { hook, previewer } = createFrontMatter();

    hook.beforeMakeHtml('---\n{"fontSize":"20px"}\n---\n');

    expect(previewer.style.fontSize).toBe('20px');
  });

  it('ignores malformed lines and keys longer than the supported limit', () => {
    const { hook } = createFrontMatter();
    const longKey = 'k'.repeat(1025);
    const html = hook.restoreCache(
      hook.beforeMakeHtml(`---\ninvalid line\n${longKey}: ignored\nvalid: retained\n---\n`),
    );

    expect(html).toContain('&quot;valid&quot;:&quot;retained&quot;');
    expect(html).not.toContain('ignored');
    expect(html).not.toContain('invalid line');
  });

  it('leaves empty or non-front-matter documents unchanged', () => {
    const { hook } = createFrontMatter();
    const empty = '---\ninvalid\n---\n';

    expect(hook.beforeMakeHtml(empty)).toBe(empty);
    expect(hook.beforeMakeHtml('# Heading')).toBe('# Heading');
    expect(hook.makeHtml('already processed', () => ({ html: '' }))).toBe('already processed');
  });
});
