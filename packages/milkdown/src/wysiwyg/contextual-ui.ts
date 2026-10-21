interface ContextButtonOptions {
  label: string;
  text?: string;
  icon?: string;
  className?: string;
  contentClassName?: string;
}

interface ContextPlacementOptions {
  gap?: number;
  /** Preserve each control's existing vertical overflow policy. */
  bounds?: 'none' | 'bottom' | 'both';
  arrow?: HTMLElement;
}

/** Shared geometry only: callers still own visibility and selection policy. */
export function placeContextBubble(
  bubble: HTMLElement,
  rect: Pick<DOMRect, 'left' | 'top' | 'bottom' | 'width'>,
  { gap = 8, bounds = 'none', arrow }: ContextPlacementOptions = {},
) {
  const viewport = bubble.ownerDocument.documentElement;
  const width = bubble.offsetWidth;
  const height = bubble.offsetHeight;
  const above = rect.top - height - gap >= 8;
  const left = Math.max(8, Math.min(viewport.clientWidth - width - 8, rect.left + rect.width / 2 - width / 2));
  let top = above ? rect.top - height - gap : rect.bottom + gap;
  if (bounds === 'both') top = Math.max(8, Math.min(viewport.clientHeight - height - 8, top));
  else if (bounds === 'bottom' && !above) top = Math.min(viewport.clientHeight - height - 8, top);
  if (arrow) {
    bubble.classList.toggle('is-below', !above);
    arrow.className = above ? 'cherry-bubble-bottom' : 'cherry-bubble-top';
  }
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

/** Pointer controls must not take the document selection before their command. */
export function preserveContextSelection(event: Event) {
  event.preventDefault();
}

/** One viewport subscription contract, disposed by its owning editor plugin. */
export function watchContextViewport(document: Document, scroll: () => void, resize: () => void = scroll) {
  const window = document.defaultView;
  const onScroll = (event: Event) => {
    const target = event.target as Element | null;
    // Long URLs scroll their own input while typing. That does not move the
    // document anchor and must not dismiss the editor-owned form.
    if (target?.nodeType === 1 && target.closest('.cherry-milkdown-context-form')) return;
    scroll();
  };
  window?.addEventListener('scroll', onScroll, true);
  window?.addEventListener('resize', resize);
  return () => {
    window?.removeEventListener('scroll', onScroll, true);
    window?.removeEventListener('resize', resize);
  };
}

/** Coalesce positioning work without sharing state between controls or editors. */
export function createContextFrame(update: () => void) {
  let frame: number | undefined;
  const cancel = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };
  return {
    schedule() {
      cancel();
      frame = requestAnimationFrame(() => {
        frame = undefined;
        update();
      });
    },
    cancel,
  };
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
