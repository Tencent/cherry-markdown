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

/**
 * CodeMirror 6 类型扩展
 * 由于 CM6 使用独立的包，类型定义来自 @codemirror/* 包
 */

// 为 CM6 适配器扩展的类型
export interface CM6LineBlock {
  from: number;
  to: number;
  top: number;
  height: number;
  text: string;
}
