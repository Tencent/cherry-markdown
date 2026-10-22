import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import ts from 'typescript';
import { format } from 'prettier';
import { isLookbehindSupported } from '../../cherry-markdown/src/utils/regexp.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cherry = resolve(root, '../cherry-markdown/src');
const generated = resolve(root, 'src/generated');
mkdirSync(generated, { recursive: true });
// Bundle only Cherry's pure helpers. Published consumers need neither source
// imports nor Cherry's editor/Previewer/toolbar runtime.
const bundle = await build({
  absWorkingDir: root,
  stdin: {
    contents: `export { default as image } from './utils/image.js';
export { isValidScheme, encodeURIOnce } from './utils/sanitize.js';
export { copyToClip } from './utils/copy.js';`,
    resolveDir: cherry,
    sourcefile: 'cherry-shared-entry.js',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  legalComments: 'inline',
});

function methodBody(path, name) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let body;
  const visit = (node) => {
    if (ts.isMethodDeclaration(node) && node.name.getText(source) === name) body = node.body?.getText(source);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!body) throw new Error(`Missing Cherry method ${name} in ${path}`);
  return body;
}
const rules = {};
for (const name of ['Color', 'BackgroundColor', 'Size', 'Sub', 'Sup', 'Ruby', 'Underline', 'HighLight']) {
  // Evaluate only the pure rule builder, never construct a Cherry UI hook.
  const body = methodBody(resolve(cherry, `core/hooks/${name}.js`), 'rule');
  const { begin, content, end } = runInNewContext(
    `(function() ${body})()`,
    { isLookbehindSupported },
    { timeout: 1000 },
  );
  rules[name] = { begin, content, end };
}
const imagePath = resolve(cherry, 'utils/image.js');
const imagePatterns = {};
for (const [key, method] of Object.entries({
  size: 'processExtendAttributesInAlt',
  decoration: '$addDecorationStyle',
  alignment: '$getAlignment',
})) {
  const body = methodBody(imagePath, method);
  const source = ts.createSourceFile('method.js', body, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let pattern;
  const visit = (node) => {
    if (!pattern && ts.isRegularExpressionLiteral(node)) pattern = node.getText(source);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!pattern) throw new Error(`Missing Cherry image pattern: ${method}`);
  imagePatterns[key] = pattern;
}
const banner = '// Generated from Tencent Cherry Markdown (Apache-2.0) by sync-cherry-helpers.mjs. Do not edit.\n';
const outputs = {
  'cherry-helpers.js':
    banner +
    '/* eslint-disable no-unused-vars, no-control-regex -- Generated upstream Cherry code. */\n' +
    bundle.outputFiles[0].text,
  'cherry-syntax.ts':
    banner +
    `export const cherryInlineRules = ${JSON.stringify(rules)} as const;\nexport const cherryImagePatterns = {${Object.entries(
      imagePatterns,
    )
      .map(([name, regex]) => `${name}: ${regex}`)
      .join(',')}};\n`,
};
for (const [name, text] of Object.entries(outputs)) {
  const content = await format(text, {
    parser: name.endsWith('.ts') ? 'typescript' : 'babel',
    singleQuote: true,
    printWidth: 110,
  });
  const path = resolve(generated, name);
  if (process.argv.includes('--check')) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) throw new Error(`Regenerate ${name}`);
  } else if (!existsSync(path) || readFileSync(path, 'utf8') !== content) writeFileSync(path, content);
}
if (process.argv.includes('--dist')) {
  const destination = resolve(root, 'dist/generated');
  mkdirSync(destination, { recursive: true });
  for (const file of ['cherry-helpers.js', 'cherry-helpers.d.ts'])
    copyFileSync(resolve(generated, file), resolve(destination, file));
}
