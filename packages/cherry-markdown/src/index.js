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
export * from './index.core';

// 导出核心版
export { default as core } from './index.core';

// 导出引擎版
export { default as engine } from './index.engine.core';

// 导出流式渲染版
export { default as stream } from './index.stream';

// 导出插件
export { default as MermaidPlugin } from '@/addons/cherry-code-block-mermaid-plugin';
export { default as PlantUMLPlugin } from '@/addons/cherry-code-block-plantuml-plugin';
export { default as EChartsTablePlugin } from '@/addons/advance/cherry-table-echarts-plugin';
export { default as TapdCheckListPlugin } from '@/addons/advance/cherry-tapd-checklist-plugin';
export { default as TapdHtmlTagPlugin } from '@/addons/advance/cherry-tapd-html-tag-plugin';
export { default as TapdTablePlugin } from '@/addons/advance/cherry-tapd-table-plugin';

// 默认导出使用带 mermaid 的版本
export { default } from './index.cherry';
