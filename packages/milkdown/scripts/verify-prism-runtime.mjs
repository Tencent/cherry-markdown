import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext, SourceTextModule } from 'node:vm';

// Exercise the actual generated ESM without a DOM, WorkerGlobalScope or Node
// global. Packed consumers must not need Cherry's build plugins at runtime.
const context = createContext({ console });
assert.equal(
  runInContext('[typeof window, typeof WorkerGlobalScope, typeof global].join()', context),
  'undefined,undefined,undefined',
);
const file = process.argv[2];
const module = new SourceTextModule(readFileSync(file, 'utf8'), { context });
await module.link((specifier) => {
  throw new Error(`Unexpected Prism runtime dependency: ${specifier}`);
});
await module.evaluate();
const Prism = module.namespace.default;
assert.equal(Prism.manual, true);
for (const [alias, language] of [
  ['ts', 'typescript'],
  ['py', 'python'],
  ['shell', 'bash'],
  ['yml', 'yaml'],
])
  assert.equal(Prism.languages[alias], Prism.languages[language], alias);
for (const [language, source, expected] of [
  ['typescript', 'const answer: number = 42;', 'builtin'],
  ['json', '{"answer":42}', 'property'],
  ['python', 'print("hello")', 'keyword'],
  ['tsx', 'const view = <div>Hello</div>;', 'tag'],
  ['javascript', 'const view = html`<div>Hello</div>`;', 'tag'],
  ['csharp', '/// <summary>Hello</summary>', 'doc-comment'],
]) {
  assert.ok(Prism.languages[language], language);
  assert.ok(
    Prism.highlight(source, Prism.languages[language], language).includes(`token ${expected}`),
    `${language}: ${expected}`,
  );
}
console.log('Verified standalone Prism languages, aliases and dependent extensions without browser/Node globals.');
