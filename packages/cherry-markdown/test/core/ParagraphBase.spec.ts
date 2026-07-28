import { beforeEach, describe, expect, it, vi } from 'vitest';
import ParagraphBase from '../../src/core/ParagraphBase';
import { hashHex } from '../../src/utils/hash';

function createParagraphBase(needCache = false, htmlWhiteListAppend = '') {
  const hook = new ParagraphBase({ needCache });
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (content: string) => hashHex(content),
      htmlWhiteListAppend,
    },
  });
  return hook;
}

describe('core/ParagraphBase', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('caches computed data, refreshes requested values, and evicts overflow entries', () => {
    const hook = createParagraphBase();
    const compute = vi.fn((key: string) => `${key}-${compute.mock.calls.length}`);

    expect(hook.cacheAndGetData('first', compute, 1, 1)).toBe('first-1');
    expect(hook.cacheAndGetData('first', compute, 1, 1)).toBe('first-1');
    expect(compute).toHaveBeenCalledOnce();
    expect(hook.cacheAndGetData('first', compute, 1, 1, true)).toBe('first-2');
    hook.cacheAndGetData('second', compute, 1, 1);
    hook.cacheAndGetData('third', compute, 1, 1);

    expect(hook.cacheData.first).toBe('first-2');
    expect(hook.cacheData.second).toBeUndefined();
    expect(hook.cacheData.third).toBe('third-4');

    hook.clearCache();
    expect(hook.cacheData).toEqual({});
    expect(hook.cacheDataMap).toEqual([]);
  });

  it('honors local classic line-break preference and trims paragraph boundaries', () => {
    const hook = createParagraphBase();
    localStorage.setItem('cherry-classicBr', 'true');
    hook.initBrReg(false);

    expect(hook.classicBr).toBe(true);
    expect(hook.$cleanParagraph('\nfirst\nsecond\n')).toBe('first\nsecond');

    localStorage.clear();
    hook.initBrReg(false);
    expect(hook.$cleanParagraph('\nfirst\nsecond\n')).toBe('first<br>second');
  });

  it('provides transparent base lifecycle methods with and without sentence rendering', () => {
    const plain = createParagraphBase();
    const cached = createParagraphBase(true);
    const sentenceMake = vi.fn((markdown: string) => ({ sign: 'sentence', html: `<em>${markdown}</em>` }));

    expect(plain.toHtml('source', sentenceMake)).toBe('source');
    expect(plain.beforeMakeHtml('source')).toBe('source');
    expect(plain.makeHtml('source', sentenceMake)).toBe('<em>source</em>');
    expect(plain.makeHtml('default sentence')).toBe('default sentence');
    expect(cached.makeHtml('cached source', sentenceMake)).toBe('cached source');
    expect(plain.afterMakeHtml('result')).toBe('result');
    expect(() => plain.mounted()).not.toThrow();
    expect(() => plain.resetCache()).not.toThrow();
    expect(plain.signWithCache('html')).toBe(false);
  });

  it('distinguishes complete, nested, and ordinary paragraph cache text', () => {
    const hook = createParagraphBase();
    const normal = '~~C2Icached_L3$';
    const nested = '~~C2I!nested_L1$';

    expect(hook.isContainsCache(`\n${normal}\n`, true)).toBe(true);
    expect(hook.isContainsCache(nested, true)).toBe(false);
    expect(hook.isContainsCache(`before ${normal} after`, false)).toBe(true);
    expect(hook.isContainsCache(`before ${nested} after`, false)).toBe(false);
    expect(hook.isContainsCache('ordinary', true)).toBe(false);
  });

  it('splits and processes text around cache placeholders without changing placeholders', () => {
    const hook = createParagraphBase();
    const placeholder = '~~C3Icached_L2$';
    const split = hook.$splitHtmlByCache(`before\n${placeholder}\nafter`);

    expect(split.caches?.[0].trim()).toBe(placeholder);
    expect(split.contents).toEqual(['before', 'after']);
    expect(hook.makeExcludingCached(`before\n${placeholder}\nafter`, (part: string) => `[${part}]`)).toBe(
      `[before]${placeholder}[after]`,
    );
    expect(hook.makeExcludingCached('plain', (part: string) => part.toUpperCase())).toBe('PLAIN');
  });

  it('preserves surrounding line feeds and supports always-alone cache entries', () => {
    const hook = createParagraphBase();

    expect(hook.getCacheWithSpace('CACHE', '\n\nsource\n')).toBe('\n\nCACHE\n');
    expect(hook.getCacheWithSpace('CACHE', '\nsource', true)).toBe('\n\nCACHE');
    expect(hook.getCacheWithSpace('CACHE', 'source', true)).toBe('CACHE');
  });

  it('counts source, leading, and nested cache lines', () => {
    const hook = createParagraphBase();

    expect(hook.getLineCount('one\ntwo')).toBe(2);
    expect(hook.getLineCount('one', '\n')).toBe(2);
    expect(hook.getLineCount('one', '\n\n')).toBe(1);
    expect(hook.getLineCount('\n~~C4Icached_L2$\ntext', '\n')).toBe(5);
    expect(hook.getLineCount('~~C4I!nested_L3$')).toBe(4);
  });

  it('stores, restores, queries, and misses paragraph caches', () => {
    const uncached = createParagraphBase();
    expect(uncached.pushCache('html')).toBeUndefined();
    expect(uncached.popCache('missing')).toBeUndefined();
    expect(uncached.testHasCache('missing')).toBe(false);
    expect(uncached.restoreCache('plain')).toBe('plain');

    const hook = createParagraphBase(true);
    const key = hook.pushCache('<section>cached</section>', '', 2);
    const sign = hashHex('<section>cached</section>');
    expect(key).toContain(`I${sign}_L2$`);
    expect(hook.popCache(sign)).toBe('<section>cached</section>');
    expect(hook.popCache('missing')).toBe('');
    expect(hook.testHasCache(sign)).toBe(key);
    expect(hook.testHasCache('missing')).toBe(false);
    expect(hook.restoreCache(`before${key}after`)).toBe('before<section>cached</section>after');
  });

  it('returns source on cache miss and a line-aware placeholder on cache hit', () => {
    const hook = createParagraphBase(true);
    const sentenceMake = (markdown: string) => ({ sign: hashHex(markdown), html: `<p>${markdown}</p>` });

    expect(hook.checkCache('source', sentenceMake, 3)).toBe('source');
    hook.pushCache('<p>source</p>', hashHex('source'), 3);
    expect(hook.checkCache('source', sentenceMake, 3)).toContain(`I${hashHex('source')}_L3$`);
  });
});
