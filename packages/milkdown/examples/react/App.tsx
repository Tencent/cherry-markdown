import { useEffect, useRef, useState } from 'react';
import { cherryMilkdown, type CherryMilkdownInstance } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';
import basicMd from '../../../../examples/assets/markdown/index.md?raw';
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';

declare global {
  interface Window {
    milkdownEditor?: CherryMilkdownInstance;
  }
}

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let instance: CherryMilkdownInstance | undefined;
    void cherryMilkdown({
      el: root.current!,
      value: basicMd,
      renderers: { echarts, tableChart },
      onError(error, phase) {
        // Diagram nodes display recoverable errors and clear them on success.
        if (!cancelled && phase !== 'render') setError(String(error));
      },
    })
      .then(async (editor) => {
        if (cancelled) await editor.destroy();
        else {
          instance = editor;
          window.milkdownEditor = editor;
        }
      })
      .catch((error) => {
        if (!cancelled) setError(String(error));
      });
    return () => {
      cancelled = true;
      if (window.milkdownEditor === instance) delete window.milkdownEditor;
      void instance?.destroy();
    };
  }, []);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div ref={root} id="markdown" />
    </>
  );
}
