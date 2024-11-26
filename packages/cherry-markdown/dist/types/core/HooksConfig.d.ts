export default hooksConfig;
/**
 * 引擎各语法的配置
 * 主要决定支持哪些语法，以及各语法的执行顺序
 */
declare const hooksConfig: (typeof Strikethrough | typeof CodeBlock | typeof Link | typeof Emphasis | typeof Header | typeof Transfer | typeof Table | typeof Br | typeof Image | typeof AutoLink | typeof MathBlock | typeof InlineMath | typeof Toc | typeof HtmlBlock | typeof Emoji | typeof Underline | typeof Panel | typeof Detail | typeof Suggester)[];
import Strikethrough from "./hooks/Strikethrough";
import CodeBlock from "./hooks/CodeBlock";
import Link from "./hooks/Link";
import Emphasis from "./hooks/Emphasis";
import Header from "./hooks/Header";
import Transfer from "./hooks/Transfer";
import Table from "./hooks/Table";
import Br from "./hooks/Br";
import Image from "./hooks/Image";
import AutoLink from "./hooks/AutoLink";
import MathBlock from "./hooks/MathBlock";
import InlineMath from "./hooks/InlineMath";
import Toc from "./hooks/Toc";
import HtmlBlock from "./hooks/HtmlBlock";
import Emoji from "./hooks/Emoji";
import Underline from "./hooks/Underline";
import Panel from "./hooks/Panel";
import Detail from "./hooks/Detail";
import Suggester from "./hooks/Suggester";
