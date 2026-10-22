import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createContext, SourceTextModule } from 'node:vm';

// Execute Vite's actual client module graph, including prebundled dependencies,
// in a fresh realm without window, WorkerGlobalScope or Node global.
const [root, entry, graphFile] = process.argv.slice(2);
const graph = JSON.parse(readFileSync(graphFile, 'utf8'));
const context = createContext({ console, setTimeout, clearTimeout });
const modules = new Map();
function getModule(file) {
  if (!modules.has(file)) {
    modules.set(file, new SourceTextModule(graph[file] ?? readFileSync(file, 'utf8'), { context, identifier: file }));
  }
  return modules.get(file);
}
const module = getModule(entry);
await module.link((specifier, parent) => {
  const path = decodeURI(specifier.split('?')[0]);
  let file = resolve(dirname(parent.identifier), path);
  if (path.startsWith('/@fs/')) file = resolve(path.slice(4));
  else if (path.startsWith('/')) file = resolve(root, `.${path}`);
  return getModule(file);
});
await module.evaluate();
assert.equal(module.namespace.default.HOOK_NAME, 'codeBlock');
const { Prism } = module.namespace;
assert.equal(module.namespace.probe, 'undefined', 'unrelated dependencies must retain the original global semantics');
assert.equal(Prism.manual, true);
const languages = JSON.parse(readFileSync(new URL('../../build/prism-languages.json', import.meta.url), 'utf8'));
const extensions = ['css-extras', 'js-extras', 'js-templates', 'php-extras', 'xml-doc'];
for (const language of languages.filter((language) => !extensions.includes(language))) {
  assert.ok(Prism.languages[language], language);
}
for (const [language, code, token] of [
  ['bash', 'tar -czvf example.tar.gz directory', 'function'],
  ['python', 'def example():\n    return True', 'keyword'],
  ['tsx', 'const view = <div>Hello</div>;', 'tag'],
]) {
  assert.ok(Prism.highlight(code, Prism.languages[language], language).includes(`token ${token}`), language);
}
console.log('Verified development prebundling and Prism-only global compatibility.');
