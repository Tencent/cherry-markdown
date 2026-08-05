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
// use fs to read package.json to avoid ESM JSON import assertion issues
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
const PackageInfo = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

export function getBuildVersion(environment = 'production') {
  if (environment !== 'development') {
    return PackageInfo.version;
  }

  try {
    const revision = execSync('git rev-parse --short=8 HEAD').toString().trim();
    return revision ? `${PackageInfo.version}-${revision}` : PackageInfo.version;
  } catch {
    console.warn('failed to get git revision.');
    return PackageInfo.version;
  }
}
