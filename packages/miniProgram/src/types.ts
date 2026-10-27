import type * as Semantic from 'cherry-markdown/semantic';
export type MiniProgramText = Semantic.SemanticText;
export type MiniProgramBreak = Semantic.SemanticBreak;
export type MiniProgramCursor = Semantic.SemanticCursor;
export type MiniProgramInlineWrapper = Semantic.SemanticInlineWrapper;
export type MiniProgramLink = Semantic.SemanticLink;
export type MiniProgramImage = Semantic.SemanticImage;
export type MiniProgramMathInline = Semantic.SemanticMathInline;
export type MiniProgramRuby = Semantic.SemanticRuby;
export type MiniProgramInline = Semantic.SemanticInline;
export type MiniProgramParagraphBlock = Semantic.SemanticParagraphBlock;
export type MiniProgramHeadingBlock = Semantic.SemanticHeadingBlock;
export type MiniProgramBlockquoteBlock = Semantic.SemanticBlockquoteBlock;
export type MiniProgramListItem = Semantic.SemanticListItem;
export type MiniProgramListBlock = Semantic.SemanticListBlock;
export type MiniProgramTableCell = Semantic.SemanticTableCell;
export type MiniProgramTableRow = Semantic.SemanticTableRow;
export type MiniProgramTableBlock = Semantic.SemanticTableBlock;
export type MiniProgramCodeBlock = Semantic.SemanticCodeBlock & { nodes?: MiniProgramRichTextNode[] };
export type MiniProgramMathBlock = Semantic.SemanticMathBlock;
export type MiniProgramDiagramBlock = Semantic.SemanticDiagramBlock;
export type MiniProgramUnsupportedBlock = Semantic.SemanticUnsupportedBlock;
export type MiniProgramThematicBreak = Semantic.SemanticThematicBreak;
export type MiniProgramPanelBlock = Semantic.SemanticPanelBlock;
export type MiniProgramDetailBlock = Semantic.SemanticDetailBlock;
export type MiniProgramContainerBlock = Semantic.SemanticContainerBlock;
export type MiniProgramBlock = Exclude<Semantic.SemanticBlock, Semantic.SemanticCodeBlock> | MiniProgramCodeBlock;
export type MiniProgramTransformOptions = Semantic.SemanticTransformOptions;
export type MiniProgramRichTextNode =
  | { type: 'text'; text: string }
  | { name: string; attrs?: Record<string, string>; children?: MiniProgramRichTextNode[] };
export interface MiniProgramPanelViewBlock {
  type: 'panel';
  kind?: string;
  title: string;
  children: MiniProgramViewBlock[];
}
export interface MiniProgramDetailViewBlock {
  type: 'detail';
  title: string;
  open?: boolean;
  children: MiniProgramViewBlock[];
}
export type MiniProgramContainerViewBlock = MiniProgramPanelViewBlock | MiniProgramDetailViewBlock;

export type MiniProgramViewOptions = {
  inlineClassMap?: Record<string, string>;
  deferImages?: boolean;
  imagePlaceholderText?: string;
};
export type MiniProgramTextRun = {
  type: 'text' | 'link';
  text: string;
  className?: string;
  href?: string;
  style?: string;
};
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
  children: Array<{ task: boolean; marker: string; checked?: boolean; children: MiniProgramViewBlock[] }>;
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
  | MiniProgramContainerViewBlock
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
  | MiniProgramUnsupportedBlock
  | MiniProgramThematicBreak;

export interface MiniProgramOptions extends Semantic.SemanticOptions {
  /** Inject a newer shared core using the same schema; bypasses the bundled adapter dependency. */
  bridge?: Semantic.SemanticBridge;
}
export type MiniProgramEngine = Semantic.SemanticEngine;

export type MiniProgramRenderOptions = MiniProgramTransformOptions & MiniProgramViewOptions;

/** Logic-layer handle returned by selectComponent; avoids sending Markdown through page setData. */
export interface NativeMarkdownHandle {
  setMarkdown(markdown: string, streaming?: boolean): void;
}
