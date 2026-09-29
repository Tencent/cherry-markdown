import { describe, expect, it } from 'vitest';
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
});
