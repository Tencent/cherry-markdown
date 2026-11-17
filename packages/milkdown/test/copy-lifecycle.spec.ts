import { expect, it, vi } from 'vite-plus/test';
import { copyText } from '../src/wysiwyg/copy';

it('rejects a fallback that does not receive clipboard data and cleans up before the next copy', async () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalCommand = Object.getOwnPropertyDescriptor(document, 'execCommand');
  const written = vi.fn();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  Object.defineProperty(document, 'execCommand', { configurable: true, value: () => true });
  try {
    await expect(copyText('old')).rejects.toThrow('Copy command was unsuccessful');
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: () => {
        const event = new Event('copy', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'clipboardData', { value: { setData: written } });
        document.dispatchEvent(event);
        return true;
      },
    });
    await expect(copyText('new')).resolves.toBe(true);
    expect(written).toHaveBeenCalledExactlyOnceWith('text/plain', 'new');
  } finally {
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
    if (originalCommand) Object.defineProperty(document, 'execCommand', originalCommand);
    else Reflect.deleteProperty(document, 'execCommand');
  }
});

it.each(['copy', 'cut'])('removes clipboard listeners immediately after a later %s', async (eventName) => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  let rejectWrite!: (reason: Error) => void;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { write: () => new Promise<void>((_resolve, reject) => (rejectWrite = reject)) },
  });
  vi.stubGlobal('ClipboardItem', class {});
  const remove = vi.spyOn(document, 'removeEventListener');
  try {
    const result = copyText('old');
    document.dispatchEvent(new Event(eventName));
    expect(remove).toHaveBeenCalledWith('copy', expect.any(Function), true);
    expect(remove).toHaveBeenCalledWith('cut', expect.any(Function), true);
    rejectWrite(new Error('late failure'));
    await expect(result).resolves.toBe(false);
  } finally {
    remove.mockRestore();
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
    vi.unstubAllGlobals();
  }
});

it('cancels and releases listeners when the owning component is destroyed', async () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  let rejectWrite!: (reason: Error) => void;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { write: () => new Promise<void>((_resolve, reject) => (rejectWrite = reject)) },
  });
  vi.stubGlobal('ClipboardItem', class {});
  const remove = vi.spyOn(document, 'removeEventListener');
  const owner = new AbortController();
  try {
    const result = copyText('old', owner.signal);
    owner.abort();
    expect(remove).toHaveBeenCalledWith('copy', expect.any(Function), true);
    expect(remove).toHaveBeenCalledWith('cut', expect.any(Function), true);
    rejectWrite(new Error('late failure'));
    await expect(result).resolves.toBe(false);
    await expect(copyText('already destroyed', owner.signal)).resolves.toBe(false);
  } finally {
    remove.mockRestore();
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
    vi.unstubAllGlobals();
  }
});

it('destroying an old owner does not cancel a newer component copy', async () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const pending: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { write: () => new Promise<void>((resolve, reject) => pending.push({ resolve, reject })) },
  });
  vi.stubGlobal('ClipboardItem', class {});
  const oldOwner = new AbortController();
  const newOwner = new AbortController();
  try {
    const oldCopy = copyText('old', oldOwner.signal);
    const newCopy = copyText('new', newOwner.signal);
    oldOwner.abort();
    pending[1].resolve();
    await expect(newCopy).resolves.toBe(true);
    pending[0].reject(new Error('late failure'));
    await expect(oldCopy).resolves.toBe(false);
  } finally {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
    vi.unstubAllGlobals();
  }
});
