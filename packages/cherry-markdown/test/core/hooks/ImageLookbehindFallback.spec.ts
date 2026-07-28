import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import UrlCache from '../../../src/UrlCache';
import Image from '../../../src/core/hooks/Image';

vi.mock('../../../src/utils/regexp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/regexp')>();
  return {
    ...actual,
    isLookbehindSupported: () => false,
  };
});

function createImage() {
  const hook = new Image({ config: {}, globalConfig: {} });
  Object.defineProperty(hook, '$engine', {
    value: {
      urlProcessor: (url: string, type: string) => `${type}/${url}`,
      $cherry: { options: { callback: {} } },
    },
  });
  return hook;
}

describe('core/hooks/Image lookbehind fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
    UrlCache.clear();
  });

  it('renders images without RegExp lookbehind support', () => {
    const html = UrlCache.restoreAll(createImage().makeHtml('prefix ![alt](image.png) suffix'));

    expect(html).toContain('prefix <img src="image/image.png"');
    expect(html).toContain('alt="alt"');
  });

  it('renders media without RegExp lookbehind support', () => {
    const html = UrlCache.restoreAll(createImage().makeHtml('prefix !video[demo](movie.mp4) suffix'));

    expect(html).toContain('prefix <video src="video/movie.mp4"');
    expect(html).toContain('controls="controls">demo</video>');
  });
});
