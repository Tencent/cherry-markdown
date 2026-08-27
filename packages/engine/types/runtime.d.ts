export interface EngineRuntimeAdapter {
  /** Temporary 0.x compatibility host; new package consumers should not set it. */
  legacyHost?: any;
  syntaxHooks?: Record<string, any>;
  getLocales?: () => Record<string, unknown>;
  getMarkdown?: () => string;
  onHtmlChange?: (payload: { markdownText: string; html: string }) => void;
  onAsyncRender?: (payload: { markdownText: string; html: string }) => void;
  onFrontMatter?: (frontmatter: Record<string, string>) => void;
  renderPendingMath?: (payload: {
    className: string;
    render: (content: string, isDisplayMode: boolean) => string;
  }) => void;
  clearFlowSessionCursor?: () => void;
}
