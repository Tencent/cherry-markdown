export type SemanticText = { type: 'text'; text: string };
export type SemanticBreak = { type: 'break' };
export type SemanticCursor = { type: 'cursor' };
export type SemanticInlineWrapper = {
  type: 'strong' | 'em' | 'code' | 'span' | 'underline' | 'strikethrough' | 'sub' | 'sup' | 'mark';
  attrs?: Record<string, string>;
  children: SemanticInline[];
};
export type SemanticLink = {
  type: 'link';
  href: string;
  title?: string;
  attrs?: Record<string, string>;
  children: SemanticInline[];
};
export type SemanticImage = {
  type: 'image';
  src: string;
  alt?: string;
  title?: string;
  attrs?: Record<string, string>;
};
export type SemanticMathInline = { type: 'math_inline'; text: string; attrs?: Record<string, string> };
export type SemanticRuby = { type: 'ruby'; annotation: string; children: SemanticInline[] };
export type SemanticInline =
  | SemanticRuby
  | SemanticText
  | SemanticBreak
  | SemanticCursor
  | SemanticInlineWrapper
  | SemanticLink
  | SemanticImage
  | SemanticMathInline;

export type SemanticParagraphBlock = {
  type: 'paragraph';
  attrs?: Record<string, string>;
  children: SemanticInline[];
};
export type SemanticHeadingBlock = {
  type: 'heading';
  level: number;
  attrs?: Record<string, string>;
  children: SemanticInline[];
};
export type SemanticBlockquoteBlock = {
  type: 'blockquote';
  attrs?: Record<string, string>;
  children: SemanticBlock[];
};
export type SemanticListItem = {
  type: 'list_item';
  attrs?: Record<string, string>;
  checked?: boolean;
  children: SemanticBlock[];
};
export type SemanticListBlock = {
  type: 'list';
  ordered: boolean;
  attrs?: Record<string, string>;
  children: SemanticListItem[];
};
export type SemanticTableCell = {
  type: 'table_cell';
  header: boolean;
  align?: 'left' | 'center' | 'right';
  attrs?: Record<string, string>;
  children: SemanticInline[];
};
export type SemanticTableRow = {
  type: 'table_row';
  attrs?: Record<string, string>;
  children: SemanticTableCell[];
};
export type SemanticTableBlock = {
  type: 'table';
  chart?: Record<string, unknown>;
  attrs?: Record<string, string>;
  header: SemanticTableRow[];
  rows: SemanticTableRow[];
};
export type SemanticCodeBlock = {
  type: 'code_block';
  lang: string;
  text: string;
  tokens?: Array<{ text: string; type: string; aliases?: string[] }>;
  attrs?: Record<string, string>;
};
export type SemanticMathBlock = {
  type: 'math_block';
  text: string;
  display: boolean;
  attrs?: Record<string, string>;
};
export type SemanticDiagramBlock = {
  type: 'diagram';
  kind: 'mermaid';
  text: string;
  attrs?: Record<string, string>;
};
export type SemanticUnsupportedBlock = { type: 'unsupported'; tag: string; text: string };
export type SemanticThematicBreak = { type: 'thematic_break' };
export interface SemanticPanelBlock {
  type: 'panel';
  kind?: string;
  title: string;
  children: SemanticBlock[];
}
export interface SemanticDetailBlock {
  type: 'detail';
  title: string;
  open?: boolean;
  children: SemanticBlock[];
}
export type SemanticContainerBlock = SemanticPanelBlock | SemanticDetailBlock;
export type SemanticBlock =
  | SemanticContainerBlock
  | SemanticParagraphBlock
  | SemanticHeadingBlock
  | SemanticBlockquoteBlock
  | SemanticListBlock
  | SemanticListItem
  | SemanticTableBlock
  | SemanticCodeBlock
  | SemanticMathBlock
  | SemanticDiagramBlock
  | SemanticImage
  | SemanticUnsupportedBlock
  | SemanticThematicBreak;

export type SemanticTransformOptions = {
  unknownTag?: 'text' | 'unwrap' | 'drop';
  forceNoCursor?: boolean;
};

export interface SemanticOptions {
  /** Disable checkpoint reuse for diagnostics or custom integrations. */
  incremental?: boolean;
  value?: string;
  engine?: {
    global?: { flowSessionContext?: boolean; [key: string]: unknown };
    syntax?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SemanticEngine {
  makeHtml(markdown: string, returnType?: string, forceNoCursor?: boolean): string;
  makeSemantic(markdown: string, renderer: unknown, forceNoCursor?: boolean): string;
  restoreSemanticText(value: string): string;
}
