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
 * Stream 版本的 Hooks 配置
 * 相比完整版本（HooksConfig.js），移除了 Suggester（编辑器功能）
 * 仅保留预览相关的 Hooks
 */

import Color from './hooks/Color';
import BackgroundColor from './hooks/BackgroundColor';
import Size from './hooks/Size';
import Strikethrough from './hooks/Strikethrough';
import Sup from './hooks/Sup';
import Sub from './hooks/Sub';
import InlineCode from './hooks/InlineCode';
import CodeBlock from './hooks/CodeBlock';
import Link from './hooks/Link';
import Emphasis from './hooks/Emphasis';
import Paragraph from './hooks/Paragraph';
import Header from './hooks/Header';
import Transfer from './hooks/Transfer';
import Table from './hooks/Table';
import Br from './hooks/Br';
import Hr from './hooks/Hr';
import Image from './hooks/Image';
import List from './hooks/List';
import Blockquote from './hooks/Blockquote';
import AutoLink from './hooks/AutoLink';
import MathBlock from './hooks/MathBlock';
import InlineMath from './hooks/InlineMath';
import Toc from './hooks/Toc';
import Footnote from './hooks/Footnote';
import CommentReference from './hooks/CommentReference';
import HtmlBlock from './hooks/HtmlBlock';
import Emoji from './hooks/Emoji';
import Underline from './hooks/Underline';
import HighLight from './hooks/HighLight';
// import Suggester from './hooks/Suggester'; // ❌ Stream 版本中排除 Suggester（编辑器功能）
import Ruby from './hooks/Ruby';
import Panel from './hooks/Panel';
import Detail from './hooks/Detail';
import FrontMatter from './hooks/FrontMatter';
import Space from './hooks/Space';
import AiFlowAutoClose from './hooks/AiFlowAutoClose';

/**
 * Stream 版本的 Hooks 配置
 * 与 HooksConfig.js 相比，移除了 Suggester
 * 这样可以完全避免引入 codemirror 依赖
 * 🔷 STREAM_VERSION_MARKER_001 - 此标记表示正在使用流式版本配置
 */
const hooksConfig = [
  // 段落级 Hook
  FrontMatter,
  CodeBlock,
  InlineCode,
  InlineMath,
  MathBlock,
  AiFlowAutoClose,
  HtmlBlock,
  Footnote,
  CommentReference,
  Transfer,
  Br,
  Table,
  Toc,
  Blockquote,
  Header,
  Hr,
  List,
  Detail,
  Panel,
  Paragraph,

  // 行内Hook
  Emoji,
  Image,
  Link,
  AutoLink,
  Emphasis,
  BackgroundColor,
  Color,
  Size,
  Sub,
  Sup,
  Ruby,
  Strikethrough,
  Underline,
  HighLight,
  // Suggester, // ❌ 已排除
  Space,
];

export default hooksConfig;
