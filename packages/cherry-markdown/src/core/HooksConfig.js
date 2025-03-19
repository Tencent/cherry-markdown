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
// import Bold from './hooks/Bold';
// import Italic from './hooks/Italic';
// import Underline from './hooks/Underline';
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
import Suggester from './hooks/Suggester';
import Ruby from './hooks/Ruby';
import Panel from './hooks/Panel';
import Detail from './hooks/Detail';
import FrontMatter from './hooks/FrontMatter';
/**
 * 引擎各语法的配置
 * 主要决定支持哪些语法，以及各语法的执行顺序
 */
const hooksConfig = [
  // 段落级 Hook
  // 引擎会按当前排序顺序执行beforeMake、makeHtml方法
  // 引擎会按当前排序逆序执行afterMake方法
  FrontMatter,
  CodeBlock,
  InlineCode,
  /**
   * 理论上行内公式（InlineMath）应该在段落公式（MathBlock）的后面，否则行内公式会破坏段落公式的渲染
   * 但实际交换顺序后，发现没啥问题，还顺带解决了[这个issue #1090](https://github.com/Tencent/cherry-markdown/issues/1090)的问题
   * 没问题的原因是对于段落公式（比如$$(a+b)^2=a^2+2ab+b^2$$），行内公式的确会命中，会识别出来两个'$$'，所以无事发生
   */
  InlineMath,
  MathBlock,
  HtmlBlock,
  Footnote,
  CommentReference,
  Transfer,
  Br,
  Table,
  Blockquote,
  Toc,
  Header, // 处理标题, 传入strict属性严格要求ATX风格标题#后带空格
  Hr,
  List,
  Detail,
  Panel,
  Paragraph, // 普通段落

  // 行内Hook
  // 引擎会按当前顺序执行makeHtml方法
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
  Suggester,
];

export default hooksConfig;
