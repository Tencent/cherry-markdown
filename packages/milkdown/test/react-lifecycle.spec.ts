import React, { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import { expect, it, vi } from 'vite-plus/test';
import { cherryMilkdown, type CherryMilkdownInstance } from '../src';

it('cleans both pending StrictMode editors when the component unmounts before initialization', async () => {
  const host = document.body.appendChild(document.createElement('div'));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started = 0;
  let waiting = 0;
  let cleaned = 0;
  const pending: Promise<void>[] = [];
  const errors: unknown[] = [];
  const delayedPlugin: MilkdownPlugin = () => async () => {
    waiting += 1;
    await gate;
    return () => {
      cleaned += 1;
    };
  };

  function Editor() {
    const element = useRef<HTMLDivElement>(null);
    useEffect(() => {
      let disposed = false;
      let editor: CherryMilkdownInstance | undefined;
      started += 1;
      const task = cherryMilkdown({ root: element.current!, value: 'Text', plugins: [delayedPlugin] })
        .then(async (instance) => {
          if (disposed) await instance.destroy();
          else editor = instance;
        })
        .catch((error: unknown) => {
          errors.push(error);
        });
      pending.push(task);
      return () => {
        disposed = true;
        if (editor) pending.push(editor.destroy());
      };
    }, []);
    return React.createElement('div', { ref: element });
  }

  const root = createRoot(host);
  try {
    root.render(React.createElement(StrictMode, null, React.createElement(Editor)));
    await vi.waitFor(() => expect(started).toBe(2), { timeout: 10_000 });
    await vi.waitFor(() => expect(waiting).toBe(2), { timeout: 10_000 });
    root.unmount();
    release();
    await Promise.all(pending);
    expect(errors).toEqual([]);
    expect(cleaned).toBe(2);
    expect(host.querySelector('.ProseMirror')).toBeNull();
  } finally {
    release();
    root.unmount();
    await Promise.allSettled(pending);
    host.remove();
  }
}, 20_000);
