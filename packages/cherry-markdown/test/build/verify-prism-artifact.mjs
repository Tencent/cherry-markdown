// Run in a fresh process so each published bundle must register its own grammars.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const file = process.argv[2];
const languages = JSON.parse(readFileSync(new URL('../../build/prism-languages.json', import.meta.url), 'utf8'));
const extensions = ['css-extras', 'js-extras', 'js-templates', 'php-extras', 'xml-doc'];
const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/' });
dom.window.mermaid = { initialize() {}, mermaidAPI: { initialize() {} } };
let Entry;
if (file.endsWith('.esm.js')) {
  for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (!(key in global)) Object.defineProperty(global, key, Object.getOwnPropertyDescriptor(dom.window, key));
  }
  Entry = (await import(pathToFileURL(file).href)).default;
} else {
  dom.window.eval(readFileSync(file, 'utf8'));
  const exported = file.includes('.engine.') ? dom.window.CherryEngine : dom.window.Cherry;
  Entry = exported.default || exported;
}

const options = { forceAppend: false, engine: { syntax: { codeBlock: { lineNumber: false } } } };
// UMD options must be plain objects from the same browser realm as the bundle.
const instance = new Entry(file.endsWith('.esm.js') ? options : dom.window.JSON.parse(JSON.stringify(options)));
const engine = instance.engine || instance;
const hook = engine.hooks.paragraph.find((item) => typeof item.renderCodeBlock === 'function');
assert.ok(hook, 'CodeBlock hook is available');
for (const language of languages.filter((name) => !extensions.includes(name))) {
  const html = hook.renderCodeBlock('example', language, 'test', 1);
  assert.ok(html.includes(`<pre class="language-${language}">`), `${language} must not fall back to JavaScript`);
}
const cases = [
  ['bash', 'tar -czvf filename.tar.gz directory_name', 'token function'],
  ['shell', 'tar -czvf filename.tar.gz directory_name', 'token function'],
  ['python', 'def example():\n    return True', 'token keyword'],
  ['tsx', 'const el = <div>Hello</div>;', 'token tag'],
  ['php', '<?php echo "hello";', 'token keyword'],
  ['css', '.example:hover { color: red; }', 'token pseudo-class'],
  ['javascript', 'console.log(1)', 'token console'],
  ['javascript', 'const view = html`<div>Hello</div>`;', 'token tag'],
  ['php', '<?php $this->example();', 'token this'],
  ['csharp', '/// <summary>Hello</summary>', 'token doc-comment'],
];
for (const [language, code, token] of cases) {
  const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
  const html = engine.makeHtml(markdown);
  assert.ok(html.includes(`class="language-${language}"`), language);
  assert.ok(html.includes(token), `${language}: ${token}`);
}
engine.$cherry.options.engine.global.flowSessionContext = true;
engine.$cherry.options.engine.global.flowSessionCursor = '<i class="cursor"></i>';
for (const language of ['bash', 'python']) {
  const code = language === 'bash' ? 'tar -czvf filename.tar.gz directory_name' : 'def example():\n    return True';
  const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
  for (let length = 1; length <= markdown.length; length++) {
    const html = engine.makeHtml(markdown.slice(0, length));
    if (length > markdown.indexOf('\n') + 1)
      assert.ok(html.includes(`class="language-${language}"`), `${language}: ${length}`);
  }
  const html = engine.makeHtml(markdown, 'string', true);
  assert.ok(!html.includes('CHERRYFLOWSESSIONCURSOR'));
}
dom.window.close();
console.log(`Verified ${languages.length} legacy components/aliases and ordinary/streaming rendering: ${file}`);
