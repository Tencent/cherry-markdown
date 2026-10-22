export function createNodeAction(label: string, title: string, action: () => void, readonly = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.hidden = readonly;
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', action);
  return button;
}

export function createEditableLabel(
  className: string,
  value: string,
  placeholder: string,
  readonly: boolean,
  commit: () => void,
) {
  const label = document.createElement('input');
  label.type = 'text';
  label.value = value;
  label.placeholder = placeholder;
  label.className = className;
  label.dataset.placeholder = placeholder;
  label.readOnly = readonly;
  label.spellcheck = false;
  // ProseMirror must not turn native input selection into a NodeSelection.
  label.addEventListener('pointerdown', (event) => {
    event.stopImmediatePropagation();
    if (!readonly && event.button === 0) label.focus();
  });
  label.addEventListener('mousedown', (event) => event.stopImmediatePropagation());
  label.addEventListener('input', commit);
  label.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      label.blur();
    }
  });
  return label;
}

export function readEditableSource(source: HTMLElement) {
  const text = source.textContent ?? '';
  const visualText = source.innerText ?? '';
  // Chromium may expose line breaks through either representation depending
  // on whether the edit produced text nodes, <br> elements, or block children.
  // Prefer the representation that retains explicit source line boundaries.
  if (text.includes('\n')) return text;
  if (visualText.includes('\n')) return visualText;
  return text || visualText;
}

export function selectEditableSource(event: KeyboardEvent) {
  if ((!event.metaKey && !event.ctrlKey) || event.altKey || event.isComposing) return;
  const selectAll = event.key.toLowerCase() === 'a';
  const boundary = event.key === 'Home' || event.key === 'End';
  if (!selectAll && !boundary) return;
  const source = event.currentTarget;
  if (!(source instanceof HTMLElement) || source.contentEditable !== 'true') return;
  event.preventDefault();
  event.stopPropagation();
  const selection = source.ownerDocument.getSelection();
  // Linux Chromium can move Ctrl+End out of a nested contenteditable and into
  // ProseMirror's trailing paragraph. This source surface owns its navigation,
  // just as it owns select-all; subsequent native IME input must stay here.
  if (boundary && event.shiftKey && selection?.rangeCount) {
    selection.extend(source, event.key === 'Home' ? 0 : source.childNodes.length);
    return;
  }
  const range = source.ownerDocument.createRange();
  range.selectNodeContents(source);
  if (boundary) range.collapse(event.key === 'Home');
  selection?.removeAllRanges();
  selection?.addRange(range);
}
