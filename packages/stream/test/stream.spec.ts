import { describe, expect, it, beforeEach } from 'vite-plus/test';
import CherryStream from '../src/index';

describe('@cherry-markdown/stream', () => {
  beforeEach(() => {
    // @ts-expect-error 构建注入的全局变量
    globalThis.BUILD_ENV = 'production';
  });

  it('exposes the CherryStream constructor', () => {
    expect(typeof CherryStream).toBe('function');
  });

  it('creates an engine and renders markdown to html', () => {
    const stream = new CherryStream({
      value: '# Hello\n\n**World**',
      engine: { syntax: { header: { anchorStyle: 'none' } } },
    });
    const html = stream.engine.makeHtml('# Hello\n\n**World**');
    expect(html).toContain('Hello');
    expect(html).toContain('<strong>World</strong>');
  });

  it('stores and returns markdown value', () => {
    const stream = new CherryStream({ value: 'foo' });
    expect(stream.getValue()).toBe('foo');
    stream.setValue('bar');
    expect(stream.getValue()).toBe('bar');
  });

  it('builds toc from rendered html', () => {
    const stream = new CherryStream({});
    stream.setValue('# Title One\n\n## Title Two');
    const toc = stream.getToc();
    expect(toc.length).toBeGreaterThan(0);
    expect(toc[0].level).toBe(1);
  });
});
