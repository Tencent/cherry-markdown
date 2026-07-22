import { describe, expect, it, vi } from 'vitest';
import Link from '../../../src/core/hooks/Link';
import UrlCache from '../../../src/UrlCache';

vi.mock('../../../src/utils/regexp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/regexp')>();
  return {
    ...actual,
    isLookbehindSupported: () => false,
  };
});

function createLink() {
  const hook = new Link({ config: {}, globalConfig: {} });
  Object.defineProperty(hook, '$engine', {
    value: {
      urlProcessor: (url: string) => url,
      $cherry: {
        options: {
          engine: {
            syntax: {
              link: { attrRender: () => '' },
            },
          },
        },
      },
    },
  });
  return hook;
}

describe('core/hooks/Link lookbehind fallback', () => {
  it('renders links and preserves escaped links without RegExp lookbehind support', () => {
    const hook = createLink();
    const html = UrlCache.restoreAll(hook.makeHtml('before [text](https://example.com)'));

    expect(html).toContain('before <a href="https://example.com"');
    expect(html).toContain('>text</a>');
    expect(hook.makeHtml('\\[escaped](https://example.com)')).toBe('\\[escaped](https://example.com)');
  });
});
