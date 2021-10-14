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
import { CherryOptions } from './cherry';

export type HookType = 'sentence' | 'paragraph';

interface HookTypesListMap extends Record<string, HookType> {
  SEN: 'sentence';
  PAR: 'paragraph';
  DEFAULT: 'sentence';
}

export type HookTypesList<K extends keyof HookTypesListMap = keyof HookTypesListMap> = Record<K, HookTypesListMap[K]>;

export interface EditorConfig {
  pageHooks: Record<string, any>;
  /** hook 专用的配置 */
  config: Record<string, any> | false;
  /** 引擎的全局配置 */
  globalConfig: CherryOptions['engine']['global'];
  /** 外部依赖 */
  externals: CherryOptions['externals'];
  [key: string]: any;
}

export interface BasicHookRegexpRule {
  reg: RegExp;
  begin: string;
  content: string;
  end: string;
}

// TODO:
export type HookRegexpRule = Record<string, any>;
