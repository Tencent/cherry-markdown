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
export type MiniProgramMathInline = { type: 'math_inline'; text: string; attrs?: Record<string, string> };
export type MiniProgramInline =
  | MiniProgramText
  | MiniProgramBreak
  | MiniProgramCursor
  | MiniProgramInlineWrapper
  | MiniProgramLink
  | MiniProgramImage
  | MiniProgramMathInline;

export type MiniProgramParagraphBlock = { type: 'paragraph'; attrs?: Record<string, string>; children: MiniProgramInline[] };
export type MiniProgramHeadingBlock = {
  type: 'heading';
  level: number;
  attrs?: Record<string, string>;
  children: MiniProgramInline[];
};
export type MiniProgramBlockquoteBlock = { type: 'blockquote'; attrs?: Record<string, string>; children: MiniProgramBlock[] };
export type MiniProgramListItem = {
  type: 'list_item';
  attrs?: Record<string, string>;
  checked?: boolean;
  children: MiniProgramBlock[];
};
export type MiniProgramListBlock = {
  type: 'list';
  ordered: boolean;
  attrs?: Record<string, string>;
  children: MiniProgramListItem[];
};
export type MiniProgramTableCell = {
  type: 'table_cell';
  header: boolean;
  align?: 'left' | 'center' | 'right';
  attrs?: Record<string, string>;
  children: MiniProgramInline[];
};
export type MiniProgramTableRow = { type: 'table_row'; attrs?: Record<string, string>; children: MiniProgramTableCell[] };
export type MiniProgramTableBlock = {
  type: 'table';
  attrs?: Record<string, string>;
  header: MiniProgramTableRow[];
  rows: MiniProgramTableRow[];
};
export type MiniProgramCodeBlock = {
  type: 'code_block';
  lang: string;
  text: string;
  nodes?: MiniProgramRichTextNode[];
  attrs?: Record<string, string>;
};
export type MiniProgramMathBlock = {
  type: 'math_block';
  text: string;
  display: boolean;
  attrs?: Record<string, string>;
};
export type MiniProgramDiagramBlock = {
  type: 'diagram';
  kind: 'mermaid';
  text: string;
  attrs?: Record<string, string>;
};
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
  | MiniProgramTableBlock
  | MiniProgramCodeBlock
  | MiniProgramMathBlock
  | MiniProgramDiagramBlock
  | MiniProgramImage
  | MiniProgramHtmlBlock;

export type MiniProgramTransformOptions = {
  unknownTag?: 'html' | 'unwrap' | 'drop';
  forceNoCursor?: boolean;
};

export type MiniProgramViewOptions = {
  inlineClassMap?: Record<string, string>;
  deferImages?: boolean;
  imagePlaceholderText?: string;
};
export type MiniProgramTextRun = { type: 'text' | 'link'; text: string; className?: string; href?: string };
export type MiniProgramMathInlineRun = { type: 'math_inline'; text: string; source: string; className?: string };
export type MiniProgramCursorRun = { type: 'cursor' };
export type MiniProgramImageRun = { type: 'image'; src: string; pendingSrc?: string; alt?: string };
export type MiniProgramImagePlaceholderRun = { type: 'image_placeholder'; src: string; alt?: string; text: string };
export type MiniProgramInlineRun =
  | MiniProgramTextRun
  | MiniProgramMathInlineRun
  | MiniProgramCursorRun
  | MiniProgramImageRun
  | MiniProgramImagePlaceholderRun;
export type MiniProgramParagraphViewBlock = { type: 'paragraph'; inlines: MiniProgramInlineRun[] };
export type MiniProgramHeadingViewBlock = { type: 'heading'; level: number; inlines: MiniProgramInlineRun[] };
export type MiniProgramBlockquoteViewBlock = { type: 'blockquote'; children: MiniProgramViewBlock[] };
export type MiniProgramListViewBlock = {
  type: 'list';
  ordered: boolean;
  children: Array<{ task: boolean; marker: string; checked?: boolean; inlines: MiniProgramInlineRun[] }>;
};
export type MiniProgramTableCellView = {
  header: boolean;
  align?: 'left' | 'center' | 'right' | '';
  inlines: MiniProgramInlineRun[];
};
export type MiniProgramTableRowView = { cells: MiniProgramTableCellView[] };
export type MiniProgramTableViewBlock = {
  type: 'table';
  header: MiniProgramTableRowView[];
  rows: MiniProgramTableRowView[];
};
export type MiniProgramCodeRun = { text: string; className: string };
export type MiniProgramCodeViewBlock = { type: 'code_block'; lang: string; text: string; runs: MiniProgramCodeRun[] };
export type MiniProgramMathViewBlock = { type: 'math_block'; text: string; source: string; display: boolean };
export type MiniProgramDiagramViewBlock = { type: 'diagram'; kind: 'mermaid'; text: string };
export type MiniProgramViewBlock =
  | MiniProgramParagraphViewBlock
  | MiniProgramHeadingViewBlock
  | MiniProgramBlockquoteViewBlock
  | MiniProgramListViewBlock
  | MiniProgramTableViewBlock
  | MiniProgramCodeViewBlock
  | MiniProgramMathViewBlock
  | MiniProgramDiagramViewBlock
  | MiniProgramImageRun
  | MiniProgramImagePlaceholderRun
  | MiniProgramHtmlBlock;

