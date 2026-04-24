export default hooksConfig;
/**
 * 引擎各语法的配置
 * 主要决定支持哪些语法，以及各语法的执行顺序
 */
declare const hooksConfig: (typeof Strikethrough | typeof CodeBlock | typeof InlineCode | typeof Link | typeof Emphasis | typeof Paragraph | typeof Header | typeof Transfer | typeof Table | typeof Br | typeof Image | typeof Blockquote | typeof AutoLink | typeof MathBlock | typeof InlineMath | typeof Toc | typeof HtmlBlock | typeof Emoji | typeof Panel | typeof Detail | typeof Space | typeof AiFlowAutoClose | typeof Suggester)[];
import Strikethrough from './hooks/Strikethrough';
import CodeBlock from './hooks/CodeBlock';
import InlineCode from './hooks/InlineCode';
import Link from './hooks/Link';
import Emphasis from './hooks/Emphasis';
import Paragraph from './hooks/Paragraph';
import Header from './hooks/Header';
import Transfer from './hooks/Transfer';
import Table from './hooks/Table';
import Br from './hooks/Br';
import Image from './hooks/Image';
import Blockquote from './hooks/Blockquote';
import AutoLink from './hooks/AutoLink';
import MathBlock from './hooks/MathBlock';
import InlineMath from './hooks/InlineMath';
import Toc from './hooks/Toc';
import HtmlBlock from './hooks/HtmlBlock';
import Emoji from './hooks/Emoji';
import Panel from './hooks/Panel';
import Detail from './hooks/Detail';
import Space from './hooks/Space';
import AiFlowAutoClose from './hooks/AiFlowAutoClose';
import Suggester from './hooks/Suggester';
