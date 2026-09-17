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
  return source.innerText || source.textContent || '';
}

export function selectEditableSource(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'a' || (!event.metaKey && !event.ctrlKey) || event.altKey) return;
  const source = event.currentTarget;
  if (!(source instanceof HTMLElement) || source.contentEditable !== 'true') return;
  event.preventDefault();
  event.stopPropagation();
  const selection = source.ownerDocument.getSelection();
  const range = source.ownerDocument.createRange();
  range.selectNodeContents(source);
  selection?.removeAllRanges();
  selection?.addRange(range);
}
