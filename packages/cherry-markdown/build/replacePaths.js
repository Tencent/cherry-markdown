/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import glob from 'glob';
import ts from 'typescript';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, relative, resolve } from 'path';

const editorExports = ['MenuHookBase', 'SyntaxHookBase', 'MermaidCodeEngine', 'MermaidPlugin'];
const declarationEntries = [
  ['cherry-markdown.d.ts', 'index', 'Cherry', editorExports],
  ['cherry-markdown.esm.d.ts', 'index', 'Cherry', editorExports],
  ['cherry-markdown.core.d.ts', 'index.core', 'Cherry', editorExports],
  ['cherry-markdown.core.esm.d.ts', 'index.core', 'Cherry', editorExports],
  ['cherry-markdown.engine.d.ts', 'index.engine', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.esm.d.ts', 'index.engine', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.core.d.ts', 'index.engine.core', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.core.esm.d.ts', 'index.engine.core', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.core.node.d.ts', 'index.engine.core', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.stream.d.ts', 'index.stream', 'Cherry', ['SyntaxHookBase']],
  ['cherry-markdown.stream.esm.d.ts', 'index.stream', 'Cherry', ['SyntaxHookBase']],
];

function normalizeDeclarationImports(file, sourceFile, source, destinations, declarations) {
  const directory = dirname(file);
  const sourceDirectory = dirname(sourceFile);
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest);
  const edits = [];

  function update(specifier) {
    if (!specifier || !ts.isStringLiteral(specifier) || !/^\.\.?(?:\/|$)/.test(specifier.text)) return;

    const request = specifier.text.replace(/\.js$/, '');
    const target = resolve(directory, request);
    const sourceTarget = resolve(sourceDirectory, request);
    // TypeScript can emit a reference relative to the original src file.
    const declaration =
      destinations.get(`${target}.d.ts`) ??
      destinations.get(`${sourceTarget}.d.ts`) ??
      [`${target}.d.ts`, resolve(target, 'index.d.ts')].find((path) => declarations.has(path));
    if (!declaration) return;

    const path = relative(directory, declaration.replace(/\.d\.ts$/, '.js')).replace(/\\/g, '/');
    const replacement = path.startsWith('.') ? path : `./${path}`;
    if (replacement === specifier.text) return;
    edits.push({ start: specifier.getStart(parsed) + 1, end: specifier.end - 1, replacement });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) update(node.moduleSpecifier);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) update(node.argument.literal);
    ts.forEachChild(node, visit);
  }

  visit(parsed);
  for (const { start, end, replacement } of edits.reverse()) {
    source = source.slice(0, start) + replacement + source.slice(end);
  }
  return source;
}

function replacePaths() {
  const declarationRoot = resolve('dist/types');
  const publicTypesRoot = resolve('types');
  const files = glob.sync('dist/types/**/*.d.ts').map((file) => resolve(file));
  const publicDeclarations = new Set(
    glob.sync('types/*.d.ts', { ignore: 'types/env.d.ts' }).map((file) => resolve(file)),
  );
  // Keep the source declarations separate from the published paths so repeated builds read src.
  const publishedDeclarations = glob
    .sync('*.d.ts', { cwd: resolve(publicTypesRoot, 'source') })
    .map((name) => [resolve(publicTypesRoot, 'source', name), resolve(publicTypesRoot, name)]);
  const destinations = new Map([...publicDeclarations].map((file) => [file, file]));
  for (const [sourceFile, file] of publishedDeclarations) {
    destinations.set(sourceFile, file);
  }
  const declarations = new Set([...files, ...destinations.values()]);

  for (const file of files) {
    const path = relative(declarationRoot, file);
    destinations.set(resolve('src', path), file);
  }
  for (const [sourceFile, file] of publishedDeclarations) {
    writeFileSync(file, readFileSync(sourceFile, 'utf-8'));
  }
  const inputs = [
    ...files.map((file) => [resolve('src', relative(declarationRoot, file)), file]),
    ...publishedDeclarations,
  ];
  for (const [sourceFile, file] of inputs) {
    const fileDirectory = dirname(file);
    const publicTypesPath = relative(fileDirectory, publicTypesRoot).replace(/\\/g, '/');
    const declarationTypesPath = relative(fileDirectory, declarationRoot).replace(/\\/g, '/') || '.';
    const source = readFileSync(file, 'utf-8');
    const aliasesReplaced = source
      .replace(/~types\//g, `${publicTypesPath}/`)
      .replace(/@(?:cherry)?\//g, `${declarationTypesPath}/`);
    const updated = normalizeDeclarationImports(file, sourceFile, aliasesReplaced, destinations, declarations);
    if (updated !== source) writeFileSync(file, updated);
  }

  // 在产物主入口顶部插入三斜线引用，使消费者自动加载环境模块声明（CSS、addon 等）
  const entryPath = resolve(declarationRoot, 'index.d.ts');
  const modulesReference = '/// <reference path="../../types/modules.d.ts" />';
  const content = readFileSync(entryPath, 'utf-8');
  if (!content.startsWith(modulesReference)) {
    writeFileSync(entryPath, `${modulesReference}\n${content}`);
  }

  // The standalone TAPD hooks require compatible custom-syntax registration.
  const addonDeclarations = glob.sync('addons/**/*-plugin.d.ts', {
    cwd: declarationRoot,
    ignore: 'addons/advance/cherry-tapd-*-plugin.d.ts',
  });
  for (const file of addonDeclarations) {
    const addon = resolve('dist', file);
    mkdirSync(dirname(addon), { recursive: true });
    const entry = relative(dirname(addon), resolve(declarationRoot, file))
      .replace(/\\/g, '/')
      .replace(/\.d\.ts$/, '.js');
    const shim = `export { default } from "${entry}";\n`;
    writeFileSync(addon, shim);
    writeFileSync(addon.replace(/\.d\.ts$/, '.esm.d.ts'), shim);
  }

  for (const [file, entry, defaultName, namedExports] of declarationEntries) {
    const names = namedExports.join(', ');
    writeFileSync(
      `dist/${file}`,
      `import ${defaultName}, { ${names} } from "./types/${entry}.js";\nexport { ${names} };\nexport default ${defaultName};\n`,
    );
  }
}

replacePaths();
