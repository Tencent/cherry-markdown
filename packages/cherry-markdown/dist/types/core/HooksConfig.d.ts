export default hooksConfig;
/**
 * 引擎各语法的配置
 * 主要决定支持哪些语法，以及各语法的执行顺序
 */
declare const hooksConfig: (typeof Strikethrough | typeof CodeBlock | typeof InlineCode | typeof Link | typeof Emphasis | typeof Paragraph | typeof Header | typeof Table | typeof Br | typeof Image | typeof Blockquote | typeof AutoLink | typeof MathBlock | typeof InlineMath | typeof Toc | typeof HtmlBlock | typeof Emoji | typeof Panel | typeof Detail | typeof Space | typeof AiFlowAutoClose | typeof Suggester)[];
import Strikethrough from './hooks/Strikethrough.js';
import CodeBlock from './hooks/CodeBlock.js';
import InlineCode from './hooks/InlineCode.js';
import Link from './hooks/Link.js';
import Emphasis from './hooks/Emphasis.js';
import Paragraph from './hooks/Paragraph.js';
import Header from './hooks/Header.js';
import Table from './hooks/Table.js';
import Br from './hooks/Br.js';
import Image from './hooks/Image.js';
import Blockquote from './hooks/Blockquote.js';
import AutoLink from './hooks/AutoLink.js';
import MathBlock from './hooks/MathBlock.js';
import InlineMath from './hooks/InlineMath.js';
import Toc from './hooks/Toc.js';
import HtmlBlock from './hooks/HtmlBlock.js';
import Emoji from './hooks/Emoji.js';
import Panel from './hooks/Panel.js';
import Detail from './hooks/Detail.js';
import Space from './hooks/Space.js';
import AiFlowAutoClose from './hooks/AiFlowAutoClose.js';
import Suggester from './hooks/Suggester.js';
