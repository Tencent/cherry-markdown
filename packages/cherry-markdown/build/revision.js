/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
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
// import { readFileSync } from 'fs';
import PackageInfo from '../package.json';
import { execSync } from 'child_process';

// ref: https://gitlab.com/IvanSanchez/rollup-plugin-git-version/-/blob/master/src/version.mjs
// const branchRegexp = /ref: .*\/(\w*)/;
// const shortRegexp = /0000000000000000000000000000000000000000 ([0-9a-f]{8})/;
const shortHEADRegexp = /([0-9a-f]{8})/;
// let currentBranch = '';
let currentRev = '';
try {
  // const branch = readFileSync('.git/HEAD');
  const head = execSync('git rev-parse HEAD').toString();
  // [, currentBranch] = branchRegexp.exec(branch);
  [, currentRev] = shortHEADRegexp.exec(head);
} catch (e) {
  console.warn('failed to get git revision.');
}

process.env.BUILD_VERSION = PackageInfo.version;
if (currentRev !== '' && process.env.NODE_ENV === 'development') {
  process.env.BUILD_VERSION += `-${currentRev}`;
}
