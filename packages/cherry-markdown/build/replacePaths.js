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
import { readFileSync, writeFileSync } from 'fs';

async function replacePaths() {
  try {
    const results = await replaceInFile({
      files: 'dist/types/**/*.d.ts',
      from: /~types\//g,
      to: '../../types/',
    });
    for (const result of results) {
      if (result.hasChanged) {
        console.log(result);
      }
    }

    // 在产物主入口顶部插入三斜线引用，使消费者自动加载环境模块声明（CSS、addon 等）
    const entryPath = 'dist/types/index.d.ts';
    const content = readFileSync(entryPath, 'utf-8');
    writeFileSync(entryPath, `/// <reference path="../../types/modules.d.ts" />\n${content}`);
  } catch (error) {
    throw error;
  }
}

replacePaths();
