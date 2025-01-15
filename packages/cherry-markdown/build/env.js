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
import replace from '@rollup/plugin-replace';
// add git revision into process.env
import './revision';

const collectEnv = () => {
  if (!process.env) {
    return {};
  }
  const envVars = ['CORE_BUILD', ...Object.keys(process.env)];
  const obj = envVars.reduce(
    (acc, key) =>
      Object.assign(acc, {
        [`process.env.${key}`]: JSON.stringify(process.env[key]),
      }),
    {},
  );
  return obj;
};

const replacePlugin = replace({
  preventAssignment: false,
  exclude: [/node_modules[\\/]mermaid/, 'src/libs/**', 'src/sass/**'],
  BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
  ...collectEnv(),
});

export default () => replacePlugin;
