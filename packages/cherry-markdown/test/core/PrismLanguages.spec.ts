import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import CherryEngine from '../../src/index.engine.core';
// Inspect the core after the real Engine/CodeBlock import registers languages.
import Prism from 'prismjs/components/prism-core.js';
import languages from '../../build/prism-languages.json';

// These components extend another grammar rather than register a language.
const extensions = ['css-extras', 'js-extras', 'js-templates', 'php-extras', 'xml-doc'];

describe('Prism language registration', () => {
  afterEach(() => vi.useRealTimers());

  it.each(languages.filter((language) => !extensions.includes(language)))(
    'preserves the legacy language or alias %s',
    (language) => {
      expect(Prism.languages[language]).toBeDefined();
    },
  );

  it('preserves grammar extensions as well as standalone languages', () => {
    expect(Prism.languages.css.selector.inside['pseudo-class']).toBeDefined();
    expect(Prism.languages.javascript.console).toBeDefined();
    expect(Array.isArray(Prism.languages.javascript['template-string'])).toBe(true);
    expect(Prism.languages.php.this).toBeDefined();
    expect(Prism.languages.csharp['doc-comment']).toBeDefined();
  });

  it.each([
    ['bash', 'tar -czvf filename.tar.gz directory_name', 'function', 'tar'],
    ['shell', 'tar -czvf filename.tar.gz directory_name', 'function', 'tar'],
    ['python', 'def example():\n    return True', 'keyword', 'def'],
    ['tsx', 'const el = <div>Hello</div>;', 'tag', 'div'],
    ['php', '<?php echo "hello";', 'keyword', 'echo'],
  ])('highlights %s using its grammar and dependencies', (language, code, token, value) => {
    const html = Prism.highlight(code, Prism.languages[language], language);
    expect(html).toContain(`token ${token}`);
    expect(html).toContain(value);
  });

  it.each(['bash', 'shell', 'python', 'typescript'])(
    'renders %s through ordinary and incremental parsing',
    (language) => {
      vi.useFakeTimers();
      const code = language === 'python' ? 'def example():\n    return True' : 'echo "hello"';
      const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
      const engine = new CherryEngine();
      expect(engine.makeHtml(markdown)).toContain(`class="language-${language}"`);

      const streaming = new CherryEngine({
        engine: { global: { flowSessionContext: true, flowSessionCursor: '<i class="cursor"></i>' } },
      });
      for (let length = 1; length <= markdown.length; length++) {
        const html = streaming.makeHtml(markdown.slice(0, length));
        if (length > markdown.indexOf('\n') + 1) {
          expect(html, markdown.slice(0, length)).toContain(`class="language-${language}"`);
        }
      }
      const finalHtml = streaming.makeHtml(markdown, 'string', true);
      expect(finalHtml).toContain(`class="language-${language}"`);
      expect(finalHtml).not.toContain('CHERRYFLOWSESSIONCURSOR');
    },
  );
});
