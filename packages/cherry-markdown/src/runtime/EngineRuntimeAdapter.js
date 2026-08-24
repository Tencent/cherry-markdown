/**
 * Build the editor package's implementation of Engine's host-neutral runtime
 * contract. Keeping these operations here prevents Engine from knowing about
 * CodeMirror, Previewer DOM or Cherry events.
 */
export default function createEngineRuntimeAdapter(cherry, syntaxHooks = {}) {
  return {
    legacyHost: cherry,
    syntaxHooks,
    getLocales: () => cherry.getLocales(),
    getMarkdown: () => cherry.editor?.editor?.view?.state?.doc?.toString() || cherry.lastMarkdownText || '',
    onHtmlChange({ markdownText, html }) {
      cherry.previewer?.refresh(html);
      cherry.$event.emit('afterChange', { markdownText, html });
    },
    onAsyncRender({ markdownText, html }) {
      if (cherry.previewer?.isPreviewerHidden()) cherry.previewer.options.previewerCache.html = html;
      cherry.$event.emit('afterAsyncRender', { markdownText, html });
    },
    onFrontMatter(frontmatter) {
      const fontSize = frontmatter['font-size'] || frontmatter.fontSize;
      const previewDom = cherry.previewer?.getDom();
      if (previewDom && fontSize) previewDom.style.fontSize = fontSize;
    },
    renderPendingMath({ className, render }) {
      const previewer = cherry.previewer;
      const previewDom = previewer?.getDom();
      previewDom?.querySelectorAll(`.${className}`).forEach((element) => {
        const isDisplayMode = element.classList.contains('Cherry-Math');
        element.innerHTML = render(decodeURIComponent(element.getAttribute('data-content')), isDisplayMode);
        element.classList.remove(className);
      });
    },
    clearFlowSessionCursor: () => cherry.clearFlowSessionCursor(),
  };
}
