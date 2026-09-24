interface ContextButtonOptions {
  label: string;
  text?: string;
  icon?: string;
  className?: string;
  contentClassName?: string;
}

/** Shared DOM contract for every editor-owned contextual Bubble. */
export function setupContextBubble(element: HTMLElement, label: string) {
  element.classList.add('cherry-milkdown-context-bubble');
  element.hidden = true;
  element.setAttribute('role', 'toolbar');
  element.setAttribute('aria-label', label);
  return element;
}

export function createContextBubble(document: Document, className: string, label: string) {
  const element = document.createElement('div');
  element.className = `cherry-bubble ${className}`;
  return setupContextBubble(element, label);
}

/** Shared square hit target and inset visual state for Bubble actions. */
export function createContextButton(document: Document, options: ContextButtonOptions) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `cherry-toolbar-button cherry-milkdown-context-button${
    options.className ? ` ${options.className}` : ''
  }`;
  button.title = options.label;
  button.setAttribute('aria-label', options.label);

  const content = document.createElement('span');
  content.className = `cherry-milkdown-context-button__content${
    options.contentClassName ? ` ${options.contentClassName}` : ''
  }${options.icon ? ` ch-icon ${options.icon}` : ''}`;
  content.textContent = options.text ?? '';
  content.setAttribute('aria-hidden', 'true');
  button.append(content);
  return { button, content };
}
