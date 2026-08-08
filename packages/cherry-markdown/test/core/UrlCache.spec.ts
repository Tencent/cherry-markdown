import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import UrlCache, { urlProcessorProxy } from '../../src/UrlCache';

afterEach(() => {
  UrlCache.clear();
});

describe('core/UrlCache', () => {
  it('stores long URLs as stable internal links', () => {
    const original = 'https://example.com/a/very/long/path?query=value';
    const inner = UrlCache.set(original);

    expect(inner).toMatch(/^cherry-inner:\/\/[0-9a-f]{16}$/);
    expect(UrlCache.isInnerLink(inner)).toBe(true);
    expect(UrlCache.isInnerLink(original)).toBe(false);
    expect(UrlCache.get(inner)).toBe(original);
    expect(UrlCache.set(original)).toBe(inner);
  });

  it('returns undefined for malformed or unknown internal links', () => {
    expect(UrlCache.get('https://example.com')).toBeUndefined();
    expect(UrlCache.replace('invalid', 'next')).toBeUndefined();
    expect(UrlCache.get('cherry-inner://deadbeef')).toBeUndefined();
  });

  it('replaces cached values without changing their internal identity', () => {
    const inner = UrlCache.set('https://old.example.com');

    expect(UrlCache.replace(inner, 'https://new.example.com')).toBe(inner);
    expect(UrlCache.get(inner)).toBe('https://new.example.com');
  });

  it('restores every known internal link and preserves unknown ones', () => {
    const first = UrlCache.set('https://example.com/first');
    const second = UrlCache.set('https://example.com/second');
    const unknown = 'cherry-inner://deadbeef';
    const html = `<a href="${first}">first</a><img src="${second}"><a href="${unknown}">unknown</a>`;

    expect(UrlCache.restoreAll(html)).toBe(
      `<a href="https://example.com/first">first</a><img src="https://example.com/second"><a href="${unknown}">unknown</a>`,
    );
  });

  it('clears all cached values', () => {
    const inner = UrlCache.set('https://example.com');

    UrlCache.clear();

    expect(UrlCache.get(inner)).toBeUndefined();
  });

  it('proxies ordinary URLs unchanged', () => {
    const callback = vi.fn();
    const processor = vi.fn((url, type, cb) => `${type}:${url}:${cb === callback}`);
    const proxy = urlProcessorProxy(processor);

    expect(proxy('https://example.com', 'image', callback)).toBe('image:https://example.com:true');
    expect(processor).toHaveBeenCalledWith('https://example.com', 'image', callback);
  });

  it('resolves and updates internal links through proxied processors', () => {
    const inner = UrlCache.set('https://old.example.com');
    const processor = vi.fn((url) => url.replace('old', 'new'));
    const proxy = urlProcessorProxy(processor);

    expect(proxy(inner, 'link', vi.fn())).toBe(inner);
    expect(processor).toHaveBeenCalledWith('https://old.example.com', 'link', expect.any(Function));
    expect(UrlCache.get(inner)).toBe('https://new.example.com');
  });
});
