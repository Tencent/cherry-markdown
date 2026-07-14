import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distTypesDir = resolve('dist/types');
mkdirSync(distTypesDir, { recursive: true });

const source = `export type MiniProgramText = { type: 'text'; text: string };
export type MiniProgramBreak = { type: 'break' };
export type MiniProgramCursor = { type: 'cursor' };
export type MiniProgramInlineWrapper = {
  type: 'strong' | 'em' | 'code' | 'span' | 'underline' | 'strikethrough' | 'sub' | 'sup';
  attrs?: Record<string, string>;
  children: MiniProgramInline[];
};
export type MiniProgramLink = {
  type: 'link';
  href: string;
  title?: string;
  attrs?: Record<string, string>;
  children: MiniProgramInline[];
};
export type MiniProgramImage = { type: 'image'; src: string; alt?: string; title?: string; attrs?: Record<string, string> };
export type MiniProgramInline =
  | MiniProgramText
  | MiniProgramBreak
  | MiniProgramCursor
  | MiniProgramInlineWrapper
  | MiniProgramLink
  | MiniProgramImage;

export type MiniProgramParagraphBlock = { type: 'paragraph'; attrs?: Record<string, string>; children: MiniProgramInline[] };
export type MiniProgramHeadingBlock = {
  type: 'heading';
  level: number;
  attrs?: Record<string, string>;
  children: MiniProgramInline[];
};
export type MiniProgramBlockquoteBlock = { type: 'blockquote'; attrs?: Record<string, string>; children: MiniProgramBlock[] };
export type MiniProgramListItem = { type: 'list_item'; attrs?: Record<string, string>; children: MiniProgramBlock[] };
export type MiniProgramListBlock = {
  type: 'list';
  ordered: boolean;
  attrs?: Record<string, string>;
  children: MiniProgramListItem[];
};
export type MiniProgramCodeBlock = { type: 'code_block'; lang: string; text: string; attrs?: Record<string, string> };
export type MiniProgramRichTextNode =
  | { type: 'text'; text: string }
  | { name: string; attrs?: Record<string, string>; children?: MiniProgramRichTextNode[] };
export type MiniProgramHtmlBlock = { type: 'html'; nodes: MiniProgramRichTextNode[] };
export type MiniProgramBlock =
  | MiniProgramParagraphBlock
  | MiniProgramHeadingBlock
  | MiniProgramBlockquoteBlock
  | MiniProgramListBlock
  | MiniProgramListItem
  | MiniProgramCodeBlock
  | MiniProgramImage
  | MiniProgramHtmlBlock;

export type MiniProgramTransformOptions = {
  unknownTag?: 'html' | 'unwrap' | 'drop';
  forceNoCursor?: boolean;
};

export declare function htmlToMiniProgramBlocks(html: string, options?: MiniProgramTransformOptions): MiniProgramBlock[];
export declare function markdownToMiniProgramBlocks(
  engine: { makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): string },
  markdown: string,
  options?: MiniProgramTransformOptions,
): MiniProgramBlock[];

export declare class SyntaxHookBase {}

export default class MiniProgramStream {
  static readonly config: { defaults: unknown };
  options: any;
  lastMarkdownText: string;
  engine: { makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): string };
  constructor(options?: Record<string, any>);
  makeHtml(markdown: string, forceNoCursor?: boolean): string;
  makeBlocks(markdown: string, options?: MiniProgramTransformOptions): MiniProgramBlock[];
  setMarkdown(content: string, options?: MiniProgramTransformOptions): MiniProgramBlock[];
  getMarkdown(): string;
  clearFlowSessionCursor(): void;
}
`;

writeFileSync(resolve(distTypesDir, 'stream.d.ts'), source);
