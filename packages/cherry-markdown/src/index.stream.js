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
// Import Prism first to ensure it's initialized before importing language components
import Prism from 'prismjs';
// Import Prism language components AFTER importing Prism
// 这些模块会自动注册语言到 Prism.languages
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';

import CherryStream from './CherryStream';

// in browser
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Cherry = CherryStream;
}

export default CherryStream;
