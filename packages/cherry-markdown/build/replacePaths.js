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
import replaceInFile from 'replace-in-file';
import glob from 'glob';
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, relative, resolve } from 'path';

const declarationEntries = [
  ['cherry-markdown.d.ts', 'index', 'Cherry', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.esm.d.ts', 'index', 'Cherry', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.core.d.ts', 'index.core', 'Cherry', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.core.esm.d.ts', 'index.core', 'Cherry', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.d.ts', 'index.engine', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.esm.d.ts', 'index.engine', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.core.d.ts', 'index.engine.core', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.core.esm.d.ts', 'index.engine.core', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.engine.core.node.d.ts', 'index.engine.core', 'CherryEngine', ['MenuHookBase', 'SyntaxHookBase']],
  ['cherry-markdown.stream.d.ts', 'index.stream', 'Cherry', ['SyntaxHookBase']],
  ['cherry-markdown.stream.esm.d.ts', 'index.stream', 'Cherry', ['SyntaxHookBase']],
];

function addDeclarationExtensions(file, source, declarationRoot, declarations, publicDeclarations) {
  const directory = dirname(resolve(file));
  const sourceDirectory = resolve('src', relative(declarationRoot, directory));
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest);
  const edits = [];

  function update(specifier) {
    if (!specifier || !ts.isStringLiteral(specifier) || !/^\.\.?(?:\/|$)/.test(specifier.text)) return;

    // TypeScript can emit a reference to a public type relative to the original src file.
    const sourceTarget = resolve(sourceDirectory, specifier.text).replace(/\.js$/, '');
    const target = publicDeclarations.has(`${sourceTarget}.d.ts`)
      ? sourceTarget
      : resolve(directory, specifier.text).replace(/\.js$/, '');
    const destination = declarations.has(`${target}.d.ts`) ? `${target}.js` : resolve(target, 'index.js');
    if (!declarations.has(destination.replace(/\.js$/, '.d.ts'))) return;

    const path = relative(directory, destination).replace(/\\/g, '/');
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

async function replacePaths() {
  const declarationRoot = resolve('dist/types');
  const publicTypesRoot = resolve('types');
  const files = glob.sync('dist/types/**/*.d.ts');
  const publicDeclarations = new Set(
    glob.sync('types/**/*.d.ts', { ignore: 'types/env.d.ts' }).map((file) => resolve(file)),
  );
  const declarations = new Set([...files.map((file) => resolve(file)), ...publicDeclarations]);

  for (const file of files) {
    const fileDirectory = dirname(resolve(file));
    const publicTypesPath = relative(fileDirectory, publicTypesRoot).replace(/\\/g, '/');
    const declarationTypesPath = relative(fileDirectory, declarationRoot).replace(/\\/g, '/') || '.';
    const results = await replaceInFile({
      files: file,
      from: [/~types\//g, /@cherry\//g, /@\//g],
      to: [`${publicTypesPath}/`, `${declarationTypesPath}/`, `${declarationTypesPath}/`],
    });
    for (const result of results) {
      if (result.hasChanged) {
        console.log(result);
      }
    }
    const source = readFileSync(file, 'utf-8');
    const updated = addDeclarationExtensions(file, source, declarationRoot, declarations, publicDeclarations);
    if (updated !== source) writeFileSync(file, updated);
  }

  // 在产物主入口顶部插入三斜线引用，使消费者自动加载环境模块声明（CSS、addon 等）
  const entryPath = resolve(declarationRoot, 'index.d.ts');
  const modulesReference = '/// <reference path="../../types/modules.d.ts" />';
  const content = readFileSync(entryPath, 'utf-8');
  if (!content.startsWith(modulesReference)) {
    writeFileSync(entryPath, `/// <reference path="../../types/modules.d.ts" />\n${content}`);
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
