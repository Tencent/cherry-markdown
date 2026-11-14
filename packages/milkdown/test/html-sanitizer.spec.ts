import { describe, expect, it } from 'vite-plus/test';
import { sanitizedEngineFragment } from '../src/wysiwyg/html-sanitizer';

function mount(fragment: DocumentFragment) {
  const root = document.createElement('div');
  root.append(fragment);
  return root;
}

describe('Cherry renderer HTML boundary', () => {
  it('removes executable content from trusted Cherry renderer output', () => {
    const root = mount(
      sanitizedEngineFragment(
        '<div onclick="run()"><script>run()</script><iframe src="https://example.com"></iframe><a href="javascript:run()">link</a></div>',
      ),
    );

    expect(root.querySelector('script, iframe')).toBeNull();
    expect(root.querySelector('div')?.hasAttribute('onclick')).toBe(false);
    expect(root.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(root.textContent).toBe('link');
  });

  it('applies the authored HTML allowlist without stripping safe Cherry-compatible styling', () => {
    const root = mount(
      sanitizedEngineFragment(
        '<article data-private="x"><span class="safe" style="color:red;position:fixed">Text</span><span class="unsafe" style="background:url(x)">Unsafe</span></article>',
        false,
        true,
      ),
    );

    expect(root.querySelector('article')).toBeNull();
    const span = root.querySelector('span');
    expect(span?.className).toBe('safe');
    expect(span?.style.color).toBe('red');
    expect(span?.style.position).toBe('');
    expect(root.querySelector<HTMLElement>('.unsafe')?.hasAttribute('style')).toBe(false);
  });

  it('unwraps a single paragraph for inline renderer output', () => {
    const root = mount(sanitizedEngineFragment('<p><strong>Inline</strong></p>', true));

    expect(root.querySelector(':scope > p')).toBeNull();
    expect(root.querySelector(':scope > strong')?.textContent).toBe('Inline');
  });

  it('removes data links while retaining image data sources and ordinary links', () => {
    const root = mount(
      sanitizedEngineFragment(
        '<a href="data:image/svg+xml,%3Csvg%3E">unsafe</a><a href="https://example.com">safe</a>' +
          '<img src="data:image/png;base64,AA=="><svg><a xlink:href="data:image/svg+xml,%3Csvg%3E">svg</a></svg>',
      ),
    );
    expect(root.querySelectorAll('a')[0]?.hasAttribute('href')).toBe(false);
    expect(root.querySelectorAll('a')[1]?.getAttribute('href')).toBe('https://example.com');
    expect(root.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AA==');
    expect(root.querySelector('svg a')?.hasAttribute('xlink:href')).toBe(false);
  });

  it.each(['u\\72l', 'u\\000072 l', '\\75\\72\\6c'])('rejects escaped URL function %s in a CSS variable', (url) => {
    const root = mount(sanitizedEngineFragment(`<span style="--image:${url}(https://example.com/pixel)">Text</span>`));
    expect(root.querySelector('span')?.hasAttribute('style')).toBe(false);
  });

  it.each(['image-set', '-webkit-image-set', 'image-\\73 et'])(
    'rejects %s with a URL supplied through a CSS variable',
    (imageSet) => {
      const root = mount(
        sanitizedEngineFragment(
          `<span style="--image:'https://example.com/pixel';background-image:${imageSet}(var(--image) 1x)">Text</span>`,
        ),
      );
      expect(root.querySelector('span')?.hasAttribute('style')).toBe(false);
    },
  );

  it('removes SVG animations that can assign executable URLs while preserving diagram labels', () => {
    const root = mount(
      sanitizedEngineFragment(
        '<svg xmlns="http://www.w3.org/2000/svg"><style>.label{color:red}</style>' +
          '<a><animate attributeName="href" values="javascript:run()"/>' +
          '<set attributeName="href" to="javascript:run()"/><animateMotion/><animateTransform/><animateColor/><discard/>' +
          '<text>Link</text></a>' +
          '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">Diagram label</div></foreignObject></svg>',
        false,
        false,
        { allowRendererStyles: true },
      ),
    );

    expect(root.querySelector('animate, set, animateMotion, animateTransform, animateColor, discard')).toBeNull();
    expect(root.querySelector('svg style')).not.toBeNull();
    expect(root.querySelector('foreignObject')?.textContent).toBe('Diagram label');
    expect(root.querySelector('svg a text')?.textContent).toBe('Link');
  });

  it('removes stylesheets from engine output, including SVG styles and links', () => {
    const root = mount(
      sanitizedEngineFragment(
        '<svg><style>body{color:red}</style><text>label</text></svg><link rel="stylesheet" href="/probe.css">',
      ),
    );
    expect(root.querySelector('style, link')).toBeNull();
    expect(root.querySelector('svg text')?.textContent).toBe('label');
  });

  it('removes unsafe Engine positioning but preserves Cherry relative positioning', () => {
    for (const position of ['fixed', 'sticky', 'absolute', 'var(--position)']) {
      const root = mount(sanitizedEngineFragment(`<span style="position:${position};color:red">Text</span>`));
      expect(root.querySelector('span')?.style.position).toBe('');
      expect(root.querySelector('span')?.style.color).toBe('red');
    }
    const root = mount(sanitizedEngineFragment('<div style="position:relative">Code</div>'));
    expect(root.querySelector('div')?.style.position).toBe('relative');
    const renderer = mount(
      sanitizedEngineFragment('<div style="position:absolute">Chart</div>', false, false, {
        allowRendererStyles: true,
      }),
    );
    expect(renderer.querySelector('div')?.style.position).toBe('absolute');
  });
});
