import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Image from '../../../src/core/hooks/Image';
import UrlCache from '../../../src/UrlCache';

interface ImageConfig {
  videoWrapper?: (url: string, type: string, html: string) => string;
}

function createImage(
  config: ImageConfig = {},
  beforeImageMounted?: (srcProp: string, source: string) => { srcProp?: string; src?: string },
) {
  const urlProcessor = vi.fn((url: string, type: string) => `${type}/${url}`);
  const hook = new Image({ config, globalConfig: {} });
  Object.defineProperty(hook, '$engine', {
    value: {
      urlProcessor,
      $cherry: {
        options: {
          callback: beforeImageMounted ? { beforeImageMounted } : {},
        },
      },
    },
  });
  return { hook, urlProcessor };
}

function render(hook: Image, markdown: string) {
  return UrlCache.restoreAll(hook.makeHtml(markdown));
}

describe('core/hooks/Image', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
    UrlCache.clear();
  });

  it('renders image source, alt text, and title through the URL processor', () => {
    const { hook, urlProcessor } = createImage();
    const html = render(hook, 'before ![A < B](https://example.com/a%20b.png "A title") after');

    expect(html).toContain('before <img src="image/https://example.com/a%20b.png"');
    expect(html).toContain('alt="A &lt; B"');
    expect(html).toContain('title="A title"');
    expect(html).toContain('/> after');
    expect(urlProcessor).toHaveBeenCalledWith('https://example.com/a%20b.png', 'image');
  });

  it('renders size, decoration, alignment, and explicit attributes', () => {
    const { hook } = createImage();
    const html = render(
      hook,
      '![preview #300px #200px #border #shadow #radius #center](image.png){loading=lazy width=50 data-name=a&b}',
    );

    expect(html).toContain('style="width:300px;height:200px;');
    expect(html).toContain('border:1px solid #888888');
    expect(html).toContain('box-shadow:0 2px 15px -5px');
    expect(html).toContain('border-radius: 15px');
    expect(html).toContain('transform:translateX(-50%)');
    expect(html).toContain('cherry-img-deco-border');
    expect(html).toContain('cherry-img-deco-shadow');
    expect(html).toContain('cherry-img-deco-radius');
    expect(html).toContain('cherry-img-align-center');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="50"');
    expect(html).toContain('data-name="a&amp;b"');
  });

  it('allows beforeImageMounted to replace the source attribute and URL', () => {
    const beforeImageMounted = vi.fn(() => ({ srcProp: 'data-src', src: 'lazy image.png' }));
    const { hook, urlProcessor } = createImage({}, beforeImageMounted);
    const html = render(hook, '![lazy](original.png)');

    expect(beforeImageMounted).toHaveBeenCalledWith('src', 'original.png');
    expect(urlProcessor).toHaveBeenCalledWith('lazy image.png', 'image');
    expect(html).toContain('data-src="image/lazy%20image.png"');
    expect(html).not.toContain(' src=');
  });

  it('falls back to the original source values when the mount callback returns an empty result', () => {
    const { hook } = createImage({}, () => ({}));

    expect(render(hook, '![fallback](original.png)')).toContain('src="image/original.png"');
  });

  it('leaves unresolved image references and escaped image syntax unchanged', () => {
    const { hook } = createImage();

    expect(render(hook, '![missing][reference]')).toBe('![missing][reference]');
    expect(render(hook, '\\![escaped](image.png)')).toBe('\\![escaped](image.png)');
    expect(render(hook, 'plain text')).toBe('plain text');
  });

  it('renders empty image alt text without adding optional attributes', () => {
    const { hook } = createImage();
    const html = render(hook, '![](image.png)');

    expect(html).toContain('alt=""');
    expect(html).not.toContain(' title=');
    expect(html).not.toContain(' style=');
    expect(html).not.toContain(' class=');
  });

  it.each(['video', 'audio'])('renders %s media with controls, title, and escaped alt text', (type) => {
    const { hook, urlProcessor } = createImage();
    const html = render(hook, `!${type}[A < B](media%20file.mp4 "Media title")`);

    expect(html).toContain(`<${type} src="${type}/media%20file.mp4"`);
    expect(html).toContain('title="&quot;Media title&quot;"');
    expect(html).toContain('controls="controls">A &lt; B');
    expect(html).toContain(`</${type}>`);
    expect(urlProcessor).toHaveBeenCalledWith('media%20file.mp4', type);
  });

  it('renders video poster and wrapper configuration', () => {
    const videoWrapper = vi.fn(
      (url: string, type: string, html: string) => `<figure data-url="${url}" data-type="${type}">${html}</figure>`,
    );
    const { hook } = createImage({ videoWrapper });
    const html = render(hook, '!video[Demo #400px #right](movie.mp4){poster=poster image.jpg}');

    expect(videoWrapper).toHaveBeenCalledWith('movie.mp4', 'video', expect.stringContaining('<video'));
    expect(html).toContain('<figure data-url="movie.mp4" data-type="video">');
    expect(html).toContain('poster="poster%20image.jpg"');
    expect(html).toContain('style="width:400px;');
    expect(html).toContain('cherry-img-align-right');
  });

  it('renders media with empty alt text and no wrapper', () => {
    const { hook } = createImage();
    const html = render(hook, '!audio[](sound.mp3)');

    expect(html).toContain('<audio src="audio/sound.mp3"');
    expect(html).toContain('controls="controls"></audio>');
    expect(html).not.toContain('title=');
  });

  it('leaves unsupported and unresolved media syntax unchanged', () => {
    const { hook } = createImage();

    expect(hook.toMediaHtml('!file[a](b)', '', 'file', 'a', 'b', '', '', '', '')).toBe('!file[a](b)');
    expect(hook.replaceToHtml('video', '!video[a][ref]', '', 'a', undefined, '', '')).toBe('!video[a][ref]');
  });
});
