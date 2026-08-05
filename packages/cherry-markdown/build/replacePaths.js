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
  ['cherry-markdown.stream.d.ts', 'index.stream', 'Cherry', ['SyntaxHookBase']],
  ['cherry-markdown.stream.esm.d.ts', 'index.stream', 'Cherry', ['SyntaxHookBase']],
];

async function replacePaths() {
  const declarationRoot = resolve('dist/types');
  const publicTypesRoot = resolve('types');

  for (const file of glob.sync('dist/types/**/*.d.ts')) {
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
      `import ${defaultName}, { ${names} } from "./types/${entry}";\nexport { ${names} };\nexport default ${defaultName};\n`,
    );
  }
}

replacePaths();
