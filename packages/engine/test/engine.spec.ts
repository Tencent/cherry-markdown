import { describe, expect, it, beforeEach } from 'vite-plus/test';
import CherryEngine from '../src/index';

describe('@cherry-markdown/engine', () => {
  beforeEach(() => {
    // @ts-expect-error 构建注入的全局变量
    globalThis.BUILD_ENV = 'production';
  });

  it('exposes the engine constructor and static API', () => {
    expect(typeof CherryEngine).toBe('function');
    expect(typeof CherryEngine.createSyntaxHook).toBe('function');
    expect(typeof CherryEngine.constants.HOOKS_TYPE_LIST).toBe('object');
    expect(CherryEngine.VERSION).toBeTypeOf('string');
  });

  it('parses markdown into html', () => {
    const engine = new CherryEngine({
      engine: { syntax: { header: { anchorStyle: 'none' } } },
    });
    const html = engine.makeHtml('# Hello\n\n**World**');
    expect(html).toContain('Hello');
    expect(html).toContain('<strong>World</strong>');
  });
});
