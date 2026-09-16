export interface NativeBubbleLike {
  bubbleDom?: HTMLElement;
  bubbleTop?: HTMLElement;
  bubbleBottom?: HTMLElement;
  visible: boolean;
  $setBubbleCursorPosition?(left: string): void;
}

export interface ViewportRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function positionNativeBubble(bubble: NativeBubbleLike, rect: ViewportRect, ownerDocument: Document) {
  if (!bubble.bubbleDom) return;
  const bubbleDom = bubble.bubbleDom;
  bubbleDom.style.position = 'fixed';
  bubble.visible = true;
  const gap = 6;
  const height = bubbleDom.offsetHeight;
  const above = rect.top - height >= 8;
  const top = above ? rect.top - height - gap : rect.bottom + gap;
  const center = (rect.left + rect.right) / 2;
  const maxLeft = Math.max(8, ownerDocument.documentElement.clientWidth - bubbleDom.offsetWidth - 8);
  const left = Math.max(8, Math.min(maxLeft, center - bubbleDom.offsetWidth / 2));
  bubbleDom.style.top = `${top}px`;
  bubbleDom.style.left = `${left}px`;
  if (bubble.bubbleTop) bubble.bubbleTop.style.display = above ? 'none' : 'block';
  if (bubble.bubbleBottom) bubble.bubbleBottom.style.display = above ? 'block' : 'none';
  bubble.$setBubbleCursorPosition?.(`${Math.max(10, Math.min(bubbleDom.offsetWidth - 10, center - left))}px`);
}

export function isEditorRectVisible(root: HTMLElement, rect: ViewportRect) {
  const frameWindow = root.ownerDocument.defaultView;
  if (!frameWindow) return false;
  let top = 0;
  let left = 0;
  let right = frameWindow.innerWidth;
  let bottom = frameWindow.innerHeight;
  for (let element: HTMLElement | null = root; element; element = element.parentElement) {
    const style = frameWindow.getComputedStyle(element);
    if (!/(?:auto|scroll|hidden|clip)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)) continue;
    const boundary = element.getBoundingClientRect();
    top = Math.max(top, boundary.top);
    left = Math.max(left, boundary.left);
    right = Math.min(right, boundary.right);
    bottom = Math.min(bottom, boundary.bottom);
  }
  return rect.bottom > top && rect.top < bottom && rect.right > left && rect.left < right;
}
