// Clipboard contents are shared across editors. A newer request supersedes
// fallback work from an older one, even when they came from different nodes.
let current: AbortController | undefined;

export async function copyText(text: string, owner?: AbortSignal): Promise<boolean> {
  if (owner?.aborted) return false;
  current?.abort();
  const controller = new AbortController();
  current = controller;
  let inFallback = false;
  const onOtherCopy = () => {
    if (!inFallback) controller.abort();
  };
  const removeListeners = () => {
    document.removeEventListener('copy', onOtherCopy, true);
    document.removeEventListener('cut', onOtherCopy, true);
    owner?.removeEventListener('abort', onOwnerAbort);
  };
  const onOwnerAbort = () => controller.abort();
  document.addEventListener('copy', onOtherCopy, true);
  document.addEventListener('cut', onOtherCopy, true);
  owner?.addEventListener('abort', onOwnerAbort, { once: true });
  controller.signal.addEventListener('abort', removeListeners, { once: true });
  try {
    if (!text) throw new Error('没有提供任何内容进行复制');
    try {
      const clipboard = navigator.clipboard;
      if (clipboard && window.ClipboardItem) {
        await clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
        return !controller.signal.aborted;
      }
    } catch (error) {
      if (controller.signal.aborted) return false;
      console.warn('Clipboard API failed, falling back to execCommand:', error);
    }
    if (controller.signal.aborted) return false;
    let written = false;
    const listener = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      event.clipboardData.setData('text/plain', text);
      written = true;
      event.preventDefault();
    };
    document.addEventListener('copy', listener);
    try {
      inFallback = true;
      if (!document.execCommand('copy') || !written) throw new Error('Copy command was unsuccessful');
    } finally {
      inFallback = false;
      document.removeEventListener('copy', listener);
    }
    return !controller.signal.aborted;
  } catch (error) {
    if (controller.signal.aborted) return false;
    throw error;
  } finally {
    removeListeners();
    if (current === controller) current = undefined;
  }
}
