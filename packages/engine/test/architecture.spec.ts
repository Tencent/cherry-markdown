import { beforeEach, describe, expect, it } from 'vite-plus/test';
import CherryEngine, { createSyntaxHook, Sanitizer } from '../src/index';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

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

  it('keeps editor interaction and large renderer plugins outside Engine', () => {
    const suggester = readFileSync(resolve(import.meta.dirname, '../src/syntax/hooks/Suggester.js'), 'utf8');
    expect(suggester).not.toContain('@codemirror/');
    expect(suggester).not.toContain('suggester-panel');
    expect(suggester).not.toContain('onCodeMirrorChange');
    expect(existsSync(resolve(import.meta.dirname, '../src/addons/cherry-code-block-mermaid-plugin.js'))).toBe(false);

    const walk = (directory: string): string[] =>
      readdirSync(directory).flatMap((name) => {
        const file = resolve(directory, name);
        return statSync(file).isDirectory() ? walk(file) : [file];
      });
    const engineSource = walk(resolve(import.meta.dirname, '../src'))
      .filter((file) => file.endsWith('.js'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    for (const token of ['@codemirror/', 'previewer', 'wrapperDom', '.$event', '.toolbar']) {
      expect(engineSource).not.toContain(token);
    }
  });
});
