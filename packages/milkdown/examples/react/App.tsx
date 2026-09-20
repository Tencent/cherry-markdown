import { useEffect, useRef, useState } from 'react';
import { cherryMilkdown, type CherryMilkdownInstance, type CherryVisualRenderer } from '@cherry-markdown/milkdown';
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
import '@cherry-markdown/milkdown/style.css';
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
    void cherryMilkdown({
      root: root.current!,
      value: basicMd,
      renderers: { echarts, tableChart, 'custom-preview': customPreview },
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
    })
      .then((editor) => {
        if (disposed) return editor.destroy();
        instance = editor;
        window.milkdownEditor = editor;
      })
      .catch((cause: unknown) => {
        setError(String(cause));
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
