import { useMemo, type CSSProperties } from 'react';
import { highlightCode } from '../utils/highlight';

interface CodeBlockProps {
  code: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * 带简易语法高亮的代码块。
 * highlightCode 内部会先对代码做 HTML 转义，因此这里的 innerHTML 是安全的。
 */
export default function CodeBlock({ code, className, style }: CodeBlockProps) {
  const html = useMemo(() => highlightCode(code), [code]);
  return <pre className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