export type MiniProgramSseEvent = { data: string; event: string; id: string; retry?: number };
export type MiniProgramSseParser = {
  push(chunk: string | ArrayBuffer): void;
  end(): void;
  reset(): void;
};
export type MiniProgramStreamState = {
  markdown: string;
  blocks: MiniProgramViewBlock[];
  streaming: boolean;
  done: boolean;
};
export type MiniProgramStreamAdapterOptions = {
  stream?: { setMarkdownView(markdown: string, options?: Record<string, any>): MiniProgramViewBlock[] };
  value?: string;
  viewOptions?: MiniProgramTransformOptions & MiniProgramViewOptions;
  imagePlaceholderText?: string;
};

export declare function htmlToMiniProgramBlocks(html: string, options?: MiniProgramTransformOptions): MiniProgramBlock[];
export declare function markdownToHtml(markdown: string, options?: Record<string, any>): string;
export declare function markdownToMiniProgramBlocks(
  engine: { makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): string },
  markdown: string,
  options?: MiniProgramTransformOptions,
): MiniProgramBlock[];
export declare function blocksToMiniProgramView(
  blocks: MiniProgramBlock[],
  options?: MiniProgramViewOptions,
): MiniProgramViewBlock[];
export declare function resolvePendingImages(blocks: MiniProgramViewBlock[]): MiniProgramViewBlock[];
export declare function createSseParser(options?: {
  onMessage?: (event: MiniProgramSseEvent) => void;
  onDone?: () => void;
}): MiniProgramSseParser;
export declare function createMiniProgramStreamChunks(markdown?: string): string[];
export declare function createMiniProgramSseFrames(
  markdown?: string,
  options?: { field?: 'content' | 'delta' | 'text'; includeDone?: boolean },
): string[];
export declare function createMiniProgramStreamAdapter(
  options?: MiniProgramStreamAdapterOptions,
): MiniProgramStreamAdapter;
export declare function createMiniProgramEngine(options?: Record<string, any>): {
  makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): string;
  getLocales(): Record<string, any>;
};


export declare class MiniProgramStreamAdapter {
  constructor(options?: MiniProgramStreamAdapterOptions);
  setMarkdown(
    markdown: string,
    options?: MiniProgramTransformOptions & MiniProgramViewOptions,
  ): MiniProgramStreamState;
  append(chunk: string, options?: MiniProgramTransformOptions & MiniProgramViewOptions): MiniProgramStreamState;
  appendSseEvent(
    event: { data?: string },
    options?: MiniProgramTransformOptions & MiniProgramViewOptions,
  ): MiniProgramStreamState | null;
  finish(options?: MiniProgramTransformOptions & MiniProgramViewOptions): MiniProgramStreamState;
  reset(markdown?: string): MiniProgramStreamState;
  getState(): MiniProgramStreamState;
}

export default class MiniProgramStream {
  static readonly config: { defaults: unknown };
  options: any;
  lastMarkdownText: string;
  engine: {
    makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): string;
  };
  constructor(options?: Record<string, any>);
  makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): any;
  makeBlocks(markdown: string, options?: MiniProgramTransformOptions): MiniProgramBlock[];
  setMarkdown(content: string, options?: MiniProgramTransformOptions): MiniProgramBlock[];
  makeView(markdown: string, options?: MiniProgramTransformOptions & MiniProgramViewOptions): MiniProgramViewBlock[];
  setMarkdownView(content: string, options?: MiniProgramTransformOptions & MiniProgramViewOptions): MiniProgramViewBlock[];
  getMarkdown(): string;
  clearFlowSessionCursor(): void;
}
`;

writeFileSync(resolve(distTypesDir, 'miniProgram-stream.d.ts'), source);
