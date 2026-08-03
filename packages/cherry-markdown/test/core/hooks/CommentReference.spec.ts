import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UrlCache from '../../../src/UrlCache';
import CommentReference from '../../../src/core/hooks/CommentReference';

function createCommentReference() {
  return new CommentReference({ externals: {}, config: {} });
}

describe('core/hooks/CommentReference', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  afterEach(() => {
    UrlCache.clear();
  });

  it.each([
    [' <https://example.com/docs> ', 'https://example.com/docs'],
    ['&#60;https://example.com/entity&#62;', 'https://example.com/entity'],
    ['https://example.com/plain', 'https://example.com/plain'],
  ])('unwraps reference URL %s', (wrapped, expected) => {
    expect(createCommentReference().unwrapUrl(wrapped)).toBe(expected);
  });

  it('stores references case-insensitively while preserving title arguments', () => {
    const hook = createCommentReference();

    hook.pushCommentReferenceCache('Docs', '<https://example.com/guide> "Guide title"');
    const cached = hook.getCommentReferenceCache('DOCS');

    expect(cached).toMatch(/^cherry-inner:\/\/[0-9a-f]+ "Guide title"$/);
    expect(hook.afterMakeHtml(cached ?? '')).toBe('https://example.com/guide "Guide title"');
    expect(hook.getCommentReferenceCache('missing')).toBeNull();

    hook.$cleanCache();
    expect(hook.getCommentReferenceCache('docs')).toBeNull();
  });

  it('expands full and collapsed references and removes their definitions', () => {
    const hook = createCommentReference();
    const markdown =
      'Read [Cherry guide][DOCS] and [docs].\n\n[docs]: <https://example.com/guide?q=1> "Guide"\nUnknown [missing].';
    const transformed = hook.beforeMakeHtml(markdown);
    const restored = hook.afterMakeHtml(transformed);

    expect(restored).toContain('[Cherry guide](https://example.com/guide?q=1 "Guide")');
    expect(restored).toContain('[docs](https://example.com/guide?q=1 "Guide")');
    expect(restored).toContain('Unknown [missing].');
    expect(restored).not.toContain('[docs]:');
    expect(restored.split('\n')).toHaveLength(markdown.split('\n').length);
    expect(hook.getCommentReferenceCache('docs')).toBeNull();
  });

  it('leaves input without definitions unchanged and makeHtml is transparent', () => {
    const hook = createCommentReference();
    const markdown = 'An unresolved [reference][missing].';

    expect(hook.beforeMakeHtml(markdown)).toBe(markdown);
    expect(hook.makeHtml(markdown, () => ({ html: 'unused' }))).toBe(markdown);
  });

  it('removes a standalone definition that has no line feeds', () => {
    const hook = createCommentReference();

    expect(hook.beforeMakeHtml('[docs]: https://example.com')).toBe('');
  });

  it.each(['javascript:alert(1)', 'vbscript:msgbox(1)', 'data:text/html;base64,PHNjcmlwdD4='])(
    'rejects reference definitions with the dangerous scheme %s',
    (dangerousUrl) => {
      const hook = createCommentReference();
      const markdown = `A [link][ref].\n\n[ref]: ${dangerousUrl} "title"`;
      const transformed = hook.beforeMakeHtml(markdown);

      // 危险协议不写入缓存，引用保持未解析状态，不会被改写成 [text](url) 形式
      expect(hook.getCommentReferenceCache('ref')).toBeNull();
      expect(hook.afterMakeHtml(transformed)).not.toContain(dangerousUrl);
      expect(transformed).toContain('[link][ref]');
    },
  );
});
