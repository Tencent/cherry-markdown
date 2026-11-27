import { useEffect, useRef, useState } from 'react';
import { cherryMilkdown, type CherryMilkdownInstance, type CherryVisualRenderer } from '@cherry-markdown/milkdown';
import { createEChartsRenderers } from '@cherry-markdown/milkdown/echarts';
import basicMd from '../../../../examples/assets/markdown/index.md?raw';

declare global {
  interface Window {
    milkdownEditor?: CherryMilkdownInstance;
  }
}

// Kept out of the initial document: this small renderer makes the generic
// fenced-renderer contract reproducible in the browser test without adding a
// second editor or demo-only editor mode.
const customPreview: CherryVisualRenderer = ({ container, source }) => {
  const output = document.createElement('output');
  output.dataset.customPreview = '';
  output.textContent = source;
  container.replaceChildren(output);
};

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let instance: CherryMilkdownInstance | undefined;
    const host = root.current!;
    const params = new URLSearchParams(window.location.search);
    const charts = createEChartsRenderers({
      transformOption:
        params.get('chart-transform') === '1'
          ? (option) => {
              const series = Array.isArray(option.series) ? option.series : [option.series];
              for (const item of series) {
                if (item?.type === 'line' && item.name === 'Demo sales' && Array.isArray(item.data)) {
                  item.data = item.data.map((value) => (typeof value === 'number' ? value * 10 : value));
                }
              }
            }
          : undefined,
    });
    const oracleStyles = params.has('native-preview')
      ? import('cherry-markdown/dist/cherry-markdown.css')
      : Promise.resolve();
    void oracleStyles
      .then(() => {
        if (disposed) return;
        return cherryMilkdown({
          root: host,
          value: basicMd,
          renderers: { ...charts, 'custom-preview': customPreview },
          fileUpload: (file, callback, { signal }) => {
            const reader = new FileReader();
            signal.addEventListener('abort', () => reader.abort(), { once: true });
            reader.addEventListener('load', () => callback(String(reader.result ?? ''), { name: file.name }));
            reader.readAsDataURL(file);
          },
          onError: (cause, phase) => {
            // Renderer failures are already isolated and displayed by their node.
            // Only a failed editor boot should replace the whole demo surface.
            if (phase === 'create') setError(String(cause));
          },
        });
      })
      .then((editor) => {
        if (!editor) return;
        if (disposed) return editor.destroy();
        instance = editor;
        window.milkdownEditor = editor;
      })
      .catch((cause: unknown) => {
        if (!disposed) setError(String(cause));
      });

    return () => {
      disposed = true;
      delete window.milkdownEditor;
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
