import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext, SourceTextModule } from 'node:vm';

// Use standard runtime APIs, without window, WorkerGlobalScope or Node global.
const context = createContext({ console, setTimeout, clearTimeout, atob, btoa, URL, TextEncoder, TextDecoder });
assert.equal(
  runInContext('[typeof window, typeof WorkerGlobalScope, typeof global].join() ', context),
  'undefined,undefined,undefined',
);
const file = process.argv[2];
const module = new SourceTextModule(readFileSync(file, 'utf8'), { context });
await module.link((specifier) => {
  throw new Error(`Unexpected runtime dependency: ${specifier}`);
});
await module.evaluate();
if ('probe' in module.namespace) {
  assert.equal(module.namespace.probe, 'undefined', 'unrelated dependencies must retain the original global semantics');
}
const stream = new module.namespace.default();
const engine = stream.engine || stream;
engine.$cherry.options.engine.global.flowSessionContext = true;
const hook = engine.hooks.paragraph.find((item) => typeof item.renderCodeBlock === 'function');
const languages = JSON.parse(readFileSync(new URL('../../build/prism-languages.json', import.meta.url), 'utf8'));
const extensions = ['css-extras', 'js-extras', 'js-templates', 'php-extras', 'xml-doc'];
for (const language of [...languages.filter((name) => !extensions.includes(name)), ...process.argv.slice(3)]) {
  assert.ok(
    hook.renderCodeBlock('example', language, 'test', 1).includes(`<pre class="language-${language}">`),
    language,
  );
}
for (const [language, code, token] of [
  ['bash', 'tar -czvf filename.tar.gz directory_name', 'token function'],
  ['python', 'def example():\n    return True', 'token keyword'],
  ['tsx', 'const view = <div>Hello</div>;', 'token tag'],
  ['javascript', 'const view = html`<div>Hello</div>`;', 'token tag'],
  ['csharp', '/// <summary>Hello</summary>', 'token doc-comment'],
]) {
  const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
  for (let length = 1; length <= markdown.length; length++) {
    const html = stream.makeHtml(markdown.slice(0, length));
    if (length > markdown.indexOf('\n') + 1)
      assert.ok(html.includes(`class="language-${language}"`), `${language}: ${length}`);
  }
  assert.ok(stream.makeHtml(markdown).includes(token), `${language}: ${token}`);
}
console.log('Verified loading, languages and incremental rendering without browser/Node globals.');
