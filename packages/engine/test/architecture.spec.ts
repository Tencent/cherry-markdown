import { beforeEach, describe, expect, it } from 'vite-plus/test';
import CherryEngine, { createSyntaxHook, Sanitizer } from '../src/index';

describe('@cherry-markdown/engine architecture contract', () => {
  beforeEach(() => {
    // @ts-expect-error build constant
    globalThis.BUILD_ENV = 'production';
  });

  it('registers a syntax hook without an editor dependency', () => {
    const MarkHook = createSyntaxHook('testMark', 'sentence', {
      rule: () => ({ reg: /==(.+?)==/g }),
      makeHtml: (text: string) => text.replace(/==(.+?)==/g, '<mark>$1</mark>'),
    });
    const engine = new CherryEngine({ engine: { customSyntax: { MarkHook } } });

    expect(engine.makeHtml('==engine hook==')).toContain('<mark>engine hook</mark>');
  });

  it('sanitizes executable html in the browser implementation', () => {
    const clean = Sanitizer.sanitize('<p>safe</p><script>alert(1)</script>');

    expect(clean).toContain('<p>safe</p>');
    expect(clean).not.toContain('<script>');
  });
});
