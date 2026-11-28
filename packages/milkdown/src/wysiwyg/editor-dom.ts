export function activeElementFor(element: HTMLElement) {
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.activeElement : element.ownerDocument.activeElement;
}

/** The range exposed to the document may have been retargeted to the shadow host. */
export function editorSelectionRange(surface: HTMLElement): Range | undefined {
  const document = surface.ownerDocument;
  const selection = document.getSelection();
  if (!selection?.rangeCount) return;
  const root = surface.getRootNode();
  const composed = root instanceof ShadowRoot ? selection.getComposedRanges?.({ shadowRoots: [root] })[0] : undefined;
  const range = composed ? document.createRange() : selection.getRangeAt(0);
  if (composed) {
    range.setStart(composed.startContainer, composed.startOffset);
    range.setEnd(composed.endContainer, composed.endOffset);
  }
  if (surface.contains(range.startContainer) && surface.contains(range.endContainer)) return range;
}
